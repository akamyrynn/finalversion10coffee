import { computeOrderContentHash } from "./order-hash"

export type RepairRow = Record<string, unknown>
export interface RepairRemoteDocument {
  id: string
  name: string
  updated: string
  sum: number
  agent: { meta: { href: string } }
  organization: { meta: { href: string } }
  customerOrder?: { meta: { href: string } }
  positions: { rows: { quantity: number; price: number; discount: number; assortment: { name: string } }[]; meta: { size: number } }
}

const referenceId = (href: string) => href.split('/').at(-1)
const normalizedLabel = (name: string) => name.toLowerCase().replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]/gu, '')

export const repairMetadataColumns = [
  'moysklad_customer_order_id', 'moysklad_invoice_out_id', 'moysklad_sync_status',
  'moysklad_sync_error', 'moysklad_synced_at', 'moysklad_synced_hash',
] as const

export function repairOrderContentHash(order: RepairRow, items: RepairRow[]) {
  return computeOrderContentHash({
    subtotal: Number(order.subtotal), discountAmount: Number(order.discount_amount),
    deliveryCost: Number(order.delivery_cost), total: Number(order.total),
    deliveryMethod: String(order.delivery_method || ''), deliveryAddress: String(order.delivery_address || ''),
    companyInn: String(order.company_inn || ''),
    items: items.map(item => ({
      productName: String(item.product_name || ''), variantName: String(item.variant_name || ''),
      grindOption: String(item.grind_option || ''), quantity: Number(item.quantity), unitPrice: Number(item.unit_price),
    })),
  })
}

export function orderWithoutRepairMetadata(order: RepairRow) {
  return Object.fromEntries(Object.entries(order).filter(([key]) => !repairMetadataColumns.some(column => column === key)))
}

/** Deliberately conservative: the incident involves a single product line
 * without delivery. More complex documents require a separate reviewed plan.
 * Matching only a document number is never sufficient to establish a link.
 */
export function validateOrderLinkRepair(
  order: RepairRow, items: RepairRow[], remote: RepairRemoteDocument, invoice: RepairRemoteDocument,
  expected: { orderNumber: string; total: number; counterpartyId: string; organizationId: string },
) {
  const requireMatch = (condition: boolean, message: string) => { if (!condition) throw new Error(message) }
  requireMatch(order.order_id === expected.orderNumber && remote.name === expected.orderNumber, 'Номер заказа не совпадает с проверенным')
  requireMatch(Number(order.total) === expected.total && Number.isFinite(expected.total) && expected.total > 0, 'Итог сайта изменился')
  requireMatch(order.moysklad_counterparty_id === expected.counterpartyId, 'Связь контрагента сайта не совпадает')
  requireMatch(!order.moysklad_customer_order_id || order.moysklad_customer_order_id === remote.id, 'Заказ сайта уже связан с другим документом')
  requireMatch(!order.moysklad_invoice_out_id || order.moysklad_invoice_out_id === invoice.id, 'Заказ сайта уже связан с другим счётом')
  requireMatch(referenceId(invoice.customerOrder?.meta.href || '') === remote.id, 'Счёт относится к другому заказу')
  requireMatch(items.length === 1 && Number(order.delivery_cost || 0) === 0, 'Для этого состава заказа нужна отдельная проверка связи')
  const item = items[0]
  const quantity = Number(item.quantity), unitPrice = Number(item.unit_price)
  requireMatch(Number.isFinite(quantity) && quantity > 0 && Number.isFinite(unitPrice) && unitPrice > 0, 'Некорректная позиция сайта')
  requireMatch(Math.round(quantity * unitPrice * 100) === Math.round(Number(order.subtotal) * 100), 'Подытог не соответствует позиции сайта')
  requireMatch(Math.round((Number(order.subtotal) - Number(order.discount_amount)) * 100) === Math.round(expected.total * 100), 'Скидка не соответствует итогу сайта')
  for (const document of [remote, invoice]) {
    requireMatch(Boolean(document.updated), 'Нет версии документа для проверки одновременных изменений')
    requireMatch(referenceId(document.agent?.meta.href || '') === expected.counterpartyId, 'Контрагент документа не совпадает')
    requireMatch(referenceId(document.organization?.meta.href || '') === expected.organizationId, 'Организация документа не совпадает')
    requireMatch(Math.round(document.sum) === Math.round(expected.total * 100), 'Сумма документа не совпадает с сайтом')
    requireMatch(document.positions?.meta?.size === 1 && document.positions.rows.length === 1, 'Состав документа не совпадает')
    const position = document.positions.rows[0]
    requireMatch(normalizedLabel(position.assortment?.name || '') === normalizedLabel(`${item.product_name} ${item.variant_name}`), 'Товар или фасовка не совпадают')
    requireMatch(position.quantity === quantity && position.price === Math.round(unitPrice * 100), 'Количество или цена не совпадают')
    requireMatch(Math.round(position.quantity * position.price * (1 - position.discount / 100)) === Math.round(expected.total * 100), 'Итог позиции документа не совпадает')
  }
  return repairOrderContentHash(order, items)
}
