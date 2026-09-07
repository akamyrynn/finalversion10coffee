/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner */
// Real integration modules, isolated HTTP/database adapters; no live orders.
const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
const compiled = new Map()

function fixture({ respond, config: overrides = {}, signalAPI = AbortSignal, onDelay } = {}) {
  const calls = [], waits = [], updates = []
  const config = {
    enabled: true, syncOrdersOnCreate: true, authMode: 'bearer', token: 'test-only',
    baseUrl: 'https://moysklad.invalid/api/remap/1.2', organizationId: 'organization',
    storeId: 'store', salesChannelId: 'channel', vatEnabled: false,
    createInvoiceOnOrder: false, ...overrides,
  }
  const payload = {
    update: async (input) => { updates.push(input); return { id: input.id, ...input.data } },
    findByID: async () => ({ id: 382 }),
  }
  const fetchMock = async (url, init) => {
    const requestPath = url.replace(config.baseUrl + '/', '')
    const call = { path: requestPath, method: init.method || 'GET', init }
    calls.push(call)
    const response = await respond?.(call, calls.length)
    if (response) return response
    if (call.method === 'GET' && requestPath.includes('?')) return Response.json({ rows: [] })
    if (requestPath.startsWith('entity/variant/')) return Response.json({ id: 'variant', name: 'Coffee 250g' })
    if (requestPath.startsWith('entity/product/')) return Response.json({ id: 'product' })
    if (call.method === 'POST' || call.method === 'PUT') return Response.json({ id: 'remote-id' })
    throw new Error(`Unexpected HTTP call: ${call.method} ${requestPath}`)
  }
  const modules = new Map()
  const mocks = {
    'lib/moysklad/config': { getMoyskladConfig: () => config, assertMoyskladReady() {} },
    'lib/moysklad/logs': { writeMoyskladLog: async () => {} },
    'lib/moysklad/order-hash': { computeOrderContentHash: () => 'hash' },
    'lib/utils/constants': { DELIVERY_METHOD_LABELS: {} },
    'lib/db': { dbQuery: async () => { throw new Error('Unexpected SQL mutation') } },
    'node:timers/promises': { setTimeout: async (ms, value, options) => {
      waits.push(ms)
      await onDelay?.()
      options?.signal?.throwIfAborted()
      return value
    } },
  }
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports
    const loaded = { exports: {} }
    modules.set(file, loaded)
    if (!compiled.has(file)) {
      compiled.set(file, ts.transpileModule(fs.readFileSync(path.join(root, file + '.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText)
    }
    const localRequire = (id) => {
      const target = id.startsWith('@/') ? id.slice(2) : id.startsWith('.')
        ? path.posix.normalize(path.posix.join(path.posix.dirname(file), id)) : id
      if (Object.hasOwn(mocks, target)) return mocks[target]
      if (['lib/moysklad/client', 'lib/moysklad/sync', 'lib/moysklad/bundles'].includes(target)) return load(target)
      throw new Error(`Unexpected dependency: ${id}`)
    }
    vm.runInNewContext(`(function(require,module,exports){${compiled.get(file)}\n})`, {
      fetch: fetchMock, AbortSignal: signalAPI, Buffer, URLSearchParams,
      TypeError, Error, console: { error() {} },
    }, { filename: file })(localRequire, loaded, loaded.exports)
    return loaded.exports
  }
  const client = load('lib/moysklad/client')
  const sync = load('lib/moysklad/sync')
  const params = {
    payload, order: { id: 382, orderId: '10C-00382', customerType: 'business' },
    client: { moyskladCounterpartyId: 'counterparty' },
    cartItems: [{ id: 'line', quantity: 1, product_id: 'local-product', variant_id: 'local-variant',
      product: { name: 'Coffee', moysklad_id: 'product' }, variant: { name: '250g', price: 500 } }],
  }
  return { client, sync, load, params, payload, calls, waits, updates }
}

const unavailable = () => new Response('<html>unavailable</html>', { status: 503 })
const writes = (f, entity) => f.calls.filter(c => c.path === `entity/${entity}` && c.method === 'POST')

test('read recovers after HTTP 503 and waits before retrying', async () => {
  const f = fixture({ respond: (call, n) => n === 1 ? unavailable() : Response.json({ rows: [{ id: 'existing' }] }) })
  const result = await f.client.moyskladGetList('entity/customerorder')
  assert.equal(result.rows[0].id, 'existing')
  assert.equal(f.calls.length, 2)
  assert.deepEqual(f.waits, [2000])
})

test('persistent 503 stops after three attempts with operation context but no private query/body', async () => {
  const f = fixture({ respond: unavailable })
  await assert.rejects(f.client.moyskladGetList('entity/counterparty', { filter: 'email=private@example.com' }), error => {
    assert.equal(error.status, 503)
    assert.match(error.message, /HTTP 503; GET entity\/counterparty/)
    assert.doesNotMatch(error.message, /private|example|html|test-only/)
    return true
  })
  assert.equal(f.calls.length, 3)
  assert.deepEqual(f.waits, [2000, 4000])
})

for (const method of ['POST', 'PUT', 'DELETE']) {
  test(`${method} is never replayed after an ambiguous 503 response`, async () => {
    const f = fixture({ respond: unavailable })
    await assert.rejects(f.client.moyskladRequest('entity/customerorder', { method }), { status: 503 })
    assert.equal(f.calls.length, 1)
    assert.deepEqual(f.waits, [])
  })
}

test('rate limiting respects server delay and retains rejected-write retries', async () => {
  const f = fixture({ respond: (call, n) => n === 1 ? Response.json({ errors: [{ code: 1049 }] }, {
    status: 429, headers: { 'Retry-After': '3', 'X-Lognex-Retry-After': '4500' },
  }) : Response.json({ id: 'created' }) })
  assert.equal((await f.client.moyskladRequest('entity/customerorder', { method: 'POST' })).id, 'created')
  assert.deepEqual(f.waits, [4500])
})

test('long Retry-After stops inline retries instead of retrying too early', async () => {
  const f = fixture({ respond: () => new Response('', { status: 503, headers: { 'Retry-After': '120' } }) })
  await assert.rejects(f.client.moyskladGetList('entity/customerorder'), { status: 503 })
  assert.equal(f.calls.length, 1)
  assert.deepEqual(f.waits, [])
})

test('authorization and validation errors are not retried', async () => {
  for (const status of [400, 401, 403, 404, 412]) {
    const f = fixture({ respond: () => Response.json({ errors: [{ code: 1000 }] }, { status }) })
    await assert.rejects(f.client.moyskladGetList('entity/customerorder'), { status })
    assert.equal(f.calls.length, 1)
  }
})

test('connection loss is retried for reads only', async () => {
  for (const method of ['GET', 'POST']) {
    const f = fixture({ respond: () => { throw new TypeError('fetch failed') } })
    await assert.rejects(f.client.moyskladRequest('entity/customerorder', { method }), { status: 0 })
    assert.equal(f.calls.length, method === 'GET' ? 3 : 1)
  }
})

test('every request has a deadline, and caller cancellation stops retries', async () => {
  const deadlines = []
  const f = fixture({ signalAPI: {
    timeout(ms) { deadlines.push(ms); return AbortSignal.abort(new Error('Timeout')) },
    any: AbortSignal.any,
  }, respond: call => call.init.signal.throwIfAborted() })
  await assert.rejects(f.client.moyskladGetList('entity/customerorder'), /не ответил за 30 секунд/)
  assert.deepEqual(deadlines, [30000, 30000, 30000])
  const abort = new AbortController()
  const g = fixture({ respond: unavailable, onDelay: () => abort.abort() })
  await assert.rejects(g.client.moyskladRequest('entity/customerorder', { signal: abort.signal }), { name: 'AbortError' })
  assert.equal(g.calls.length, 1)
})

test('failed order lookup stops creation and records a recoverable sync error', async () => {
  const f = fixture({ respond: c => c.path.startsWith('entity/customerorder?') ? unavailable() : undefined })
  const result = await f.sync.syncOrderToMoysklad(f.params)
  assert.match(result.error, /HTTP 503/)
  assert.equal(writes(f, 'customerorder').length, 0)
  assert.equal(f.updates.at(-1).data.moyskladSyncStatus, 'error')
})

test('failed invoice lookup keeps the exported order ID and does not create an invoice', async () => {
  const f = fixture({ config: { createInvoiceOnOrder: true },
    respond: c => c.path.startsWith('entity/invoiceout?') ? unavailable() : undefined })
  const result = await f.sync.syncOrderToMoysklad(f.params)
  assert.match(result.error, /GET entity\/invoiceout/)
  assert.equal(writes(f, 'invoiceout').length, 0)
  assert.equal(f.updates.at(-1).data.moyskladCustomerOrderId, 'remote-id')
})

test('failed stock loss lookup never creates a second stock loss', async () => {
  const f = fixture({ respond: unavailable })
  await assert.rejects(f.sync.ensureMoyskladStockLossForOrder(f.payload, {
    id: 382, items: [{ stockProductMoyskladId: 'product', stockQuantityKg: 0.25, stockPricePerKg: 200000 }],
  }), { status: 503 })
  assert.equal(writes(f, 'loss').length, 0)
})

test('failed linked counterparty read does not clear the company link or create a replacement', async () => {
  const f = fixture({ respond: c => c.method === 'GET' ? unavailable() : undefined })
  f.params.company = { id: 'company', inn: '1234567890', moyskladCounterpartyId: 'linked' }
  const result = await f.sync.syncOrderToMoysklad(f.params)
  assert.match(result.error, /GET entity\/counterparty\/linked/)
  assert.equal(writes(f, 'counterparty').length, 0)
})

test('bundle lookup failure stops creation; the same process can retry successfully after recovery', async () => {
  let failing = true
  const f = fixture({ respond: c => failing && c.path.startsWith('entity/bundle?') ? unavailable() : undefined })
  f.params.cartItems[0].product.product_type_schema = 'coffee'
  Object.assign(f.params.cartItems[0].variant, { moysklad_id: 'variant', weight_grams: 250 })
  assert.match((await f.sync.syncOrderToMoysklad(f.params)).error, /GET entity\/bundle/)
  assert.equal(writes(f, 'bundle').length, 0)
  assert.equal(writes(f, 'customerorder').length, 0)
  failing = false
  assert.equal((await f.sync.syncOrderToMoysklad(f.params)).success, true)
  assert.equal(writes(f, 'bundle').length, 1)
})

test('unit lookup failure is not cached as piece accounting', async () => {
  let failing = true
  const f = fixture({ respond: c => c.path.includes('expand=uom')
    ? failing ? unavailable() : Response.json({ uom: { name: 'кг' } }) : undefined })
  f.params.cartItems[0].product.product_type_schema = 'coffee'
  f.params.cartItems[0].variant.weight_grams = 250
  assert.match((await f.sync.syncOrderToMoysklad(f.params)).error, /HTTP 503/)
  failing = false
  assert.match((await f.sync.syncOrderToMoysklad(f.params)).error, /Позиции не готовы/)
  assert.equal(f.calls.filter(c => c.path.includes('expand=uom')).length, 4)
  assert.equal(writes(f, 'customerorder').length, 0)
})

const uniquenessConflict = () => Response.json({
  errors: [{ code: 3006, error: "Нарушено ограничение уникальности параметра 'name'" }],
}, { status: 412 })

for (const entity of ['customerorder', 'invoiceout']) {
  test(`${entity} uniqueness conflict uses supported filters, remains unresolved, and never deletes documents`, async () => {
    const f = fixture({ config: { createInvoiceOnOrder: entity === 'invoiceout' }, respond: c => {
      if (decodeURIComponent(c.path).includes('archived')) {
        return Response.json({ errors: [{ code: 1034, error: "Неизвестное поле фильтрации 'archived'" }] }, { status: 412 })
      }
      if (c.path === `entity/${entity}` && c.method === 'POST') return uniquenessConflict()
    } })
    const result = await f.sync.syncOrderToMoysklad(f.params)
    assert.match(result.error, /конфликт уникальности.*3006/)
    assert.doesNotMatch(result.error, /находится в корзине|1034|archived/)
    assert.equal(result.trashed, false)
    assert.equal(writes(f, entity).length, 1)
    assert.equal(f.calls.some(c => c.method === 'DELETE' || decodeURIComponent(c.path).includes('archived')), false)
    assert.equal(f.updates.at(-1).data.moyskladSyncStatus, 'error')
    if (entity === 'invoiceout') assert.equal(f.updates.at(-1).data.moyskladCustomerOrderId, 'remote-id')
  })

  test(`${entity} created by a concurrent export is reused by external code without resetting order state`, async () => {
    let lookups = 0
    const externalCode = entity === 'customerorder' ? '382' : '10C-00382-invoice'
    const f = fixture({ config: { createInvoiceOnOrder: entity === 'invoiceout', defaultOrderStateId: 'new-state' }, respond: c => {
      if (c.method === 'GET' && c.path.startsWith(`entity/${entity}?`)) {
        const query = new URLSearchParams(c.path.split('?')[1])
        assert.equal(query.get('filter'), `externalCode=${externalCode}`)
        return Response.json({ rows: ++lookups === 1 ? [] : [{ id: 'concurrent-id', externalCode }] })
      }
      if (c.path === `entity/${entity}` && c.method === 'POST') return uniquenessConflict()
      if (c.path === `entity/${entity}/concurrent-id` && c.method === 'PUT') return Response.json({ id: 'concurrent-id' })
    } })
    const result = await f.sync.syncOrderToMoysklad(f.params)
    assert.equal(result.success, true)
    assert.equal(entity === 'customerorder' ? result.moyskladOrderId : result.moyskladInvoiceOutId, 'concurrent-id')
    assert.equal(writes(f, entity).length, 1)
    assert.equal(f.calls.some(c => c.method === 'DELETE'), false)
    const update = f.calls.find(c => c.path === `entity/${entity}/concurrent-id` && c.method === 'PUT')
    assert.ok(update)
    assert.equal(JSON.parse(update.init.body).state, undefined)
  })

  test(`${entity} explicitly in trash is not deleted or recreated`, async () => {
    const f = fixture({ config: { createInvoiceOnOrder: entity === 'invoiceout' }, respond: c => {
      if (c.method === 'PUT' && c.path === `entity/${entity}/trashed-id`) {
        return Response.json({ errors: [{ code: 3007, error: 'Документ находится в корзине' }] }, { status: 412 })
      }
    } })
    f.params.order[entity === 'customerorder' ? 'moyskladCustomerOrderId' : 'moyskladInvoiceOutId'] = 'trashed-id'
    const result = await f.sync.syncOrderToMoysklad(f.params)
    assert.equal(result.trashed, true)
    assert.match(result.error, /находится в корзине/)
    assert.equal(writes(f, entity).length, 0)
    assert.equal(f.calls.some(c => c.method === 'DELETE'), false)
  })
}

test('503 during conflict reconciliation stays an API failure and does not trigger another create', async () => {
  let lookups = 0
  const f = fixture({ respond: c => {
    if (c.method === 'GET' && c.path.startsWith('entity/customerorder?') && ++lookups > 1) return unavailable()
    if (c.path === 'entity/customerorder' && c.method === 'POST') return uniquenessConflict()
  } })
  const result = await f.sync.syncOrderToMoysklad(f.params)
  assert.match(result.error, /HTTP 503; GET entity\/customerorder/)
  assert.equal(result.trashed, false)
  assert.equal(writes(f, 'customerorder').length, 1)
})
