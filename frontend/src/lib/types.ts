/**
 * 화면 두 개(화주 · 운송인)의 공통 기준 타입.
 * src/data/predictions.json 의 형태를 그대로 옮긴 것이다.
 *
 * ★ 이 파일은 동결한다. 09:30 이후 필드를 바꾸지 마라.
 *   추가가 필요하면 이 파일이 아니라 각 feature 폴더에 로컬 타입을 두어라.
 */

/** 톤급 — 5 · 11 · 25 세 가지만 쓴다 */
export type 톤급 = 5 | 11 | 25

/** 시간창(분) — 40 · 120 · 240 · 480 · 1440 다섯 가지만 쓴다 */
export type 시간창분 = 40 | 120 | 240 | 480 | 1440

/** 화주 화면: 톤급 × 시간창 조합 하나의 예측 결과 */
export interface 화주시나리오 {
  톤급: 톤급
  시간창_분: 시간창분
  /** 이 조건을 수락할 수 있는 차주 수 */
  수락가능차주: number
  /** 예측 운임 (원) */
  예측_운임: number
  /** 배차까지 걸리는 예측 시간 (분) */
  예측_배차분: number
  /** 유찰 확률 0~1 */
  유찰확률: number
}

/** 운송인 화면: 추천 콜 한 건 */
export interface 운송인추천콜 {
  콜ID: string
  출발지: string
  도착지: string
  거리km: number
  /** 예측 운임 (원) */
  예측_운임: number
  /** 톨비 (원) */
  톨비: number
  /** 표준 소요 시간 (시간) */
  표준소요_h: number
}

/** 모델 성능 지표 — 두 화면 하단 공통 표시 */
export interface 모델지표 {
  수락예측_AUC: number
  유찰예측_AUC: number
  학습행수: number
}

/** predictions.json 전체 */
export interface Predictions {
  화주_시나리오: 화주시나리오[]
  운송인_추천콜: 운송인추천콜[]
  모델지표: 모델지표
}

/** POST /api/insights 요청 — 점심에 채운다 */
export interface InsightsRequest {
  role: 'shipper' | 'carrier'
  payload: unknown
}

/** POST /api/insights 응답 — 한 줄 코멘트 */
export interface InsightsResponse {
  text: string
}
