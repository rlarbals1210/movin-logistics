import type { OperationLog, ScenarioResult } from './shipperTypes'

export const regionGroups = [
  {
    name: '수도권',
    locations: ['서울 강서', '서울 송파', '인천 서구', '경기 화성', '경기 평택', '경기 이천', '경기 김포'],
  },
  {
    name: '충청',
    locations: ['대전 유성', '세종', '충북 청주', '충북 음성', '충남 천안', '충남 당진'],
  },
  {
    name: '영남',
    locations: ['부산 강서', '부산 신항', '대구 달성', '울산', '경북 구미', '경남 창원', '경남 김해'],
  },
  {
    name: '호남',
    locations: ['광주 광산', '전북 군산', '전북 익산', '전남 광양', '전남 목포'],
  },
  {
    name: '강원·제주',
    locations: ['강원 원주', '강원 춘천', '강원 강릉', '제주'],
  },
] as const

export const vehicleOptions = [
  '1톤 카고',
  '2.5톤 카고',
  '5톤 카고',
  '5톤 윙바디',
  '11톤 윙바디',
  '11톤 냉장·냉동탑',
  '25톤 카고',
  '25톤 트레일러',
] as const

export const cargoOptions = [
  '냉동식품',
  '신선식품',
  '생활용품',
  '전자부품',
  '자동차부품',
  '산업자재',
  '의류·섬유',
  '가구·인테리어',
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

export const modelMetadata = {
  scenarioRows: scenarioResults.length,
  trainingRows: 218473,
  acceptanceAuc: 0.842,
  failureAuc: 0.791,
  confidence: 0.78,
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
  { date: '08.05', title: '부산 강서 → 전남 광양', detail: '차종 대체 데이터 미반영 · 원 조건 분석', status: '분석' },
]

export const windowOptions: ScenarioResult['windowMinutes'][] = [40, 120, 240, 480, 1440]
