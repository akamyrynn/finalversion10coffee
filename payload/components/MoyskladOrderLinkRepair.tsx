"use client"

import { useState } from 'react'
import { useAuth, useDocumentInfo, useFormModified } from '@payloadcms/ui'
import { canRunIntegrations } from '../access/adminRoles'
import type { OrderLinkPlan } from '../../lib/moysklad/order-link-service'

export default function MoyskladOrderLinkRepair() {
  const { id, initialData } = useDocumentInfo()
  const { user } = useAuth()
  const modified = useFormModified()
  const [plan, setPlan] = useState<OrderLinkPlan | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const data = initialData as Record<string, unknown>
  if (!id || !canRunIntegrations(user) || (data?.moyskladCustomerOrderId && data?.moyskladInvoiceOutId)) return null

  async function run(mode: 'preview' | 'apply') {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/orders/moysklad/relink', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: Number(id), mode, fingerprint: mode === 'apply' ? plan?.fingerprint : undefined }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Не удалось проверить связь')
      if (mode === 'apply') setDone(true)
      else setPlan(result)
    } catch (error) {
      setPlan(null)
      setError(error instanceof Error ? error.message : 'Ошибка соединения')
    } finally { setBusy(false) }
  }

  return <section style={{ padding: 16, marginBottom: 20, border: '1px solid var(--theme-elevation-200)', borderRadius: 8 }}>
    <h3 style={{ marginTop: 0 }}>Связь с существующим заказом МойСклад</h3>
    <p>Если заказ уже оформлен в МойСклад, можно восстановить его связь с сайтом. Сначала проверим заказ и связанный счёт.</p>
    {modified && <p role="status">Сначала сохраните изменения карточки или отмените их.</p>}
    {error && <p role="alert" style={{ color: 'var(--theme-error-500)' }}>{error}</p>}
    {done ? <p role="status">Связь восстановлена. Номер, позиции, сумма и статусы сохранены. <a href={`/admin/collections/orders/${id}`}>Обновить карточку</a></p> : <>
      {plan && <div aria-live="polite">
        <p><strong>Заказ {plan.orderNumber}</strong> · {plan.companyName}</p>
        <p>{plan.itemName} × {plan.quantity}</p>
        <p>Сумма: {plan.total.toLocaleString('ru-RU')} ₽ · Счёт № {plan.invoiceNumber}</p>
        <p>Данные совпадают. Будут сохранены только связи с заказом и счётом. Номер, позиции, сумма и статусы останутся прежними.</p>
      </div>}
      <button type="button" disabled={busy || modified} className="btn btn--style-secondary" onClick={() => run('preview')}>
        {busy ? 'Проверка…' : 'Проверить связь с МойСклад'}
      </button>
      {plan && <button type="button" disabled={busy || modified} className="btn btn--style-primary" onClick={() => run('apply')}>Восстановить связь</button>}
    </>}
  </section>
}
