/**
 * API 응답 → 화면 타입 변환.
 *
 * 아직 빈 껍데기다. 백엔드(/mv-backend)가 응답 형태를 확정하면
 * 여기서만 고쳐 쓴다 — 화면 컴포넌트는 types.ts 만 보게 유지한다.
 */
import type { Predictions, 운송인추천콜, 화주시나리오 } from './types'

/** 백엔드 매칭 응답 → 운송인 추천콜 목록 */
export function toCarrierCalls(_raw: unknown): 운송인추천콜[] {
  // TODO(/mv-backend 이후): 실제 응답 필드 매핑
  return []
}

/** 백엔드 매칭 응답 → 화주 시나리오 목록 */
export function toShipperScenarios(_raw: unknown): 화주시나리오[] {
  // TODO(/mv-backend 이후): 실제 응답 필드 매핑
  return []
}

/** predictions.json 원본 → 화면용. 지금은 그대로 통과시킨다 */
export function toPredictions(raw: unknown): Predictions {
  return raw as Predictions
}
