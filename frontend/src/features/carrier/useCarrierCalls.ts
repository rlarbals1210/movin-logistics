import { useCallback, useEffect, useRef, useState } from 'react'
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
  재시도중: boolean
  재시도: () => void
}

/**
 * 자동 재시도 간격(ms). 배열 길이가 곧 자동 시도 횟수다.
 *
 * 한 번 폴백으로 떨어지면 사용자가 `다시 시도` 를 누르기 전까지 그 상태가
 * 영구히 고정됐다. 백엔드가 `--reload` 로 잠깐 재시작하는 것처럼 저절로
 * 풀릴 실패까지 사람 손을 기다리게 만들 이유가 없다.
 */
const 자동재시도_지연 = [1500, 3000, 6000]

/** 스스로 풀릴 수 있는 실패만 자동 재시도한다 — 4xx·응답형식 오류는 다시 불러도 결과가 같다. */
function 자동재시도대상(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 408 || error.status >= 500
  if (error instanceof Error && error.message === 'INVALID_API_RESPONSE') return false
  return true // fetch 자체가 실패 — 서버가 다시 뜨면 풀린다
}

function 폴백목록(매칭쿼리: string): 추천콜상세[] {
  const params = new URLSearchParams(매칭쿼리)
  const currentLocation = params.get('currentLocation') ?? undefined
  const excludedIds = new Set(params.getAll('excludeCallIds'))
  const excludedRoutes = new Set(params.getAll('excludeRouteKeys'))
  const tonnage = Number(params.get('tonnage') ?? 5)
  const subregion = params.get('subregion') ?? ''
  const timeSlots = new Set(params.getAll('timeSlots'))
  const maxEmptyRaw = params.get('maxEmptyKm')
  const maxDurationRaw = params.get('maxDurationHours')
  const maxEmptyKm = maxEmptyRaw === null ? undefined : Number(maxEmptyRaw)
  const maxDurationHours = maxDurationRaw === null ? undefined : Number(maxDurationRaw)
  const prioritizeIncome = params.get('prioritizeIncome') === 'true'
  const prioritizeBackhaul = params.get('prioritizeBackhaul') === 'true'
  const timeCode = (iso: string) => {
    const hour = Number(iso.slice(11, 13))
    if (hour >= 6 && hour < 12) return 'MORNING'
    if (hour >= 12 && hour < 18) return 'AFTERNOON'
    return 'NIGHT'
  }

  return 데모콜변환(currentLocation)
    .filter((call) => (
      !excludedIds.has(call.콜ID) &&
      !excludedRoutes.has(노선키(call)) &&
      call.톤급 === tonnage &&
      (!subregion || call.출발지.includes(subregion)) &&
      (timeSlots.size === 0 || timeSlots.has(timeCode(call.상차ISO))) &&
      (maxEmptyKm === undefined || !Number.isFinite(maxEmptyKm) || call.공차거리km <= maxEmptyKm) &&
      (maxDurationHours === undefined || !Number.isFinite(maxDurationHours) || call.운행시간분 <= maxDurationHours * 60)
    ))
    .sort((a, b) => {
      if (prioritizeIncome && a.예상실수령원 !== b.예상실수령원) return b.예상실수령원 - a.예상실수령원
      if (prioritizeBackhaul && a.복화가능성 !== b.복화가능성) return b.복화가능성 - a.복화가능성
      return a.공차거리km - b.공차거리km
    })
}

export function useCarrierCalls(운송인ID: string, 매칭쿼리 = ''): CarrierCallsState {
  const [retryCount, setRetryCount] = useState(0)
  const 자동시도수 = useRef(0)
  const 요청키 = useRef('')
  const [state, setState] = useState<Omit<CarrierCallsState, '재시도'>>({
    목록: [], 상태: 'loading', 출처: '폴백', 오류메시지: '', 재시도중: false,
  })

  // 수동 재시도는 자동 카운터를 되돌린다 — 눌렀는데 남은 자동 시도가 없어서
  // 한 번 만에 포기하면 버튼이 고장 난 것처럼 보인다.
  const 재시도 = useCallback(() => {
    자동시도수.current = 0
    setRetryCount((count) => count + 1)
  }, [])

  useEffect(() => {
    if (매칭쿼리 === '') {
      자동시도수.current = 0
      setState({ 목록: [], 상태: 'loading', 출처: '폴백', 오류메시지: '', 재시도중: false })
      return
    }

    // 조회 조건이 바뀌면 앞 요청의 재시도 이력은 의미가 없다.
    const 키 = `${운송인ID}|${매칭쿼리}`
    if (요청키.current !== 키) {
      요청키.current = 키
      자동시도수.current = 0
    }

    const controller = new AbortController()
    let 예약 = 0

    // 자동 재시도 중에는 이미 그려둔 폴백 목록을 남긴다. 목록이 사라졌다
    // 다시 나타나면 사용자는 화면이 깨진 것으로 읽는다.
    if (자동시도수.current === 0) {
      setState({ 목록: [], 상태: 'loading', 출처: '폴백', 오류메시지: '', 재시도중: false })
    }

    get<unknown>(`/api/v1/matches/carrier/${encodeURIComponent(운송인ID)}?${매칭쿼리}`, { signal: controller.signal })
      .then((raw) => {
        if (controller.signal.aborted) return
        const converted = 운송인응답변환(raw)
        if (converted === null) throw new Error('INVALID_API_RESPONSE')
        자동시도수.current = 0
        setState({ 목록: converted, 상태: 'ready', 출처: 'api', 오류메시지: '', 재시도중: false })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof ApiError ? error.message : '오더 정보를 불러오지 못했어요. 다시 시도해 주세요.'
        const 지연 = 자동재시도대상(error) ? 자동재시도_지연[자동시도수.current] : undefined
        setState({
          목록: 폴백목록(매칭쿼리), 상태: 'error', 출처: '폴백',
          오류메시지: message, 재시도중: 지연 !== undefined,
        })
        if (지연 === undefined) return
        자동시도수.current += 1
        예약 = window.setTimeout(() => setRetryCount((count) => count + 1), 지연)
      })

    return () => { controller.abort(); window.clearTimeout(예약) }
  }, [운송인ID, 매칭쿼리, retryCount])

  return { ...state, 재시도 }
}
