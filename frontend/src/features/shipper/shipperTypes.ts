import type { 톤급 } from '../../lib/types'

export type ShipperTabId = 'settings' | 'register' | 'compare' | 'report' | 'profile'

export type CallForm = {
  originRegion: string
  originDetail: string
  originCustom: string
  destinationRegion: string
  destinationDetail: string
  destinationCustom: string
  vehicle: string
  vehicleCustom: string
  cargoItem: string
  cargoItemCustom: string
  cargoDescription: string
  loadingDate: string
  loadingStartMinutes: number
  loadingEndMinutes: number
}

export type ScenarioResult = {
  tonnage: 5 | 11 | 25
  windowMinutes: 40 | 120 | 240 | 480 | 1440
  availableDrivers: number
  estimatedFare: number
  dispatchMinutes: number
  failureProbability: number
}

export type ShipperModelMetadata = {
  scenarioRows: number
  trainingRows: number
  acceptanceAuc: number
  failureAuc: number
}

export type ComparisonOptions = {
  allowVehicleSubstitution: boolean
  allowDateDelay: boolean
  relaxedWindowMinutes: ScenarioResult['windowMinutes']
}

export type DispatchDecision = 'current' | 'adjusted' | null

export type OperationLog = {
  date: string
  title: string
  detail: string
  status: '완료' | '응답 대기' | '분석'
}

/**
 * 탄소 감축 산정에 들어가는 완료 오더 한 건.
 *
 * `docs/reference/hack/carbon-calculation-current.md` 의 D·D_dh 에 해당한다.
 */
export type CompletedOrderCarbonInput = {
  callId: string
  route: string
  /** 'MM.DD' — OperationLog.date 와 같은 표기 */
  completedAt: string
  tonnage: 톤급
  /** D — 매칭된 적재 구간 거리(km) */
  matchedDistanceKm: number
  /** D_dh — 매칭이 없었다면 별도 차량이 상차지까지 접근하며 발생했을 공차거리(km) 추정 */
  deadheadDistanceKm: number
}

export const emptyCallForm: CallForm = {
  originRegion: '',
  originDetail: '',
  originCustom: '',
  destinationRegion: '',
  destinationDetail: '',
  destinationCustom: '',
  vehicle: '',
  vehicleCustom: '',
  cargoItem: '',
  cargoItemCustom: '',
  cargoDescription: '',
  loadingDate: '',
  loadingStartMinutes: 540,
  loadingEndMinutes: 660,
}
