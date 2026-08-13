import { useCallback, useEffect, useState } from 'react'
import { get, ApiError } from '../../lib/api'
import { 데모콜변환, 운송인응답변환 } from './carrierApiAdapters'
import { 노선키, type 추천콜상세 } from './carrierTypes'

export type 로딩상태 = 'loading' | 'ready' | 'error'
export type 데이터출처 = 'api' | '폴백'

export interface CarrierCallsState {
  목록: 추천콜상세[]
  상태: 로딩상태
  출처: 데이터출처
  오류메시지: string
  재시도: () => void
}

function 폴백목록(매칭쿼리: string): 추천콜상세[] {
  const params = new URLSearchParams(매칭쿼리)
  const currentLocation = params.get('currentLocation') ?? undefined
  const excludedIds = new Set(params.getAll('excludeCallIds'))
  const excludedRoutes = new Set(params.getAll('excludeRouteKeys'))
  return 데모콜변환(currentLocation).filter((call) => !excludedIds.has(call.콜ID) && !excludedRoutes.has(노선키(call)))
}

export function useCarrierCalls(운송인ID: string, 매칭쿼리 = ''): CarrierCallsState {
  const [retryCount, setRetryCount] = useState(0)
  const [state, setState] = useState<Omit<CarrierCallsState, '재시도'>>({
    목록: [], 상태: 'loading', 출처: '폴백', 오류메시지: '',
  })
  const 재시도 = useCallback(() => setRetryCount((count) => count + 1), [])

  useEffect(() => {
    if (매칭쿼리 === '') {
      setState({ 목록: [], 상태: 'loading', 출처: '폴백', 오류메시지: '' })
      return
    }

    const controller = new AbortController()
    setState({ 목록: [], 상태: 'loading', 출처: '폴백', 오류메시지: '' })

    get<unknown>(`/api/v1/matches/carrier/${encodeURIComponent(운송인ID)}?${매칭쿼리}`, { signal: controller.signal })
      .then((raw) => {
        if (controller.signal.aborted) return
        const converted = 운송인응답변환(raw)
        if (converted === null) throw new Error('INVALID_API_RESPONSE')
        setState({ 목록: converted, 상태: 'ready', 출처: 'api', 오류메시지: '' })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof ApiError ? error.message : '오더 정보를 불러오지 못했어요. 다시 시도해 주세요.'
        setState({ 목록: 폴백목록(매칭쿼리), 상태: 'error', 출처: '폴백', 오류메시지: message })
      })

    return () => controller.abort()
  }, [운송인ID, 매칭쿼리, retryCount])

  return { ...state, 재시도 }
}
