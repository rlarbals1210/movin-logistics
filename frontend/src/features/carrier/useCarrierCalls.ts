/**
 * 운송인 추천콜 로딩.
 *
 * `GET /v1/matches/carrier/{id}` 한 번 부르고 끝이다. 재조회·캐시는 없다.
 *
 * 실패하면 던지지 않고 예시 3건으로 떨어진다. 백엔드(fixtures.py)가
 * "모델이 죽어도 데모는 산다"는 방침이라 프론트도 같은 방침을 따른다 —
 * 발표 중에 빈 화면이 뜨는 것이 가장 나쁜 결과다.
 */
import { useEffect, useState } from 'react'
import { get } from '../../lib/api'
import { toCarrierCalls, 예시_추천콜 } from '../../lib/adapters'
import { 확장필드, type 추천콜상세 } from './carrierTypes'
import { 추천콜_확장기본값 } from './carrierFlowData'

export type 로딩상태 = 'loading' | 'ready' | 'error'

/** 화면이 "지금 보는 게 실데이터인가"를 알아야 해서 출처를 같이 준다 */
export type 데이터출처 = 'api' | '폴백'

export interface CarrierCallsState {
  목록: 추천콜상세[]
  상태: 로딩상태
  출처: 데이터출처
}

/**
 * 계약 필드(`toCarrierCalls`)에 확장 필드를 얹는다.
 *
 * `toCarrierCalls` 는 types.ts 에 있는 필드만 남기고 나머지를 버리므로,
 * 공차거리·복화가능성은 원본 응답에서 콜ID 로 다시 찾아 붙인다.
 */
function 상세로(raw: unknown): 추천콜상세[] {
  const 기본 = toCarrierCalls(raw)

  const 원본행 = new Map<string, Record<string, unknown>>()
  const rows = (raw as { 운송인_추천콜?: unknown })?.운송인_추천콜
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (typeof row === 'object' && row !== null) {
        const id = (row as Record<string, unknown>)['콜ID']
        if (typeof id === 'string') 원본행.set(id, row as Record<string, unknown>)
      }
    }
  }

  return 기본.map((콜) => ({
    ...콜,
    ...확장필드(원본행.get(콜.콜ID) ?? 추천콜_확장기본값[콜.콜ID] ?? {}),
  }))
}

export function useCarrierCalls(운송인ID: string): CarrierCallsState {
  const [state, setState] = useState<CarrierCallsState>({
    목록: [],
    상태: 'loading',
    출처: '폴백',
  })

  useEffect(() => {
    // StrictMode 는 개발에서 effect 를 두 번 돌린다. 늦게 온 응답이
    // 먼저 온 응답을 덮어쓰지 않게 취소한다.
    const controller = new AbortController()

    setState({ 목록: [], 상태: 'loading', 출처: '폴백' })

    get<unknown>(`/v1/matches/carrier/${encodeURIComponent(운송인ID)}`, {
      signal: controller.signal,
    })
      .then((raw) => {
        if (controller.signal.aborted) return
        // toCarrierCalls 는 응답이 비면 예시 배열을 그대로 돌려준다.
        // 참조가 같으면 폴백이 쓰인 것이다.
        const 폴백인가 = toCarrierCalls(raw) === 예시_추천콜
        setState({ 목록: 상세로(raw), 상태: 'ready', 출처: 폴백인가 ? '폴백' : 'api' })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setState({ 목록: 상세로(null), 상태: 'error', 출처: '폴백' })
      })

    return () => controller.abort()
  }, [운송인ID])

  return state
}
