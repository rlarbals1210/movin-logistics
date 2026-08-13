/**
 * 운송인 화면 로컬 확장 타입.
 *
 * `lib/types.ts` 의 `운송인추천콜` 은 09:30 에 동결됐다. 실수령 비교에 필요한
 * 필드는 그 파일을 고치지 말고 여기에 둔다 — types.ts 파일 상단의 지시사항이다.
 */
import type { 운송인추천콜 } from '../../lib/types'

export interface 추천콜상세 extends 운송인추천콜 {
  /** 현재 위치 → 상차지 공차거리 */
  공차거리km: number
  /** 하차 후 복화(귀로 화물) 잡힐 확률 0~1 */
  복화가능성: number
}

/** 백엔드 응답 한 행에서 확장 필드만 뽑는다. 없으면 0 이다 */
export function 확장필드(row: Record<string, unknown>): Pick<추천콜상세, '공차거리km' | '복화가능성'> {
  const 숫자 = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
  return {
    공차거리km: 숫자(row['공차거리km']),
    복화가능성: 숫자(row['복화가능성']),
  }
}
