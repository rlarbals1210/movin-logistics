/**
 * API 응답 → 화면 타입 변환.
 *
 * 필드명이 흔들려도 화면을 안 건드리게 하는 것이 이 모듈의 목적이다.
 * ai 산출물의 키 이름이 이미 두 번 바뀌었고(`시간창(분)` → `상차 시간창(분)`),
 * 공통 계약 타입과 외부 산출물 사이의 이름 차이를 여기서 흡수한다.
 *
 * 진입점은 둘이다.
 *   toCarrierCalls  GET  /v1/matches/carrier/{id}  → 운송인추천콜[]
 *   toPredictions   POST /v1/matches/shipper       → Predictions
 *
 * 화주 시나리오는 `toPredictions(raw).화주_시나리오` 로 꺼낸다. 전용 함수를 두지
 * 않는다 — 빈 배열을 조용히 돌려주는 스텁이 있으면 누군가 그걸 배선하고
 * 격자가 빈 채로 발표에 나간다.
 */
import type { Predictions, 모델지표, 시간창분, 운송인추천콜, 톤급, 화주시나리오 } from './types'

/**
 * 백엔드 매칭 응답 → 운송인 추천콜 목록.
 *
 * `GET /v1/matches/carrier/{id}` 응답을 그대로 받는다.
 * 필드명 흔들림은 아래 `추천콜_별칭` 이 흡수한다 — toPredictions 와 같은 경로다.
 * 비면 예시 3건으로 떨어진다. 운송인 화면이 빈 목록이 되는 것보다 낫다.
 */
export function toCarrierCalls(raw: unknown): 운송인추천콜[] {
  const src = 객체인가(raw) ? raw : {}
  const 목록 = 행목록(src['운송인_추천콜'])
    .map(추천콜로)
    .filter((c): c is 운송인추천콜 => c !== undefined)

  return 목록.length > 0 ? 목록 : 예시_추천콜
}

const 톤급_목록: readonly 톤급[] = [5, 11, 25]
const 시간창_목록: readonly 시간창분[] = [40, 120, 240, 480, 720, 1440]

/**
 * 필드명 후보.
 *
 * ai 쪽 산출물의 키 이름이 이미 두 번 바뀌었다(`시간창(분)` → `상차 시간창(분)`).
 * 공통 계약의 이름을 맞추는 책임은 이쪽에 있다.
 * 계약명을 맨 앞에 두고, 지금까지 실제로 나온 변형을 전부 받는다.
 */
const 시나리오_별칭 = {
  톤급: ['톤급'],
  시간창_분: ['시간창_분', '상차 시간창(분)', '시간창(분)', '시간창분'],
  수락가능차주: ['수락가능차주', '수락 가능 차주 수', '수락가능 차주 수', '수락가능_현조건'],
  예측_운임: ['예측_운임', '예상 운임', '예상운임'],
  예측_배차분: ['예측_배차분', '배차 소요 시간(분)', '배차 소요(분)', '배차소요분'],
  유찰확률: ['유찰확률', '유찰 확률'],
} as const

const 추천콜_별칭 = {
  콜ID: ['콜ID', '콜아이디', 'call_id'],
  출발지: ['출발지', '상차지'],
  도착지: ['도착지', '하차지'],
  거리km: ['거리km', '거리_km', '거리(km)'],
  예측_운임: ['예측_운임', '예상 운임', '예상운임'],
  톨비: ['톨비', '통행료'],
  표준소요_h: ['표준소요_h', '표준 소요 시간(h)', '표준소요시간_h', '소요_h'],
} as const

/**
 * 모델지표 폴백 — phase5 노트북 실행 출력에서 읽은 실측값이다.
 *
 * predictions.example.json 의 0.842 / 0.791 / 218473 은 09:30 에 넣은 임의값이라
 * 그대로 쓰면 발표에서 틀린 숫자를 말하게 된다. 여기서 실측으로 덮는다.
 * ai 쪽이 `모델지표` 를 채워 보내면 그쪽이 이긴다.
 */
const 실측_모델지표: 모델지표 = {
  수락예측_AUC: 0.72, // 모델 A 전체 (cell 6)
  유찰예측_AUC: 0.747, // 모델 B-유찰 CV (cell 12)
  학습행수: 9324, // 모델 A 학습 행수 (cell 4)
}

/**
 * 운송인 추천콜 폴백.
 *
 * ai 산출물에 `운송인_추천콜` 이 아직 없다. 이게 비면 운송인 화면이 빈 목록이 되므로
 * example.json 과 같은 3건을 여기 둔다. 실데이터가 오면 자동으로 밀려난다.
 */
export const 예시_추천콜: 운송인추천콜[] = [
  { 콜ID: 'CALL-1042', 출발지: '경기 화성시 향남읍', 도착지: '충북 청주시 흥덕구', 거리km: 118.4, 예측_운임: 352000, 톨비: 6800, 표준소요_h: 2.1 },
  { 콜ID: 'CALL-1087', 출발지: '인천 서구 가좌동', 도착지: '경북 구미시 산동읍', 거리km: 287.6, 예측_운임: 615000, 톨비: 18400, 표준소요_h: 4.3 },
  { 콜ID: 'CALL-1113', 출발지: '부산 강서구 미음동', 도착지: '전남 광양시 황금동', 거리km: 164.2, 예측_운임: 428000, 톨비: 9700, 표준소요_h: 2.6 },
]

function 객체인가(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

/** 별칭 목록을 순서대로 훑어 처음 찾은 값을 돌려준다 */
function 값찾기(row: Record<string, unknown>, 후보: readonly string[]): unknown {
  for (const key of 후보) {
    if (row[key] !== undefined && row[key] !== null) return row[key]
  }
  return undefined
}

function 숫자로(v: unknown): number | undefined {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
}

function 문자로(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return undefined
}

/**
 * `records` 는 배열로도 객체로도 온 적이 있다.
 * (초안은 `{"5_40": {...}}` 형태였고 지금은 배열이다)
 */
function 행목록(v: unknown): Record<string, unknown>[] {
  if (Array.isArray(v)) return v.filter(객체인가)
  if (객체인가(v)) return Object.values(v).filter(객체인가)
  return []
}

function 시나리오로(row: Record<string, unknown>): 화주시나리오 | undefined {
  const 톤 = 숫자로(값찾기(row, 시나리오_별칭.톤급))
  const 창 = 숫자로(값찾기(row, 시나리오_별칭.시간창_분))
  if (톤 === undefined || 창 === undefined) return undefined
  // 계약에 없는 축 값은 화면 그리드에 자리가 없으므로 버린다.
  if (!톤급_목록.includes(톤 as 톤급) || !시간창_목록.includes(창 as 시간창분)) return undefined

  return {
    톤급: 톤 as 톤급,
    시간창_분: 창 as 시간창분,
    수락가능차주: 숫자로(값찾기(row, 시나리오_별칭.수락가능차주)) ?? 0,
    예측_운임: 숫자로(값찾기(row, 시나리오_별칭.예측_운임)) ?? 0,
    예측_배차분: 숫자로(값찾기(row, 시나리오_별칭.예측_배차분)) ?? 0,
    유찰확률: 숫자로(값찾기(row, 시나리오_별칭.유찰확률)) ?? 0,
  }
}

function 추천콜로(row: Record<string, unknown>): 운송인추천콜 | undefined {
  const 콜ID = 문자로(값찾기(row, 추천콜_별칭.콜ID))
  if (콜ID === undefined) return undefined

  return {
    콜ID,
    출발지: 문자로(값찾기(row, 추천콜_별칭.출발지)) ?? '-',
    도착지: 문자로(값찾기(row, 추천콜_별칭.도착지)) ?? '-',
    거리km: 숫자로(값찾기(row, 추천콜_별칭.거리km)) ?? 0,
    예측_운임: 숫자로(값찾기(row, 추천콜_별칭.예측_운임)) ?? 0,
    톨비: 숫자로(값찾기(row, 추천콜_별칭.톨비)) ?? 0,
    표준소요_h: 숫자로(값찾기(row, 추천콜_별칭.표준소요_h)) ?? 0,
  }
}

function 모델지표로(v: unknown): 모델지표 | undefined {
  if (!객체인가(v)) return undefined
  const 수락 = 숫자로(v['수락예측_AUC'])
  const 유찰 = 숫자로(v['유찰예측_AUC'])
  const 행수 = 숫자로(v['학습행수'])
  if (수락 === undefined || 유찰 === undefined || 행수 === undefined) return undefined
  return { 수락예측_AUC: 수락, 유찰예측_AUC: 유찰, 학습행수: 행수 }
}

/**
 * 축이 죽었는지 본다.
 *
 * 10:58 산출물은 5·11·25톤 결과가 원 단위까지 같아서 15칸 그리드가 5칸으로 보였다.
 * 화면은 정상으로 보이는데 숫자만 틀린 종류의 사고라 눈으로는 못 잡는다.
 * 개발 중에만 콘솔로 알린다 — 데이터를 고치지는 않는다.
 */
function 축_점검(목록: 화주시나리오[]): void {
  if (!import.meta.env.DEV || 목록.length === 0) return

  const 운임_고유 = new Set(목록.map((s) => s.예측_운임)).size
  if (운임_고유 < 목록.length / 2) {
    console.warn(`[predictions] 예측_운임 고유값이 ${운임_고유}개뿐이다 (${목록.length}행). 톤급·시간창 축이 죽었을 수 있다.`)
  }

  for (const 창 of 시간창_목록) {
    const 운임 = 톤급_목록.map((t) => 목록.find((s) => s.톤급 === t && s.시간창_분 === 창)?.예측_운임)
    if (운임.every((v) => v !== undefined) && new Set(운임).size === 1) {
      console.warn(`[predictions] 시간창 ${창}분에서 5·11·25톤 운임이 전부 ${운임[0]}원으로 같다.`)
    }
  }
}

/**
 * predictions.json 원본 → 화면용.
 *
 * ai 산출물(`records` + ai 쪽 필드명)과 계약 형태(`화주_시나리오`)를 둘 다 받는다.
 * 이름이 또 바뀌어도 화면은 안 건드리게 하는 게 이 함수의 목적이다.
 */
export function toPredictions(raw: unknown): Predictions {
  const src = 객체인가(raw) ? raw : {}

  const 시나리오_원본 = src['화주_시나리오'] ?? src['records']
  const 화주_시나리오 = 행목록(시나리오_원본)
    .map(시나리오로)
    .filter((s): s is 화주시나리오 => s !== undefined)

  const 추천콜 = 행목록(src['운송인_추천콜'])
    .map(추천콜로)
    .filter((c): c is 운송인추천콜 => c !== undefined)

  축_점검(화주_시나리오)

  return {
    화주_시나리오,
    운송인_추천콜: 추천콜.length > 0 ? 추천콜 : 예시_추천콜,
    모델지표: 모델지표로(src['모델지표']) ?? 실측_모델지표,
  }
}
