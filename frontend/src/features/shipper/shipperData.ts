import type { OperationLog, ScenarioResult, ShipperModelMetadata } from './shipperTypes'

/**
 * `ai/data/유연오더_가상데이터_v13.xlsx` → `참조_노선` 12행.
 * MVP 등록 화면은 원본에 존재하는 노선만 선택할 수 있다.
 */
export const routeOptions = [
  { routeId: 'R01', origin: '부산신항', destination: '김포' },
  { routeId: 'R02', origin: '부산북항', destination: '화성' },
  { routeId: 'R03', origin: '광양항', destination: '군산' },
  { routeId: 'R04', origin: '창원공단', destination: '평택' },
  { routeId: 'R05', origin: '인천남동', destination: '달성' },
  { routeId: 'R06', origin: '안성물류', destination: '천안' },
  { routeId: 'R07', origin: '대전유성', destination: '이천' },
  { routeId: 'R08', origin: '의왕ICD', destination: '안산' },
  { routeId: 'R09', origin: '평택항', destination: '청주' },
  { routeId: 'R10', origin: '인천항', destination: '김해' },
  { routeId: 'R11', origin: '부산신항', destination: '이천' },
  { routeId: 'R12', origin: '대전유성', destination: '김해' },
] as const

/** 원본 `콜등록이력.차종` 고유값 15종. */
export const vehicleOptions = [
  '5t냉동',
  '5t냉장',
  '5t윙바디',
  '5t카고',
  '5t탑차',
  '11t냉동',
  '11t냉장',
  '11t윙바디',
  '11t카고',
  '11t탑차',
  '25t냉동',
  '25t냉장',
  '25t윙바디',
  '25t카고',
  '25t탑차',
] as const

/** 원본 `콜등록이력.품목` 고유값 11종. */
export const cargoOptions = [
  '기계류',
  '냉동수산',
  '냉동식품',
  '생활용품',
  '섬유원단',
  '식품가공',
  '자동차부품',
  '전자부품',
  '제과류',
  '철강재',
  '화학원료',
] as const

export const scenarioResults: ScenarioResult[] = [
  { tonnage: 5, windowMinutes: 40, availableDrivers: 6, estimatedFare: 412000, dispatchMinutes: 34, failureProbability: 0.41 },
  { tonnage: 5, windowMinutes: 120, availableDrivers: 14, estimatedFare: 361000, dispatchMinutes: 62, failureProbability: 0.19 },
  { tonnage: 5, windowMinutes: 240, availableDrivers: 23, estimatedFare: 334000, dispatchMinutes: 88, failureProbability: 0.11 },
  { tonnage: 5, windowMinutes: 480, availableDrivers: 38, estimatedFare: 312000, dispatchMinutes: 121, failureProbability: 0.06 },
  { tonnage: 5, windowMinutes: 1440, availableDrivers: 57, estimatedFare: 298000, dispatchMinutes: 164, failureProbability: 0.03 },
  { tonnage: 11, windowMinutes: 40, availableDrivers: 4, estimatedFare: 604000, dispatchMinutes: 41, failureProbability: 0.52 },
  { tonnage: 11, windowMinutes: 120, availableDrivers: 9, estimatedFare: 538000, dispatchMinutes: 73, failureProbability: 0.27 },
  { tonnage: 11, windowMinutes: 240, availableDrivers: 16, estimatedFare: 496000, dispatchMinutes: 102, failureProbability: 0.16 },
  { tonnage: 11, windowMinutes: 480, availableDrivers: 27, estimatedFare: 468000, dispatchMinutes: 139, failureProbability: 0.09 },
  { tonnage: 11, windowMinutes: 1440, availableDrivers: 41, estimatedFare: 445000, dispatchMinutes: 187, failureProbability: 0.04 },
  { tonnage: 25, windowMinutes: 40, availableDrivers: 2, estimatedFare: 918000, dispatchMinutes: 56, failureProbability: 0.68 },
  { tonnage: 25, windowMinutes: 120, availableDrivers: 5, estimatedFare: 826000, dispatchMinutes: 94, failureProbability: 0.38 },
  { tonnage: 25, windowMinutes: 240, availableDrivers: 9, estimatedFare: 771000, dispatchMinutes: 128, failureProbability: 0.24 },
  { tonnage: 25, windowMinutes: 480, availableDrivers: 15, estimatedFare: 728000, dispatchMinutes: 173, failureProbability: 0.14 },
  { tonnage: 25, windowMinutes: 1440, availableDrivers: 24, estimatedFare: 694000, dispatchMinutes: 226, failureProbability: 0.07 },
]

export const modelMetadata: ShipperModelMetadata = {
  scenarioRows: scenarioResults.length,
  trainingRows: 9324,
  acceptanceAuc: 0.72,
  failureAuc: 0.747,
}

export const shipperReportMetrics = {
  analyzedCalls: 40,
  timeSuggestions: 11,
  suggestionAcceptanceRate: 63,
  completedCalls: 7,
  medianDispatchMinutes: 31,
  medianTimeSavedMinutes: 22,
  adjustableCalls: 11,
  predictedFareDifference: 43000,
}

export const operationLogs: OperationLog[] = [
  { date: '08.12', title: '인천 서구 → 경북 구미', detail: '상차 시간창 2시간 완화 · 34분 내 배차', status: '완료' },
  { date: '08.09', title: '경기 화성 → 충북 청주', detail: '현재 조건 유지 · 운송인 1차 응답 수락', status: '완료' },
  { date: '08.05', title: '부산 강서 → 전남 광양', detail: '차종 대체 허용 · 계산 규칙 반영', status: '분석' },
]

export const windowOptions: ScenarioResult['windowMinutes'][] = [40, 120, 240, 480, 1440]
