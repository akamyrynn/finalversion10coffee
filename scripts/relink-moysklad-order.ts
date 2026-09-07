import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { getPool } from '../lib/db'
import { getMoyskladConfig, assertMoyskladReady } from '../lib/moysklad/config'
import { moyskladRequest } from '../lib/moysklad/client'
import { validateOrderLinkRepair, orderWithoutRepairMetadata, repairMetadataColumns, type RepairRow, type RepairRemoteDocument } from '../lib/moysklad/order-link-repair'

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
  const client = await getPool().connect()
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE')
    await client.query("SET LOCAL lock_timeout = '5s'")
    const readOrder = async () => (await client.query<{ row: RepairRow }>('SELECT to_jsonb(o) AS row FROM orders o WHERE id = $1 FOR UPDATE', [orderId])).rows[0]?.row
    const readItems = async () => (await client.query<RepairRow>('SELECT * FROM orders_items WHERE _parent_id = $1 ORDER BY _order FOR UPDATE', [orderId])).rows
    const order = await readOrder(), items = await readItems()
    if (!order) throw new Error('Заказ сайта не найден')
    const config = getMoyskladConfig(order.sales_channel === 'retail' ? 'retail' : 'wholesale')
    assertMoyskladReady(config)
    if (!config.organizationId) throw new Error('Организация МойСклад не настроена')
    const getRemote = (entity: string, id: string) => moyskladRequest<RepairRemoteDocument>(`entity/${entity}/${id}?expand=positions.assortment`, {}, config)
    const remote = await getRemote('customerorder', remoteId), invoice = await getRemote('invoiceout', invoiceId)
    if (remote.id !== remoteId || invoice.id !== invoiceId) throw new Error('API вернул другой ID документа')
    const hash = validateOrderLinkRepair(order, items, remote, invoice, { orderNumber, total, counterpartyId, organizationId: config.organizationId })
    const duplicates = await client.query('SELECT id FROM orders WHERE id <> $1 AND (moysklad_customer_order_id = $2 OR moysklad_invoice_out_id = $3)', [orderId, remoteId, invoiceId])
    if (duplicates.rows.length) throw new Error('Документ или счёт уже привязаны к другому заказу сайта')
    const plan = { orderId, orderNumber, remoteId, invoiceId, total, contentHash: hash, mode: values.apply ? 'apply' : 'read-only' }
    if (!values.apply) {
      await client.query('ROLLBACK')
      console.log(JSON.stringify({ ...plan, verified: true, changed: false }, null, 2))
      return
    }
    if (order.moysklad_customer_order_id === remoteId && order.moysklad_invoice_out_id === invoiceId &&
        order.moysklad_synced_hash === hash && order.moysklad_sync_status === 'synced' && !order.moysklad_sync_error) {
      await client.query('ROLLBACK')
      console.log(JSON.stringify({ ...plan, alreadyLinked: true, changed: false }, null, 2))
      return
    }
    const backupFile = resolve(values['backup-file']!)
    writeFileSync(backupFile, JSON.stringify({ ...plan, previous: Object.fromEntries(repairMetadataColumns.map(key => [key, order[key]])), remoteUpdated: remote.updated, invoiceUpdated: invoice.updated }, null, 2), { flag: 'wx', mode: 0o600 })
    await client.query(`UPDATE orders SET moysklad_customer_order_id = $2, moysklad_invoice_out_id = $3,
      moysklad_sync_status = 'synced', moysklad_sync_error = '', moysklad_synced_at = NOW(), moysklad_synced_hash = $4
      WHERE id = $1`, [orderId, remoteId, invoiceId, hash])
    const after = await readOrder(), afterItems = await readItems()
    if (!after || !isDeepStrictEqual(orderWithoutRepairMetadata(order), orderWithoutRepairMetadata(after)) || !isDeepStrictEqual(items, afterItems)) {
      throw new Error('Защитная проверка: изменились данные вне разрешённых метаданных, операция отменена')
    }
    if (after.moysklad_customer_order_id !== remoteId || after.moysklad_invoice_out_id !== invoiceId ||
        after.moysklad_synced_hash !== hash || after.moysklad_sync_status !== 'synced' ||
        after.moysklad_sync_error !== '' || !after.moysklad_synced_at) {
      throw new Error('Метаданные связи не сохранились, операция отменена')
    }
    const remoteAfter = await getRemote('customerorder', remoteId), invoiceAfter = await getRemote('invoiceout', invoiceId)
    validateOrderLinkRepair(after, afterItems, remoteAfter, invoiceAfter, { orderNumber, total, counterpartyId, organizationId: config.organizationId })
    if (remoteAfter.updated !== remote.updated || invoiceAfter.updated !== invoice.updated) throw new Error('Документ МойСклад изменился во время проверки; операция отменена')
    await client.query('COMMIT')
    console.log(JSON.stringify({ ...plan, verified: true, changed: true, backupFile }, null, 2))
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Ошибка восстановления связи'); process.exitCode = 1 })
  .finally(async () => { if (globalThis.__coffeePgPool) await globalThis.__coffeePgPool.end() })
