import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { getPool } from '../db'
import { getMoyskladConfig, assertMoyskladReady } from './config'
import { moyskladRequest } from './client'
import { orderWithoutRepairMetadata, repairMetadataColumns, validateOrderLinkRepair, type RepairRemoteDocument, type RepairRow } from './order-link-repair'

export interface OrderLinkPlan {
  orderId: number
  orderNumber: string
  remoteId: string
  invoiceId: string
  invoiceNumber: string
  total: number
  companyName: string
  itemName: string
  quantity: number
  fingerprint: string
  contentHash: string
  remoteUpdated: string
  invoiceUpdated: string
}

interface RepairOptions {
  orderId: number
  apply?: boolean
  remoteId?: string
  invoiceId?: string
  expected?: { orderNumber: string; total: number; counterpartyId: string }
  fingerprint?: string
  allowedSalesChannels?: readonly string[]
  actorId?: string | number
  beforeApply?: (plan: OrderLinkPlan, previous: RepairRow) => void
}

const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i
const uuidFromReference = (href: string) => {
  const id = href.split('/').at(-1) || ''
  if (!uuid.test(id)) throw new Error('Некорректная ссылка на документ МойСклад')
  return id
}

/** Preview and apply share the same checks. No writes to MoySklad; the DB
 * transaction stores both the previous metadata and the repaired link.
 */
export async function repairMoyskladOrderLink(options: RepairOptions) {
  if (!Number.isSafeInteger(options.orderId) || options.orderId <= 0) throw new Error('Некорректный ID заказа')
  if (options.apply && !options.expected && !options.fingerprint) throw new Error('Сначала выполните проверку связи')
  const client = await getPool().connect()
  try {
    await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE')
    await client.query("SET LOCAL lock_timeout = '5s'")
    const readOrder = async () => (await client.query<{ row: RepairRow }>('SELECT to_jsonb(o) AS row FROM orders o WHERE id = $1 FOR UPDATE', [options.orderId])).rows[0]?.row
    const readItems = async () => (await client.query<RepairRow>('SELECT * FROM orders_items WHERE _parent_id = $1 ORDER BY _order FOR UPDATE', [options.orderId])).rows
    const order = await readOrder(), items = await readItems()
    if (!order) throw new Error('Заказ сайта не найден')
    const channel = order.sales_channel === 'retail' ? 'retail' : 'wholesale'
    if (options.allowedSalesChannels && !options.allowedSalesChannels.includes(channel)) throw new Error('Нет доступа к этому контуру продаж')
    const config = getMoyskladConfig(channel)
    assertMoyskladReady(config)
    if (!config.organizationId) throw new Error('Организация МойСклад не настроена')
    const expected = options.expected || {
      orderNumber: String(order.order_id || ''), total: Number(order.total), counterpartyId: String(order.moysklad_counterparty_id || ''),
    }
    if (!expected.orderNumber || /[;=]/.test(expected.orderNumber) || !uuid.test(expected.counterpartyId)) {
      throw new Error('Для проверки нужен номер заказа и сохранённая связь контрагента')
    }
    let remoteId = options.remoteId || String(order.moysklad_customer_order_id || '')
    if (!remoteId) {
      const query = new URLSearchParams({ filter: `name=${expected.orderNumber}`, limit: '2' })
      const found = await moyskladRequest<{ rows: { id: string }[]; meta: { size: number } }>(`entity/customerorder?${query}`, {}, config)
      if (found.meta.size !== 1 || found.rows.length !== 1) throw new Error('Не найден единственный документ с этим номером; требуется ручная сверка')
      remoteId = found.rows[0].id
    }
    const readRemote = async (entity: 'customerorder' | 'invoiceout', id: string) => {
      if (!uuid.test(id)) throw new Error('Некорректный ID документа МойСклад')
      const document = await moyskladRequest<RepairRemoteDocument>(`entity/${entity}/${id}?expand=positions.assortment`, {}, config)
      if (document.id !== id) throw new Error('API вернул другой ID документа')
      return document
    }
    const remote = await readRemote('customerorder', remoteId)
    let invoiceId = options.invoiceId || String(order.moysklad_invoice_out_id || '')
    if (!invoiceId) {
      if (remote.invoicesOut?.length !== 1) throw new Error('У документа нет единственного связанного счёта; требуется ручная сверка')
      invoiceId = uuidFromReference(remote.invoicesOut[0].meta.href)
    }
    const invoice = await readRemote('invoiceout', invoiceId)
    const validation = { ...expected, organizationId: config.organizationId }
    const contentHash = validateOrderLinkRepair(order, items, remote, invoice, validation)
    const duplicates = await client.query('SELECT id FROM orders WHERE id <> $1 AND (moysklad_customer_order_id = $2 OR moysklad_invoice_out_id = $3)', [options.orderId, remoteId, invoiceId])
    if (duplicates.rows.length) throw new Error('Документ или счёт уже привязаны к другому заказу сайта')
    const fingerprint = createHash('sha256').update(JSON.stringify({ order: orderWithoutRepairMetadata(order), items, remoteId, invoiceId, remoteUpdated: remote.updated, invoiceUpdated: invoice.updated })).digest('hex')
    const plan: OrderLinkPlan = {
      orderId: options.orderId, orderNumber: expected.orderNumber, remoteId, invoiceId, invoiceNumber: invoice.name,
      total: expected.total, companyName: String(order.company_name || ''),
      itemName: `${items[0].product_name} — ${items[0].variant_name}`, quantity: Number(items[0].quantity),
      contentHash, fingerprint, remoteUpdated: remote.updated, invoiceUpdated: invoice.updated,
    }
    if (!options.apply) {
      await client.query('ROLLBACK')
      return { ...plan, changed: false }
    }
    if (options.fingerprint && options.fingerprint !== fingerprint) throw new Error('Данные изменились после проверки. Проверьте связь ещё раз')
    if (order.moysklad_customer_order_id === remoteId && order.moysklad_invoice_out_id === invoiceId &&
        order.moysklad_synced_hash === contentHash && order.moysklad_sync_status === 'synced' && !order.moysklad_sync_error) {
      await client.query('ROLLBACK')
      return { ...plan, changed: false, alreadyLinked: true }
    }
    const previous = Object.fromEntries(repairMetadataColumns.map(key => [key, order[key]]))
    options.beforeApply?.(plan, previous)
    // A durable rollback record is mandatory; failure to write it aborts repair.
    await client.query(`INSERT INTO public.moysklad_sync_logs
      (entity_type, local_id, moysklad_id, direction, status, message, payload, response)
      VALUES ('order-link-repair', $1, $2, 'moysklad_to_site', 'success', $3, $4::jsonb, $5::jsonb)`,
    [String(options.orderId), remoteId, 'Восстановлена только техническая связь заказа и счёта',
      JSON.stringify({ actorId: options.actorId ?? null, previous }), JSON.stringify(plan)])
    await client.query(`UPDATE orders SET moysklad_customer_order_id = $2, moysklad_invoice_out_id = $3,
      moysklad_sync_status = 'synced', moysklad_sync_error = '', moysklad_synced_at = NOW(), moysklad_synced_hash = $4
      WHERE id = $1`, [options.orderId, remoteId, invoiceId, contentHash])
    const after = await readOrder(), afterItems = await readItems()
    if (!after || !isDeepStrictEqual(orderWithoutRepairMetadata(order), orderWithoutRepairMetadata(after)) || !isDeepStrictEqual(items, afterItems)) {
      throw new Error('Изменились данные вне разрешённых метаданных; операция отменена')
    }
    if (after.moysklad_customer_order_id !== remoteId || after.moysklad_invoice_out_id !== invoiceId ||
        after.moysklad_synced_hash !== contentHash || after.moysklad_sync_status !== 'synced' ||
        after.moysklad_sync_error !== '' || !after.moysklad_synced_at) throw new Error('Метаданные связи не сохранились; операция отменена')
    const remoteAfter = await readRemote('customerorder', remoteId), invoiceAfter = await readRemote('invoiceout', invoiceId)
    validateOrderLinkRepair(after, afterItems, remoteAfter, invoiceAfter, validation)
    if (remoteAfter.updated !== remote.updated || invoiceAfter.updated !== invoice.updated) throw new Error('Документ МойСклад изменился во время проверки; операция отменена')
    await client.query('COMMIT')
    return { ...plan, changed: true }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}
