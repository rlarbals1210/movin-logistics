import type { 운송인추천콜 } from '../../lib/types'

/** 화면 전용 좌표. API 좌표를 찾지 못한 경우 null로 유지한다. */
export interface 지도좌표 {
  lat: number
  lng: number
}

/** camelCase API를 화면에서 사용하는 단위/명칭으로 변환한 모델. */
export interface 추천콜상세 extends 운송인추천콜 {
  공차거리km: number
  복화가능성: number
  상차시각: string
  상차ISO: string
  출발좌표: 지도좌표 | null
  도착좌표: 지도좌표 | null
  운행시간분: number
  유류비원: number
  공차비원: number
  예상실수령원: number
  태그: string[]
  경고: string[]
  추천여부: boolean
}

export function 노선키(콜: Pick<추천콜상세, '출발지' | '도착지'>): string {
  return `${콜.출발지}->${콜.도착지}`
}
