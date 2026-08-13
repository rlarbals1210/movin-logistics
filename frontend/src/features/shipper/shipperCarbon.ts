/**
 * 화주/주선사 리포트의 탄소 감축 산정.
 *
 * 순수 함수만 둔다. 화면·fetch 를 여기서 부르지 않는다(economics.ts 와 같은 규칙).
 *
 * ── 산정식 (docs/reference/hack/carbon-calculation-current.md) ──
 *
 *   E_baseline = D × EF_empty + (D × EF_loaded + D_dh × EF_empty)
 *   E_matched  = D × EF_loaded
 *   ΔE         = D × EF_empty + D_dh × EF_empty
 *
 * `E_baseline` 은 "이 화물을 별도 차량이 따로 실어 날랐다면" 의 배출량이다. 원래의 귀로
 * 공차(D × EF_empty)에, 그 별도 차량의 적재 주행(D × EF_loaded)과 상차지까지의 접근
 * 공차(D_dh × EF_empty)를 더한 값이다. 매칭은 이 중 공차 두 구간을 없애므로 그 차이가 ΔE 다.
 *
 * ΔE 를 `(D + D_dh) × EF_empty` 로 축약하지 않는다. 화면(ShipperReport 탄소 카드)에 원식이
 * 그대로 떠 있어서, 코드가 문서와 한 줄씩 대조되는 편이 낫다.
 */
import { 배출계수_kg_per_km } from '../../lib/emissions'
import type { CompletedOrderCarbonInput } from './shipperTypes'

export type 오더탄소 = {
  입력: CompletedOrderCarbonInput
  /** ΔE */
  감축량_kg: number
  /** E_baseline */
  기준배출량_kg: number
  감축률_퍼센트: number
}

export type 월간탄소요약 = {
  건수: number
  총감축량_kg: number
  건당평균감축량_kg: number
  총기준배출량_kg: number
  감축률_퍼센트: number
}

export function 오더_탄소감축(입력: CompletedOrderCarbonInput): 오더탄소 {
  const 계수 = 배출계수_kg_per_km[입력.tonnage]
  const D = 입력.matchedDistanceKm
  const D_dh = 입력.deadheadDistanceKm

  const 감축량_kg = D * 계수.공차 + D_dh * 계수.공차
  const 기준배출량_kg = D * 계수.공차 + (D * 계수.적재 + D_dh * 계수.공차)

  return {
    입력,
    감축량_kg,
    기준배출량_kg,
    감축률_퍼센트: 기준배출량_kg > 0 ? (감축량_kg / 기준배출량_kg) * 100 : 0,
  }
}

/**
 * 완료 오더 목록 → 월간 요약. 목록이 비면 `null`.
 *
 * 0 이 아니라 null 인 이유: PROJECT_KNOWLEDGE.md 198줄이 "거리와 배출계수가 연결되지 않은
 * 상태에서는 임의 값을 만들지 않고 `산정 대기`로 표시한다" 고 못박는다. 0 을 돌려주면 화면에
 * "0 kg" 이 떠서 "감축이 없었다" 로 읽히는데, 실제로는 "아직 계산할 데이터가 없다" 다.
 *
 * 합계는 반올림 전 값으로 더한다. 건별로 반올림해 더하면 총합이 화면의 건별 값 합과 어긋난다.
 */
export function 월간_탄소요약(입력들: CompletedOrderCarbonInput[]): 월간탄소요약 | null {
  if (입력들.length === 0) return null

  const 오더별 = 입력들.map(오더_탄소감축)
  const 총감축량_kg = 오더별.reduce((합, 건) => 합 + 건.감축량_kg, 0)
  const 총기준배출량_kg = 오더별.reduce((합, 건) => 합 + 건.기준배출량_kg, 0)

  return {
    건수: 오더별.length,
    총감축량_kg,
    건당평균감축량_kg: 총감축량_kg / 오더별.length,
    총기준배출량_kg,
    감축률_퍼센트: 총기준배출량_kg > 0 ? (총감축량_kg / 총기준배출량_kg) * 100 : 0,
  }
}

/** 1,000kg 이상은 t 으로 바꿔 표기한다. 월 단위 합계가 네 자리 kg 으로 잘 넘어간다. */
export function 탄소량표기(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })} tCO₂`
  return `${kg.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} kg`
}

export function 감축률표기(퍼센트: number): string {
  return `${퍼센트.toFixed(1)}%`
}
