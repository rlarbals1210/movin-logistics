/**
 * 화주/주선사 리포트 — 탄소 감축 산정용 원본 데이터
 *
 * 대상: 2026년 8월 매칭 성사 후 완료된 화주 오더 (shipperReportMetrics.completedCalls = 7건)
 *
 * 산정식 (docs/reference/hack/carbon-calculation-current.md 기준)
 *   ΔE = D × EF_empty + D_dh × EF_empty
 *   - D     : matchedDistanceKm    매칭된 적재 구간 거리
 *   - D_dh  : deadheadDistanceKm   매칭되지 않았을 경우 별도 차량이 상차지까지
 *                                  접근하는 데 필요했을 공차거리(추정치)
 *
 * 배출계수(EF_empty)는 frontend/src/lib/emissions.ts 의 `배출계수_kg_per_km` 공차값을
 * 그대로 사용한다. 여기서 새로 정의하지 않는다.
 *   5t = 0.373 / 11t = 0.522 / 25t = 0.652 (kg CO2e per km)
 *
 * ※ deadheadDistanceKm는 실측값이 아니라 가정치다.
 *   국내 화물 접근 공차는 통상 적재거리의 10~40% 수준이며,
 *   근거리 노선은 낮은 비율, 장거리 노선은 상대적으로 높은 비율을 적용했다.
 *   (장거리일수록 상차지 인근에서 대기 차량을 확보하기 어렵기 때문)
 */

import type { CompletedOrderCarbonInput } from './shipperTypes'

export const completedOrderCarbonInputs: CompletedOrderCarbonInput[] = [
  {
    callId: 'SHP-0813-01',
    route: '인천 남동공단 → 대전 대덕',
    completedAt: '08.02',
    tonnage: 11,
    matchedDistanceKm: 168,
    // 중거리 간선. 수도권 출발이라 대기 차량 확보가 비교적 용이 → 적재거리의 약 20%
    deadheadDistanceKm: 34,
  },
  {
    callId: 'SHP-0813-02',
    route: '화성 향남 → 부산 사상',
    completedAt: '08.04',
    tonnage: 25,
    matchedDistanceKm: 392,
    // 장거리 대형. 25t 가용 차량이 제한적이라 접근 공차가 길어짐 → 적재거리의 약 30%
    deadheadDistanceKm: 118,
  },
  {
    callId: 'SHP-0813-03',
    route: '성남 상대원 → 청주 오창',
    completedAt: '08.06',
    tonnage: 5,
    matchedDistanceKm: 96,
    // 근거리 소형. 수도권 내 5t 차량 밀도가 높아 접근 거리 짧음 → 적재거리의 약 14%
    deadheadDistanceKm: 13,
  },
  {
    callId: 'SHP-0813-04',
    route: '김포 대곶 → 광주 하남산단',
    completedAt: '08.08',
    tonnage: 11,
    matchedDistanceKm: 331,
    // 장거리 호남 방면. 복귀 물량이 적어 대기 차량이 분산 → 적재거리의 약 29%
    deadheadDistanceKm: 96,
  },
  {
    callId: 'SHP-0813-05',
    route: '평택 포승 → 구미 국가산단',
    completedAt: '08.10',
    tonnage: 11,
    matchedDistanceKm: 224,
    // 중거리 영남 방면. 경부축이라 차량 순환이 활발 → 적재거리의 약 23%
    deadheadDistanceKm: 52,
  },
  {
    callId: 'SHP-0813-06',
    route: '안산 반월 → 원주 문막',
    completedAt: '08.12',
    tonnage: 5,
    matchedDistanceKm: 142,
    // 근중거리 소형. 수도권 인접 출발지로 접근 부담 낮음 → 적재거리의 약 15%
    deadheadDistanceKm: 22,
  },
  {
    callId: 'SHP-0813-07',
    route: '시흥 정왕 → 창원 성산',
    completedAt: '08.13',
    tonnage: 25,
    matchedDistanceKm: 358,
    // 장거리 대형. 25t + 남부권 조합으로 접근 공차가 가장 큼 → 적재거리의 약 35%
    deadheadDistanceKm: 125,
  },
]