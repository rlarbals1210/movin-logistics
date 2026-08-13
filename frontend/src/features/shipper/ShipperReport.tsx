import { useMemo, useState } from 'react'
import { useInsight } from '../../lib/useInsight'
import { 감축률표기, 월간_탄소요약, 탄소량표기 } from './shipperCarbon'
import { completedOrderCarbonInputs } from './shipperCarbonOrders'
import { operationLogs, shipperReportMetrics } from './shipperData'
import {
  formatShortCurrency,
  formatWindow,
  getCurrentScenario,
  getScenario,
  getSelectedLocation,
  시나리오_facts,
  차종대체계산출처,
  차종대체효과적용,
} from './shipperModel'
import type { CallForm, ComparisonOptions, DispatchDecision, ScenarioResult, ShipperModelMetadata } from './shipperTypes'

type ShipperReportProps = {
  form: CallForm
  scenarios: ScenarioResult[]
  modelMetadata: ShipperModelMetadata
  options: ComparisonOptions
  decision: DispatchDecision
}

function decisionLabel(decision: DispatchDecision) {
  if (decision === 'adjusted') return '조정안으로 등록'
  if (decision === 'current') return '현재 조건 유지'
  return '아직 선택하지 않음'
}

function AiInsightNote({ decision, facts }: { decision: DispatchDecision; facts: Record<string, unknown> | null }) {
  const { text, 로딩중 } = useInsight('SHIPPER', facts, facts !== null)

  if (decision === null) return null
  if (!로딩중 && text === '') return null

  return (
    <div className="mt-md border-t border-[#444] pt-md">
      <div className="flex items-center gap-xs">
        <span className="material-symbols-outlined text-[18px] text-primary-fixed" aria-hidden="true">auto_awesome</span>
        <p className="text-label-sm font-bold text-primary-fixed">AI 설명</p>
      </div>
      {로딩중 ? (
        <div className="mt-sm space-y-xs" aria-busy="true">
          <div className="h-3 w-1/3 rounded bg-white/20 animate-pulse" />
          <div className="h-3 w-full rounded bg-white/20 animate-pulse" />
        </div>
      ) : (
        <p className="mt-sm whitespace-pre-line text-body-md leading-6 text-secondary-fixed">{text}</p>
      )}
    </div>
  )
}

function AiSummary({ form, scenarios, options, decision }: ShipperReportProps) {
  const current = getCurrentScenario(form, scenarios)
  const baseAdjusted = getScenario(current.tonnage, options.relaxedWindowMinutes, scenarios)
  const adjusted = 차종대체효과적용(baseAdjusted, form, options.allowVehicleSubstitution)
  const route = `${getSelectedLocation(form.originRegion, form.originDetail, form.originCustom) || '출발지 미입력'} → ${getSelectedLocation(form.destinationRegion, form.destinationDetail, form.destinationCustom) || '도착지 미입력'}`

  const summary = decision === 'adjusted'
    ? `${route} 콜은 상차 시간창을 ${formatWindow(current.windowMinutes)}에서 ${formatWindow(adjusted.windowMinutes)}까지 열어 등록했습니다.${options.allowDateDelay ? ' 상차일 하루 연기를 포함한 조정안입니다.' : ''}${options.allowVehicleSubstitution ? ' 동일 톤급 호환 차종까지 후보군을 확장한 계산을 포함합니다.' : ''} 조정안의 수락 가능 차주는 ${current.availableDrivers}명에서 ${adjusted.availableDrivers}명으로 변하고, 예상 운임은 ${formatShortCurrency(current.estimatedFare)}에서 ${formatShortCurrency(adjusted.estimatedFare)}으로 변합니다.`
    : decision === 'current'
      ? `${route} 콜은 입력한 조건을 그대로 유지했습니다. 조건을 바꾸지 않아도 불이익은 없으며, 이번 선택은 다음 제안의 판단 근거로 기록됩니다. 현재 원본 조합의 예상 수락 가능 차주는 ${current.availableDrivers}명, 예상 운임은 ${formatShortCurrency(current.estimatedFare)}입니다.`
      : '조건 비교에서 진행 방식을 선택하면 이번 배차 조건의 의미와 예상 결과를 화주/주선사용 문장으로 정리합니다.'

  // InsightNote(ConditionComparison.tsx)와 같은 규칙: facts 에는 화면에 이미 뜬 값만 담는다.
  const facts = useMemo(() => {
    if (decision === null) return null
    return {
      결정: decisionLabel(decision),
      노선: route,
      현재조건: 시나리오_facts(current),
      ...(decision === 'adjusted' ? { 조정안: 시나리오_facts(adjusted), 상차일_연기_포함: options.allowDateDelay, 차종_대체_허용: options.allowVehicleSubstitution } : {}),
    }
  }, [decision, route, current, adjusted, options.allowDateDelay, options.allowVehicleSubstitution])

  return (
    <div className="rounded-2xl bg-on-secondary-fixed p-xl text-secondary-fixed">
      <div className="flex items-center justify-between gap-lg">
        <div>
          <p className="text-label-sm font-black text-primary-fixed">Gemini 자연어 설명</p>
          <h2 className="mt-xs text-headline-sm font-black">이번 배차 조건 선택 결과</h2>
        </div>
        <span className="rounded-full bg-[#292927] px-md py-sm text-label-sm font-bold text-secondary-fixed-dim">자료 기반 생성형 AI 연동</span>
      </div>
      <p className="mt-lg max-w-4xl text-body-lg leading-7 text-secondary-fixed">{summary}</p>
      <AiInsightNote decision={decision} facts={facts} />
      <p className="mt-md border-t border-[#444] pt-md text-label-sm text-secondary-fixed-dim">
        표시 데이터: 콜 등록값 · 현재/조정 시나리오 · 사용자 선택 · 운영 리포트
      </p>
    </div>
  )
}

function StatCard({ label, value, helper, accent }: { label: string; value: string; helper: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-lg ${accent ? 'border-primary bg-[#fffdf0]' : 'border-outline-variant bg-white'}`}>
      <p className="text-label-sm font-bold text-secondary">{label}</p>
      <p className="mt-md text-[30px] font-black tracking-[-0.04em] text-on-surface">{value}</p>
      <p className="mt-xs text-label-sm text-secondary">{helper}</p>
    </div>
  )
}

// 정적 import 라 렌더마다 다시 계산할 이유가 없다. 데이터가 비면 null 이고, 그때 화면은
// 계산값 대신 `산정 대기` 를 띄운다(PROJECT_KNOWLEDGE.md 198줄).
const 월간탄소 = 월간_탄소요약(completedOrderCarbonInputs)

function ReportContent({ form, scenarios, modelMetadata, options, decision, compact = false }: ShipperReportProps & { compact?: boolean }) {
  const current = getCurrentScenario(form, scenarios)
  const baseAdjusted = getScenario(current.tonnage, options.relaxedWindowMinutes, scenarios)
  const adjusted = 차종대체효과적용(baseAdjusted, form, options.allowVehicleSubstitution)
  const chosen = decision === 'adjusted' ? adjusted : current
  const route = `${getSelectedLocation(form.originRegion, form.originDetail, form.originCustom) || '미입력'} → ${getSelectedLocation(form.destinationRegion, form.destinationDetail, form.destinationCustom) || '미입력'}`

  return (
    <div className={compact ? 'space-y-lg' : 'space-y-xl'}>
      <div>
        <p className="text-label-sm font-black text-primary">2026년 8월 · 화주/주선사 월간 리포트</p>
        <h2 className="mt-xs text-[30px] font-black tracking-[-0.03em] text-on-surface">발주 조건이 만든 운영 변화</h2>
        <p className="mt-sm text-body-md text-secondary">최근 운영 로그와 현재 탄소 감축 산정 기준을 함께 정리했습니다.</p>
      </div>

      <div className="grid grid-cols-4 gap-sm">
        <StatCard label="중앙 배차시간 단축" value={`${shipperReportMetrics.medianTimeSavedMinutes}분`} helper={`성사 중앙 배차값 ${shipperReportMetrics.medianDispatchMinutes}분`} accent />
        <StatCard label="조정 가능 콜" value={`${shipperReportMetrics.adjustableCalls}건`} helper={`분석 콜 ${shipperReportMetrics.analyzedCalls}건 중`} />
        <StatCard label="예측 운임 차이" value={formatShortCurrency(shipperReportMetrics.predictedFareDifference)} helper="현재 조건 대비 제안 차이" />
        <StatCard label="제안 수락률" value={`${shipperReportMetrics.suggestionAcceptanceRate}%`} helper={`시간 제안 ${shipperReportMetrics.timeSuggestions}건`} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-lg">
        <section className="rounded-2xl border border-outline-variant bg-white p-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-headline-sm font-black text-on-surface">탄소배출 감축</h3>
              <p className="mt-xs text-body-md text-secondary">기존 공차 운행과 매칭 후 운행의 배출량 차이를 기준으로 계산합니다.</p>
              <span className="mt-sm inline-flex whitespace-nowrap rounded-full bg-surface-container px-md py-sm text-label-sm font-bold text-secondary">
                {월간탄소 ? `완료 오더 ${월간탄소.건수}건 기준` : '운행 데이터 연결 대기'}
              </span>
            </div>
            <span className="material-symbols-outlined text-[30px] text-[#007a5a]" aria-hidden="true">eco</span>
          </div>
          <div className="mt-lg grid grid-cols-3 gap-md">
            <div><p className="text-label-sm text-secondary">총 감축량</p><strong className="mt-xs block text-headline-sm font-black text-on-surface">{월간탄소 ? 탄소량표기(월간탄소.총감축량_kg) : '산정 대기'}</strong><p className="mt-xs text-label-sm text-secondary">월간 탄소 감축량 합계</p></div>
            <div><p className="text-label-sm text-secondary">건당 감축</p><strong className="mt-xs block text-headline-sm font-black text-on-surface">{월간탄소 ? 탄소량표기(월간탄소.건당평균감축량_kg) : '산정 대기'}</strong><p className="mt-xs text-label-sm text-secondary">오더별 탄소 감축량</p></div>
            <div><p className="text-label-sm text-secondary">감축률</p><strong className="mt-xs block text-headline-sm font-black text-on-surface">{월간탄소 ? 감축률표기(월간탄소.감축률_퍼센트) : '산정 대기'}</strong><p className="mt-xs text-label-sm text-secondary">탄소감축량 ÷ 기존 배출량 × 100</p></div>
          </div>
          <div className="mt-lg rounded-xl bg-surface-container-low p-md">
            <p className="text-label-sm font-black text-on-surface">탄소 감축량은 어떻게 계산되나요?</p>
            <p className="mt-sm text-label-sm leading-5 text-secondary">
              플랫폼을 통한 탄소 감축량은 플랫폼이 없었을 때 발생했을 기존 배출량에서 매칭 후 실제 발생한 배출량을 빼서 계산합니다.
            </p>
            <ul className="mt-sm space-y-xs text-label-sm leading-5 text-secondary">
              <li><strong className="text-on-surface">기존 배출량 예측:</strong> 화물 운송 배출량 + 빈 차로 복귀하는 배출량 + 다음 짐을 찾기 위해 이동하는 배출량</li>
              <li><strong className="text-on-surface">매칭 후 배출량:</strong> 빈 차 이동 없이 꽉 채워서 운송한 배출량</li>
              <li><strong className="text-on-surface">최종 감축량:</strong> 매칭을 통해 완전히 없애버린 빈 차 이동 거리에 해당하는 탄소 배출량</li>
            </ul>
            <p className="mt-md border-t border-outline-variant pt-md text-center font-mono text-label-md font-black text-on-surface">
              ΔE = D × EF_empty + D_dh × EF_empty
            </p>
            <p className="mt-md text-label-sm leading-5 text-secondary">
              배출계수는 경유 2.609kg CO₂/L(「에너지법 시행규칙」 별표12, 연소 기준)를 톤급별 연비로 나눈 값입니다. 연비는 업계 평균 추정치이며, 접근 공차거리(D_dh)는 매칭 시점의 추정값입니다.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-outline-variant bg-white p-lg">
          <h3 className="text-headline-sm font-black text-on-surface">이번 달 분석 활동</h3>
          <dl className="mt-lg space-y-md">
            {[
              ['분석한 오더', `${shipperReportMetrics.analyzedCalls}건`],
              ['시간 제안', `${shipperReportMetrics.timeSuggestions}건`],
              ['제안 수락', `${shipperReportMetrics.completedCalls}건`],
              ['모델 학습 표본', `${modelMetadata.trainingRows.toLocaleString('ko-KR')}행`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-outline-variant pb-sm last:border-0">
                <dt className="text-body-md text-secondary">{label}</dt>
                <dd className="text-body-md font-black text-on-surface">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-lg">
        <section className="rounded-2xl border border-outline-variant bg-white p-lg">
          <h3 className="text-headline-sm font-black text-on-surface">최근 연결 결과</h3>
          <div className="mt-lg rounded-xl bg-surface-container-low p-md">
            <p className="text-label-sm text-secondary">최근 노선</p>
            <p className="mt-xs text-headline-sm font-black text-on-surface">{route}</p>
          </div>
          <dl className="mt-md grid grid-cols-3 gap-sm">
            <div><dt className="text-label-sm text-secondary">최근 선택</dt><dd className="mt-xs text-body-md font-black">{decisionLabel(decision)}</dd></div>
            <div><dt className="text-label-sm text-secondary">예상 차주</dt><dd className="mt-xs text-body-md font-black">{chosen.availableDrivers}명</dd></div>
            <div><dt className="text-label-sm text-secondary">운송인 응답</dt><dd className="mt-xs text-body-md font-black text-primary">{decision ? '응답 대기' : '등록 전'}</dd></div>
          </dl>
        </section>

        <section className="rounded-2xl border border-outline-variant bg-white p-lg">
          <h3 className="text-headline-sm font-black text-on-surface">최근 운영 기록</h3>
          <div className="mt-md space-y-sm">
            {operationLogs.slice(0, compact ? 2 : 3).map((log) => (
              <div key={`${log.date}-${log.title}`} className="grid grid-cols-[52px_minmax(0,1fr)_72px] items-center gap-md rounded-xl bg-surface-container-low p-md">
                <span className="text-label-sm font-bold text-secondary">{log.date}</span>
                <span><strong className="block text-body-md text-on-surface">{log.title}</strong><span className="mt-xs block text-label-sm text-secondary">{log.detail}</span></span>
                <span className="text-right text-label-sm font-black text-primary">{log.status}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ReportPrintDialog({ onClose, ...props }: ShipperReportProps & { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-xl print:static print:block print:bg-white print:p-0 animate-[mv-backdrop-in_180ms_ease-out] motion-reduce:animate-none print:animate-none">
      <section role="dialog" aria-modal="true" aria-labelledby="print-report-title" className="report-print-surface max-h-[92vh] w-full max-w-[1180px] overflow-y-auto rounded-3xl bg-background p-xl shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:p-0 print:shadow-none animate-[mv-modal-in_200ms_ease-out] motion-reduce:animate-none print:animate-none">
        <div className="mb-lg flex items-center justify-between gap-lg print:hidden">
          <div>
            <p className="text-label-sm font-black text-primary">저장 전 미리보기</p>
            <h2 id="print-report-title" className="mt-xs text-headline-md font-black text-on-surface">데이터 리포트</h2>
            <p className="mt-xs text-body-md text-secondary">인쇄 창에서 PDF로 저장할 수 있습니다.</p>
          </div>
          <div className="flex gap-sm">
            <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-outline px-lg text-label-md font-bold text-on-surface">닫기</button>
            <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-sm rounded-full bg-on-secondary-fixed px-lg text-label-md font-black text-primary-fixed">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">print</span>
              인쇄 / PDF 저장
            </button>
          </div>
        </div>
        <ReportContent {...props} compact />
        <div className="mt-lg rounded-xl border border-outline-variant bg-white p-md">
          <p className="text-label-sm font-black text-on-surface">조정 결과의 근거</p>
          <p className="mt-xs text-label-sm leading-5 text-secondary">톤급×시간창 원본 시나리오, 사용자 선호 조건, 콜 입력값, 최근 운영 기록을 사용했습니다.{props.options.allowVehicleSubstitution ? ` 차종 대체 효과는 ${차종대체계산출처}로 계산했습니다.` : ''}</p>
        </div>
      </section>
    </div>
  )
}

function ShipperReport(props: ShipperReportProps) {
  const [printOpen, setPrintOpen] = useState(false)

  return (
    <section className="space-y-lg" aria-labelledby="report-title">
      <div className="rounded-2xl border border-outline-variant bg-white p-xl">
        <div className="flex items-start justify-between gap-xl">
          <div>
            <h1 id="report-title" className="text-[32px] font-black leading-tight tracking-[-0.03em] text-on-surface">월간 리포트</h1>
            <p className="mt-sm text-body-lg text-secondary">조건 선택 결과, 운영 성과, 탄소 감축 근거를 화주/주선사 관점에서 확인합니다.</p>
          </div>
          <button type="button" onClick={() => setPrintOpen(true)} className="inline-flex min-h-12 items-center gap-sm rounded-full bg-on-secondary-fixed px-xl text-label-md font-black text-primary-fixed hover:bg-[#292927]">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">download</span>
            데이터 리포트 저장
          </button>
        </div>
      </div>

      <AiSummary {...props} />
      <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-xl"><ReportContent {...props} /></div>

      {printOpen && <ReportPrintDialog {...props} onClose={() => setPrintOpen(false)} />}
    </section>
  )
}

export default ShipperReport
