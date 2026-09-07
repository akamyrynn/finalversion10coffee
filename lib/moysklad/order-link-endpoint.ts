import type { PayloadRequest } from 'payload'
import { canRunIntegrations, getAllowedSalesChannels } from '../../payload/access/adminRoles'
import { repairMoyskladOrderLink } from './order-link-service'

export async function handleOrderLinkRepair(req: PayloadRequest) {
  if (!canRunIntegrations(req.user)) return Response.json({ error: 'Недостаточно прав' }, { status: 403 })
  const origin = req.headers.get('origin')
  let foreignOrigin = req.headers.get('sec-fetch-site') === 'cross-site'
  try { foreignOrigin ||= Boolean(origin && new URL(origin).host !== (req.headers.get('host') || new URL(req.url || '').host)) }
  catch { foreignOrigin = true }
  if (foreignOrigin) {
    return Response.json({ error: 'Недопустимый источник запроса' }, { status: 403 })
  }
  if (!req.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json({ error: 'Ожидается JSON' }, { status: 415 })
  }
  let body: { orderId?: unknown; mode?: unknown; fingerprint?: unknown }
  try { body = await req.json!() } catch { return Response.json({ error: 'Некорректный запрос' }, { status: 400 }) }
  if (!body || typeof body !== 'object' || !Number.isSafeInteger(body.orderId) || Number(body.orderId) <= 0 ||
      !['preview', 'apply'].includes(String(body.mode)) ||
      (body.mode === 'apply' && (typeof body.fingerprint !== 'string' || !/^[a-f\d]{64}$/.test(body.fingerprint)))) {
    return Response.json({ error: 'Сначала выберите заказ и проверьте связь' }, { status: 400 })
  }
  try {
    const result = await repairMoyskladOrderLink({
      orderId: Number(body.orderId), apply: body.mode === 'apply',
      fingerprint: body.mode === 'apply' ? String(body.fingerprint) : undefined,
      allowedSalesChannels: getAllowedSalesChannels(req.user), actorId: req.user?.id,
    })
    return Response.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[MoySklad] link repair database error:', error.code)
      return Response.json({ error: 'Не удалось сохранить связь. Изменения отменены; повторите проверку' }, { status: 500 })
    }
    return Response.json({ error: error instanceof Error ? error.message : 'Не удалось восстановить связь' }, { status: 409 })
  }
}
