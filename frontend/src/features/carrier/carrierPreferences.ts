export interface CarrierPreferences {
  권역: string
  세부지역: string
  선호시간: string[]
  우선조건: string[]
}

export type CarrierTimeCode = 'MORNING' | 'AFTERNOON' | 'NIGHT'

export interface CarrierMatchQuery {
  region: string
  subregion: string
  timeSlots: CarrierTimeCode[]
  maxEmptyKm?: 30
  maxDurationHours?: 8
  prioritizeIncome?: true
  prioritizeBackhaul?: true
}

const 시간코드: Record<string, CarrierTimeCode> = {
  오전: 'MORNING',
  오후: 'AFTERNOON',
  야간: 'NIGHT',
}

/** 이전 시간대 선택값을 새 오전/오후/야간 분류로 옮긴다. */
const 이전시간대: Record<string, '오전' | '오후' | '야간'> = {
  '00-06시': '야간',
  '06-09시': '오전',
  '09-12시': '오전',
  '12-15시': '오후',
  '15-18시': '오후',
  '18-21시': '야간',
  '21-24시': '야간',
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

/** 화면 선택값을 운송인 매칭 API 쿼리 계약으로 변환한다. */
export function 선호조건을매칭쿼리로(value: CarrierPreferences): CarrierMatchQuery {
  const query: CarrierMatchQuery = {
    region: value.권역,
    subregion: value.세부지역,
    timeSlots: value.선호시간.includes('상관없음')
      ? []
      : value.선호시간.map((time) => 시간코드[time]).filter((time): time is CarrierTimeCode => time !== undefined),
  }

  if (value.우선조건.includes('공차 30km 이내')) query.maxEmptyKm = 30
  if (value.우선조건.includes('8시간 이내의 거리')) query.maxDurationHours = 8
  if (value.우선조건.includes('많은 수익')) query.prioritizeIncome = true
  if (value.우선조건.includes('복화 가능성')) query.prioritizeBackhaul = true

  return query
}

/** URLSearchParams의 반복 키를 사용해 timeSlots 배열을 보존한다. */
export function 매칭쿼리문자열(value: CarrierPreferences): string {
  const query = 선호조건을매칭쿼리로(value)
  const params = new URLSearchParams({ region: query.region, subregion: query.subregion })
  for (const time of query.timeSlots) params.append('timeSlots', time)
  if (query.maxEmptyKm !== undefined) params.set('maxEmptyKm', String(query.maxEmptyKm))
  if (query.maxDurationHours !== undefined) params.set('maxDurationHours', String(query.maxDurationHours))
  if (query.prioritizeIncome !== undefined) params.set('prioritizeIncome', 'true')
  if (query.prioritizeBackhaul !== undefined) params.set('prioritizeBackhaul', 'true')
  return params.toString()
}

/** 현재 도착지와 이미 처리한 콜/노선을 다음 매칭 요청에 함께 보낸다. */
export function 후속매칭쿼리문자열(
  value: CarrierPreferences,
  currentLocation: string,
  excludeCallIds: string[],
  excludeRouteKeys: string[],
): string {
  const params = new URLSearchParams(매칭쿼리문자열(value))
  params.set('currentLocation', currentLocation)
  excludeCallIds.forEach((id) => params.append('excludeCallIds', id))
  excludeRouteKeys.forEach((route) => params.append('excludeRouteKeys', route))
  return params.toString()
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
    const 선호시간 = value.선호시간
      .filter((item): item is string => typeof item === 'string')
      .map((item) => 이전시간대[item] ?? item)
    return {
      권역: value.권역,
      세부지역: value.세부지역,
      선호시간: [...new Set(선호시간)],
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

export function 선호조건초기화(): void {
  try { localStorage.removeItem(저장키) } catch { /* 브라우저 저장소가 막혀도 초기화는 계속한다. */ }
}
