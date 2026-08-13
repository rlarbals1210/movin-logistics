import type { InsightsRequest, InsightsResponse } from './types'

/** Railway 백엔드 주소. .env 의 VITE_API_BASE 로 덮어쓴다 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    throw new ApiError(`${init?.method ?? 'GET'} ${path} 실패`, res.status)
  }
  return res.json() as Promise<T>
}

/** `init` 은 AbortController 용이다 — 화면이 언마운트되면 요청을 끊는다 */
export function get<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init)
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
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
export async function fetchInsights(body: InsightsRequest): Promise<InsightsResponse> {
  try {
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return { text: '' }
    const data: unknown = await res.json()
    const text = typeof data === 'object' && data !== null ? (data as InsightsResponse).text : ''
    return { text: typeof text === 'string' ? text : '' }
  } catch {
    return { text: '' }
  }
}

/**
 * Railway 콜드스타트 예열.
 * 앱 뜨자마자 한 번 부른다. 실패해도 무시한다 — 예열이 목적이다.
 */
export function warmUpApi(): void {
  void fetch(`${API_BASE}/health`).catch(() => {})
}

export { ApiError }
