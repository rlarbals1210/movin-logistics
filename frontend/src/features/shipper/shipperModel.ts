import { scenarioResults, windowOptions } from './shipperData'
import type { CallForm, ScenarioResult } from './shipperTypes'

/**
 * 분 → "HH:MM".
 *
 * 소수분을 먼저 반올림한다. 폼 입력은 정수지만 `예측_배차분` 은 모델 출력이라
 * 37.67 같은 소수로 온다. 반올림 없이 `% 60` 을 하면 부동소수 잔차가 그대로
 * 문자열이 되어 "12:55.67000000000007" 이 화면에 뜬다.
 * (고정값 시절엔 배차분이 정수뿐이라 드러나지 않던 버그다)
 */
export function minutesToTime(minutes: number) {
  const rounded = Math.round(minutes)
  const normalized = ((rounded % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const mins = normalized % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function timeWindowDuration(start: number, end: number) {
  const duration = end - start
  return duration > 0 ? duration : duration + 1440
}

export function formatWindow(minutes: number) {
  if (minutes === 1440) return '24시간'
  if (minutes < 60) return `${minutes}분`
  if (minutes % 60 === 0) return `${minutes / 60}시간`
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
}

export function formatDate(date: string) {
  if (!date) return '미선택'
  const parsed = new Date(`${date}T00:00:00`)
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(parsed)
}

export function addDaysToDate(date: string, days: number) {
  if (!date) return ''
  const parsed = new Date(`${date}T00:00:00`)
  parsed.setDate(parsed.getDate() + days)
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getSelectedLocation(region: string, detail: string, custom: string) {
  if (region === '기타') return custom.trim()
  return detail
}

export function getSelectedVehicle(form: CallForm) {
  return form.vehicle === '기타' ? form.vehicleCustom.trim() : form.vehicle
}

export function getSelectedCargo(form: CallForm) {
  return form.cargoItem === '기타' ? form.cargoItemCustom.trim() : form.cargoItem
}

export function resolveTonnage(form: CallForm): ScenarioResult['tonnage'] {
  const source = `${form.vehicle} ${form.vehicleCustom} ${form.cargoDescription}`
  const match = source.match(/(\d+(?:\.\d+)?)\s*(?:톤|t)/i)
  const tonnage = match ? Number(match[1]) : 5
  if (tonnage >= 18) return 25
  if (tonnage >= 8) return 11
  return 5
}

export function nearestWindow(minutes: number): ScenarioResult['windowMinutes'] {
  return windowOptions.reduce((closest, current) => (
    Math.abs(current - minutes) < Math.abs(closest - minutes) ? current : closest
  ))
}

export function getScenario(
  tonnage: ScenarioResult['tonnage'],
  windowMinutes: ScenarioResult['windowMinutes'],
  scenarios: ScenarioResult[] = scenarioResults,
) {
  return scenarios.find((result) => result.tonnage === tonnage && result.windowMinutes === windowMinutes)
    ?? scenarioResults.find((result) => result.tonnage === tonnage && result.windowMinutes === windowMinutes)
    ?? scenarioResults[0]
}

export function getCurrentScenario(form: CallForm, scenarios: ScenarioResult[] = scenarioResults) {
  const duration = timeWindowDuration(form.loadingStartMinutes, form.loadingEndMinutes)
  return getScenario(resolveTonnage(form), nearestWindow(duration), scenarios)
}

export function getNextRelaxedWindow(current: ScenarioResult['windowMinutes']) {
  const index = windowOptions.indexOf(current)
  return windowOptions[Math.min(index + 1, windowOptions.length - 1)]
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value)
}

export function formatShortCurrency(value: number) {
  const inTenThousands = value / 10000
  const display = Number.isInteger(inTenThousands)
    ? inTenThousands.toLocaleString('ko-KR')
    : inTenThousands.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return `${display}만원`
}

export function addMinutesToTime(startMinutes: number, minutes: number) {
  return minutesToTime(startMinutes + minutes)
}

export function adjustedWindowLabel(form: CallForm, durationMinutes: number) {
  if (durationMinutes >= 1440) return '00:00~24:00'
  const currentDuration = timeWindowDuration(form.loadingStartMinutes, form.loadingEndMinutes)
  const center = form.loadingStartMinutes + currentDuration / 2
  const start = (center - durationMinutes / 2 + 1440) % 1440
  const end = (start + durationMinutes) % 1440
  return `${minutesToTime(start)}~${minutesToTime(end)}`
}

export function callFieldCompletion(form: CallForm) {
  const values = [
    getSelectedLocation(form.originRegion, form.originDetail, form.originCustom),
    getSelectedLocation(form.destinationRegion, form.destinationDetail, form.destinationCustom),
    getSelectedVehicle(form),
    getSelectedCargo(form),
    form.cargoDescription.trim(),
    form.loadingDate,
  ]
  return values.filter(Boolean).length
}

/**
 * 유찰 확률(0~1) → 화면 표기용 백분율 숫자.
 *
 * 정수로 반올림하면 1.15% 와 0.53% 가 둘 다 "1%" 가 되어 시간창별 차이가
 * 화면에서 사라진다. 1% 미만 구간이 실제로 쓰이므로 10% 미만은 소수 한 자리다.
 *
 * 화면(MetricCards)과 AI 설명(시나리오_facts)이 **같은 값을 써야** 하므로
 * 여기 한 곳에 둔다.
 */
export function 유찰퍼센트(확률: number): number {
  const 퍼센트 = 확률 * 100
  return 퍼센트 < 10 ? Number(퍼센트.toFixed(1)) : Math.round(퍼센트)
}

/**
 * 시나리오 한 건을 AI 설명용 facts 로 바꾼다.
 *
 * **화면에 실제로 표시되는 값과 정확히 일치시킨다.** 원시값을 그대로 넘기면
 * 모델이 "유찰 확률 0.011544" 처럼 말하는데 화면에는 "1.2%" 로 떠 있어 어긋난다.
 * (실제 응답에서 확인했다 — 프롬프트에 백분율 규칙이 있어도 지켜지지 않았다)
 *
 * 키 이름에 단위를 박는 이유도 같다. 모델이 단위를 추측하지 않게 한다.
 */
export function 시나리오_facts(scenario: ScenarioResult) {
  return {
    톤급: scenario.tonnage,
    상차_시간창_분: scenario.windowMinutes,
    수락가능_차주_명: scenario.availableDrivers,
    예측_운임_원: scenario.estimatedFare,
    // MetricCards 와 같은 반올림을 쓴다. 화면은 "48분" 인데 문장은 "47.88분"
    // 이라고 말하는 일이 없어야 한다.
    예측_배차_분: Math.round(scenario.dispatchMinutes),
    유찰확률_퍼센트: 유찰퍼센트(scenario.failureProbability),
  }
}
