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

/** Gemini 한 줄 코멘트. 점심에 api/insights.ts 를 채우면 동작한다 */
export function fetchInsights(body: InsightsRequest): Promise<InsightsResponse> {
  return post<InsightsResponse>('/api/insights', body)
}

/**
 * Railway 콜드스타트 예열.
 * 앱 뜨자마자 한 번 부른다. 실패해도 무시한다 — 예열이 목적이다.
 */
export function warmUpApi(): void {
  void fetch(`${API_BASE}/health`).catch(() => {})
}

export { ApiError }
