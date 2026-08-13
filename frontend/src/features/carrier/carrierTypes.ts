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
  /** 상차 예정 시각. 매칭 API가 주지 않으면 화면용 기준 데이터에서 채운다. */
  상차시각: string
}

/** 백엔드 응답 한 행에서 확장 필드만 뽑는다. */
export function 확장필드(row: Record<string, unknown>): Pick<추천콜상세, '공차거리km' | '복화가능성' | '상차시각'> {
  const 숫자 = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
  return {
    공차거리km: 숫자(row['공차거리km']),
    복화가능성: 숫자(row['복화가능성']),
    상차시각: typeof row['상차시각'] === 'string' ? row['상차시각'] : '시간 확인 중',
  }
}
