/**
 * Gemini 한 줄 설명 로딩.
 *
 * `frontend/api/insights.ts`(Vercel 서버리스)를 부른다. 화면이 이미 계산해 둔
 * 사실(facts)을 넘기면 자연어 본문으로 바꿔 준다.
 *
 * ── 타입을 여기 두는 이유 ─────────────────────────────────
 * `lib/types.ts` 의 `InsightsRequest` 는 09:30 에 `{ role, payload }` 로 동결됐는데,
 * 실제 핸들러 계약은 `{ audience, facts }` 다. 동결 파일을 고치지 말라는 지시가
 * 그 파일 상단에 있으므로 실제 계약을 여기 로컬 타입으로 둔다.
 *
 * ── 설계 원칙 ─────────────────────────────────────────────
 * **이 값은 없어도 되는 값이다.** 실패·빈 응답·키 미설정이 전부 빈 문자열로
 * 떨어지고, 호출부는 비면 영역을 통째로 숨긴다. 발표 중 Gemini 가 죽거나
 * 느려도 화면은 그대로 뜬다.
 *
 * 핸들러가 응답 텍스트에 facts 에 없는 숫자가 섞이면 통째로 버린다.
 * 따라서 facts 에는 화면에 이미 떠 있는 값만 담는다 — 차이·합계를 미리
 * 계산해 넣지 마라. 모델이 그걸 인용하면 "화면에 없는 숫자"가 되어 버려진다.
 */
import { useEffect, useState } from 'react'
import { fetchInsights } from './api'

export type InsightAudience = 'SHIPPER' | 'CARRIER'

export interface InsightState {
  /** 빈 문자열이면 표시하지 않는다 */
  text: string
  로딩중: boolean
}

/**
 * @param audience 프롬프트 톤을 고른다. 화주는 2문단, 운송인은 2~3문장이다.
 * @param facts    JSON 직렬화 가능한 사실. 값이 바뀌면 다시 부른다.
 * @param 사용     false 면 아예 호출하지 않는다.
 */
export function useInsight(audience: InsightAudience, facts: unknown, 사용 = true): InsightState {
  const [state, setState] = useState<InsightState>({ text: '', 로딩중: false })

  // facts 는 매 렌더 새 객체라 그대로 의존성에 넣으면 무한 루프가 된다.
  // 직렬화한 문자열로 비교한다 — 작은 객체라 비용이 문제되지 않는다.
  const 키 = 사용 ? JSON.stringify(facts) : ''

  useEffect(() => {
    if (키 === '') {
      setState({ text: '', 로딩중: false })
      return
    }

    const controller = new AbortController()
    setState({ text: '', 로딩중: true })

    fetchInsights({ audience, facts: JSON.parse(키) as unknown }, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setState({ text: res.text, 로딩중: false })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ text: '', 로딩중: false })
      })

    return () => controller.abort()
  }, [audience, 키])

  return state
}
