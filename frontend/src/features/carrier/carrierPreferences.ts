export interface CarrierPreferences {
  권역: string
  세부지역: string
  선호시간: string[]
  우선조건: string[]
}

const 저장키 = 'movin.carrier.preferences.v2'

export const 빈선호조건: CarrierPreferences = {
  권역: '',
  세부지역: '',
  선호시간: [],
  우선조건: [],
}

export function 선호조건완료인가(value: CarrierPreferences): boolean {
  return Boolean(
    value.권역 &&
    value.세부지역 &&
    value.선호시간.length > 0 &&
    value.우선조건.length > 0,
  )
}

export function 선호조건읽기(): CarrierPreferences {
  try {
    const raw = localStorage.getItem(저장키)
    if (raw === null) return 빈선호조건
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return 빈선호조건
    const value = parsed as Partial<CarrierPreferences>
    if (
      typeof value.권역 !== 'string' ||
      typeof value.세부지역 !== 'string' ||
      !Array.isArray(value.선호시간) ||
      !Array.isArray(value.우선조건)
    ) return 빈선호조건
    return {
      권역: value.권역,
      세부지역: value.세부지역,
      선호시간: value.선호시간.filter((item): item is string => typeof item === 'string'),
      우선조건: value.우선조건.filter((item): item is string => typeof item === 'string'),
    }
  } catch {
    return 빈선호조건
  }
}

export function 선호조건저장(value: CarrierPreferences): void {
  try {
    localStorage.setItem(저장키, JSON.stringify(value))
  } catch {
    // 저장 실패가 운행 흐름을 막지 않게 한다.
  }
}
