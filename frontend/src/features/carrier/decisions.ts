/**
 * 운송인의 콜 선택·미선택 기록.
 *
 * 기획 기준 두 가지를 그대로 따른다.
 * - 자동 수락은 없다. 이 모듈은 사용자가 버튼을 누른 뒤에만 호출된다.
 * - 선택하지 않는 것도 정당한 의사결정이므로 미선택도 사유와 함께 기록한다.
 */
import { post } from '../../lib/api'

export const 미선택사유_목록 = ['공차 과다', '귀가 불가', '운임 부족', '시간대 안 맞음'] as const

export type 미선택사유 = (typeof 미선택사유_목록)[number]

export interface 결정 {
  콜ID: string
  선택여부: boolean
  사유?: 미선택사유
  /** 화면 정렬용. 서버 시각이 아니라 클라이언트 시각이다 */
  시각: number
}

/**
 * 서버에 남긴다. 실패해도 던지지 않는다.
 *
 * 로그 전송이 실패했다고 화면이 멈출 이유가 없다 — 사용자가 이미 내린 결정이다.
 */
export function 결정전송(결정값: 결정): void {
  void post('/v1/carrier/decisions', {
    콜ID: 결정값.콜ID,
    선택여부: 결정값.선택여부,
    사유: 결정값.사유 ?? null,
  }).catch(() => {})
}

/**
 * 콜 확정 피드백. ACCEPT 계약을 명시하고 실패는 boolean으로만 돌려준다.
 * 호출부는 이 결과와 무관하게 다음 운행 화면으로 진행한다.
 */
export async function 수락피드백전송(콜ID: string): Promise<boolean> {
  try {
    await post('/v1/carrier/decisions', {
      콜ID,
      action: 'ACCEPT',
      feedback: 'ACCEPT',
      선택여부: true,
      사유: null,
    })
    return true
  } catch {
    return false
  }
}
