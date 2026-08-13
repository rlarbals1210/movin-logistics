import type { InsightsResponse } from './types'

/**
 * 매칭 API(Railway) 주소.
 *
 * 우선순위: VITE_API_BASE → (개발) 빈 문자열 → (배포) 아래 기본값.
 *
 * 기본값을 코드에 두는 이유 —
 * Vercel 에 VITE_API_BASE 를 넣어도 커밋이 그대로면 재빌드가 일어나지 않아
 * 이전 번들이 계속 서빙됐다. VITE_* 는 빌드 시점에 박히므로 그 번들에는
 * 주소가 없고, 배포본이 상대경로로 요청해 405 를 받고 조용히 폴백 데이터를
 * 보여줬다. 배포 설정 하나에 데모 전체가 걸리지 않게 기본값을 둔다.
 * 이 주소는 비밀이 아니다(공개 API, CORS 전체 허용).
 *
 * **개발에서는 반드시 빈 문자열이어야 한다.** vite dev proxy 가 /v1 을
 * 127.0.0.1:8000 으로 넘기는데, 여기서 Railway 를 기본값으로 주면 로컬 백엔드를
 * 띄워도 요청이 배포 서버로 새어 나간다.
 */
const 배포_기본_백엔드 = 'https://movin-logistics-production.up.railway.app'

function resolveApiBase(): string {
  const 설정값 = import.meta.env.VITE_API_BASE?.trim()
  // 끝의 / 를 떼지 않으면 `${API_BASE}/v1/...` 이 `//v1/...` 이 된다.
  if (설정값) return 설정값.replace(/\/+$/, '')
  return import.meta.env.DEV ? '' : 배포_기본_백엔드
}

export const API_BASE = resolveApiBase()

class ApiError extends Error {
  readonly status: number
  readonly requestId: string | null

  constructor(message: string, status: number, requestId: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.requestId = requestId
  }
}

const NETWORK_TIMEOUT_MS = 15_000

interface ApiErrorBody {
  error?: { message?: unknown; requestId?: unknown }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort('timeout'), NETWORK_TIMEOUT_MS)
  const externalSignal = init?.signal
  const abortFromExternal = () => controller.abort(externalSignal?.reason)
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true })

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
    if (!res.ok) {
      let body: ApiErrorBody = {}
      try { body = await res.json() as ApiErrorBody } catch { /* 응답 본문이 없을 수 있다. */ }
      const serverMessage = typeof body.error?.message === 'string' ? body.error.message : null
      const requestId = typeof body.error?.requestId === 'string' ? body.error.requestId : null
      throw new ApiError(serverMessage ?? '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.', res.status, requestId)
    }
    return await res.json() as T
  } catch (error) {
    if (controller.signal.aborted && !externalSignal?.aborted) {
      throw new ApiError('응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.', 408)
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
    externalSignal?.removeEventListener('abort', abortFromExternal)
  }
}

/** `init` 은 AbortController 용이다 — 화면이 언마운트되면 요청을 끊는다 */
export function get<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init)
}

export function post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) })
}

/**
 * Gemini 한 줄 코멘트.
 *
 * `post()` 를 쓰지 않는다. 매칭 API 는 Railway(`API_BASE`)에 있지만 이 함수는
 * Vercel 서버리스(`frontend/api/insights.ts`)라 **프론트와 같은 오리진**이다.
 * `API_BASE` 를 붙이면 Railway 로 가서 404 가 난다.
 *
 * 실패는 전부 빈 문자열로 흡수한다. 핸들러도 6개 경로 모두 `{ text: '' }` 로
 * 떨어지므로, 호출부는 text 가 비면 영역을 숨기기만 하면 된다.
 */
export async function fetchInsights(body: {
  audience: 'SHIPPER' | 'CARRIER'
  facts: unknown
}, signal?: AbortSignal): Promise<InsightsResponse> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort('insight-timeout'), 7_000)
  const abortFromExternal = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', abortFromExternal, { once: true })
  try {
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) return { text: '' }
    const data: unknown = await res.json()
    const text = typeof data === 'object' && data !== null ? (data as InsightsResponse).text : ''
    return { text: typeof text === 'string' ? text : '' }
  } catch {
    return { text: '' }
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', abortFromExternal)
  }
}

/**
 * Railway 콜드스타트 예열.
 * 앱 뜨자마자 한 번 부른다. 실패해도 무시한다 — 예열이 목적이다.
 */
export function warmUpApi(): void {
  void fetch(`${API_BASE}/api/health`).catch(() => {})
}

export { ApiError }
