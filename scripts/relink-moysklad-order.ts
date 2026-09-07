import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { repairMoyskladOrderLink } from '../lib/moysklad/order-link-service'

async function main() {
  const { values } = parseArgs({ options: {
    'order-id': { type: 'string' }, 'order-number': { type: 'string' }, 'remote-order-id': { type: 'string' },
    'remote-invoice-id': { type: 'string' }, 'expect-total': { type: 'string' }, 'expect-counterparty-id': { type: 'string' },
    'backup-file': { type: 'string' }, apply: { type: 'boolean', default: false }, help: { type: 'boolean' },
  } })
  if (values.help) {
    console.log('Read-only by default. Required: --order-id N --order-number NUMBER --remote-order-id UUID --remote-invoice-id UUID --expect-total RUB --expect-counterparty-id UUID. To apply verified links only: --apply --backup-file PATH (new file).')
    return
  }
  const orderId = Number(values['order-id'])
  const total = Number(values['expect-total'])
  const orderNumber = values['order-number']
  const remoteId = values['remote-order-id'] || '', invoiceId = values['remote-invoice-id'] || ''
  const counterpartyId = values['expect-counterparty-id'] || ''
  const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
  if (!Number.isSafeInteger(orderId) || orderId <= 0 || !orderNumber || !Number.isFinite(total) || total <= 0 ||
      ![remoteId, invoiceId, counterpartyId].every(value => uuid.test(value))) throw new Error('Укажите все проверенные параметры заказа')
  if (values.apply && !values['backup-file']) throw new Error('Для применения требуется новый файл резервной копии метаданных')
  const result = await repairMoyskladOrderLink({
    orderId, remoteId, invoiceId, apply: values.apply,
    expected: { orderNumber, total, counterpartyId },
    beforeApply: (plan, previous) => {
      writeFileSync(resolve(values['backup-file']!), JSON.stringify({ ...plan, previous }, null, 2), { flag: 'wx', mode: 0o600 })
    },
  })
  console.log(JSON.stringify({ ...result, verified: true, mode: values.apply ? 'apply' : 'read-only' }, null, 2))
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Ошибка восстановления связи'); process.exitCode = 1 })
  .finally(async () => { if (globalThis.__coffeePgPool) await globalThis.__coffeePgPool.end() })
