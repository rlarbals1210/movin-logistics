/**
 * 차량 프로필.
 *
 * `운송인추천콜` 에 톤급이 없어서(types.ts 동결) 유류비 계산의 톤급이 여기서 온다.
 * 즉 이 프로필은 부가 설정이 아니라 실수령 계산의 전제다.
 *
 * 저장은 localStorage 뿐이다. 서버 저장은 해커톤 범위 밖이다.
 */
import type { 톤급 } from '../../lib/types'

export interface VehicleProfile {
  톤급: 톤급
  /** 도착지 앞부분과 문자열 비교한다. 예: '충북' */
  귀가희망지역: string
}

const 저장키 = 'movin.carrier.profile'

/** 데모 기본값 — 청주 거주 11톤 차주 */
export const 기본프로필: VehicleProfile = {
  톤급: 11,
  귀가희망지역: '충북',
}

export const 톤급_선택지: 톤급[] = [5, 11, 25]

export const 지역_선택지 = ['서울', '경기', '인천', '충북', '충남', '경북', '경남', '전남', '전북', '강원', '부산']

function 유효한가(v: unknown): v is VehicleProfile {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return 톤급_선택지.includes(o['톤급'] as 톤급) && typeof o['귀가희망지역'] === 'string'
}

export function 프로필읽기(): VehicleProfile {
  try {
    const raw = localStorage.getItem(저장키)
    if (raw === null) return 기본프로필
    const parsed: unknown = JSON.parse(raw)
    return 유효한가(parsed) ? parsed : 기본프로필
  } catch {
    // 사파리 프라이빗 모드 등에서 localStorage 가 던진다. 기본값으로 계속 간다.
    return 기본프로필
  }
}

export function 프로필저장(profile: VehicleProfile): void {
  try {
    localStorage.setItem(저장키, JSON.stringify(profile))
  } catch {
    // 저장 실패가 화면을 막을 이유는 없다
  }
}
