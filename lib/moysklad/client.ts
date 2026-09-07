import { getMoyskladConfig, assertMoyskladReady, type MoyskladConfig } from "./config"
import type { MoyskladEntityType, MoyskladListResponse, MoyskladMeta } from "./types"
import { setTimeout as delay } from "node:timers/promises"

const MAX_ATTEMPTS = 3
const REQUEST_TIMEOUT_MS = 30_000
const MAX_RETRY_DELAY_MS = 10_000
const TRANSIENT_STATUSES = new Set([500, 502, 503, 504])

export class MoyskladApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown
  ) {
    super(message)
    this.name = "MoyskladApiError"
  }
}

function parseMoyskladErrors(body: unknown) {
  if (!body || typeof body !== "object") return []
  const errors = (body as { errors?: unknown }).errors
  if (!Array.isArray(errors)) return []
  return errors.filter((e): e is Record<string, unknown> => e !== null && typeof e === "object")
}

function joinUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, "")
  const normalizedPath = path.replace(/^\/+/, "")
  return `${normalizedBase}/${normalizedPath}`
}

function buildAuthHeader(config: MoyskladConfig) {
  if (config.authMode === "bearer") {
    return `Bearer ${config.token}`
  }

  const raw = `${config.login}:${config.password}`
  return `Basic ${Buffer.from(raw).toString("base64")}`
}

async function parseResponse(response: Response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function retryDelay(response: Response, attempt: number) {
  const delays = [2 ** attempt * 1000]
  const retryAfter = response.headers.get("Retry-After")
  if (retryAfter) {
    const seconds = Number(retryAfter)
    const milliseconds = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now()
    if (Number.isFinite(milliseconds)) delays.push(milliseconds)
  }
  const lognexRetryAfter = response.headers.get("X-Lognex-Retry-After")
  if (lognexRetryAfter) {
    const milliseconds = Number(lognexRetryAfter)
    if (Number.isFinite(milliseconds)) delays.push(milliseconds)
  }
  return Math.max(...delays)
}

export async function moyskladRequest<T>(
  path: string,
  init: RequestInit = {},
  config = getMoyskladConfig()
): Promise<T> {
  assertMoyskladReady(config)

  const method = (init.method || "GET").toUpperCase()
  const canRetryRead = method === "GET" || method === "HEAD"
  // Query filters may contain customers' personal data; keep them out of errors.
  const requestLabel = `${method} ${path.split("?")[0]}`

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    init.signal?.throwIfAborted()
    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout
    let response: Response
    let body: unknown
    try {
      response = await fetch(joinUrl(config.baseUrl, path), {
        ...init,
        signal,
        headers: {
          Accept: "application/json;charset=utf-8",
          "Content-Type": "application/json",
          Authorization: buildAuthHeader(config),
          ...(init.headers || {}),
        },
        cache: "no-store",
      })
      body = await parseResponse(response)
    } catch (error) {
      init.signal?.throwIfAborted()
      if (!timeout.aborted && !(error instanceof TypeError)) throw error
      if (canRetryRead && attempt < MAX_ATTEMPTS) {
        await delay(2 ** attempt * 1000, undefined, { signal: init.signal || undefined })
        continue
      }
      throw new MoyskladApiError(
        `${timeout.aborted ? "МойСклад не ответил за 30 секунд" : "Не удалось получить ответ от МойСклад"} (${requestLabel}). Повторите выгрузку позже.`,
        0,
        null,
      )
    }

    if (!response.ok) {
      const moyskladErrors = parseMoyskladErrors(body)
      const isRateLimit = response.status === 429 || moyskladErrors.some((e) => e.code === 1049)
      const message = moyskladErrors.length > 0
        ? JSON.stringify(moyskladErrors)
        : TRANSIENT_STATUSES.has(response.status)
          ? "МойСклад временно недоступен. Повторите выгрузку позже."
          : isRateLimit
            ? "МойСклад ограничил частоту запросов. Повторите выгрузку позже."
            : "Ошибка API МойСклад"

      // A 5xx/timeout after a write does not prove the write failed. Replaying
      // it could duplicate an order, invoice, or stock loss. Only retry reads
      // or requests explicitly rejected by the API's rate limiter.
      if ((isRateLimit || (canRetryRead && TRANSIENT_STATUSES.has(response.status))) && attempt < MAX_ATTEMPTS) {
        const waitMs = retryDelay(response, attempt)
        if (waitMs <= MAX_RETRY_DELAY_MS) {
          await delay(waitMs, undefined, { signal: init.signal || undefined })
          continue
        }
      }

      throw new MoyskladApiError(`${message} (HTTP ${response.status}; ${requestLabel})`, response.status, body)
    }

    return body as T
  }

  throw new MoyskladApiError("Превышено ограничение на количество запросов — повторы не помогли", 429, null)
}

export function moyskladMeta(type: MoyskladEntityType, id: string, config = getMoyskladConfig()): MoyskladMeta {
  const path = type === "state"
    ? `entity/customerorder/metadata/states/${id}`
    : `entity/${type}/${id}`

  return {
    href: joinUrl(config.baseUrl, path),
    type,
    mediaType: "application/json",
  }
}

export async function moyskladGetList<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value))
    }
  }

  const query = search.toString()
  return moyskladRequest<MoyskladListResponse<T>>(`${path}${query ? `?${query}` : ""}`)
}

export function hasMoyskladErrorCode(error: unknown, targetCode: number): boolean {
  if (!(error instanceof MoyskladApiError)) return false
  return parseMoyskladErrors(error.body).some((e) => e.code === targetCode)
}

export function extractMoyskladId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null
  const id = (value as { id?: unknown }).id
  if (typeof id === "string" && id) return id
  const meta = (value as { meta?: { href?: string } }).meta
  const href = meta?.href
  if (!href) return null
  return href.split("/").filter(Boolean).pop() || null
}
