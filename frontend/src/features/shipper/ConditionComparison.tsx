import { useMemo, useState } from 'react'
import { useInsight } from '../../lib/useInsight'
import { windowOptions } from './shipperData'
import {
  addMinutesToTime,
  formatDate,
  formatShortCurrency,
  formatWindow,
  getCurrentScenario,
  getNextRelaxedWindow,
  getScenario,
  getSelectedCargo,
  getSelectedLocation,
  getSelectedVehicle,
  minutesToTime,
  timeWindowDuration,
  시나리오_facts,
  유찰퍼센트,
} from './shipperModel'
import type { CallForm, ComparisonOptions, DispatchDecision, ScenarioResult, ShipperModelMetadata } from './shipperTypes'

type ConditionComparisonProps = {
  form: CallForm
  scenarios: ScenarioResult[]
  modelMetadata: ShipperModelMetadata
  options: ComparisonOptions
  onOptionsChange: (options: ComparisonOptions) => void
  onDecision: (decision: Exclude<DispatchDecision, null>) => void
}

type MetricKey = 'drivers' | 'fare' | 'dispatch' | 'failure'

const metricDefinitions: Array<{
  key: MetricKey
  label: string
  icon: string
  value: (scenario: ScenarioResult) => string
  helper: (scenario: ScenarioResult) => string
}> = [
  {
    key: 'drivers',
    label: '예상 수락 가능 차주',
    icon: 'groups',
    value: (scenario) => `${scenario.availableDrivers}명`,
    helper: () => '수락 확률 기준 후보군',
  },
  {
    key: 'fare',
    label: '예상 운임',
    icon: 'payments',
    value: (scenario) => formatShortCurrency(scenario.estimatedFare),
    helper: () => '별도 비용 미합산',
  },
  {
    key: 'dispatch',
    label: '예상 배차시간',
    icon: 'timer',
    // 모델 출력이 37.67 같은 소수라 그대로 쓰면 "37.67분"이 된다. 분 단위 예측에
    // 소수점 두 자리는 없는 정밀도를 있는 것처럼 보이게 한다.
    value: (scenario) => `${Math.round(scenario.dispatchMinutes)}분`,
    helper: () => '콜 등록 후 예상',
  },
  {
    key: 'failure',
    label: '유찰 확률',
    icon: 'warning',
    value: (scenario) => `${유찰퍼센트(scenario.failureProbability)}%`,
    helper: () => '모델 추정 확률',
  },
]

function expectedAcceptanceWindow(scenario: ScenarioResult) {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const lower = Math.max(5, scenario.dispatchMinutes - 15)
  const upper = scenario.dispatchMinutes + 10
  return `${addMinutesToTime(currentMinutes, lower)}~${addMinutesToTime(currentMinutes, upper)}`
}

function MetricCards({ scenario }: { scenario: ScenarioResult }) {
  return (
    <div className="grid grid-cols-4 gap-sm">
      {metricDefinitions.map((metric) => (
        <div key={metric.key} className="relative overflow-hidden rounded-xl border border-outline-variant bg-white p-md">
          <div className="flex items-center justify-between">
            <span className="text-label-sm font-bold text-secondary">{metric.label}</span>
            <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">{metric.icon}</span>
          </div>
          <p className="mt-md text-[27px] font-black tracking-[-0.03em] text-on-surface">{metric.value(scenario)}</p>
          <p className="mt-xs text-label-sm text-secondary">{metric.helper(scenario)}</p>
          <div className="absolute bottom-0 left-0 h-1 bg-primary-container" style={{ width: `${metric.key === 'failure' ? Math.max(8, scenario.failureProbability * 100) : 100}%` }} />
        </div>
      ))}
    </div>
  )
}

function TimeWindowTrack({ form, durationMinutes, label }: { form: CallForm; durationMinutes: number; label: string }) {
  const currentDuration = timeWindowDuration(form.loadingStartMinutes, form.loadingEndMinutes)
  const center = form.loadingStartMinutes + currentDuration / 2
  const start = durationMinutes >= 1440 ? 0 : (center - durationMinutes / 2 + 1440) % 1440
  const end = durationMinutes >= 1440 ? 1440 : (start + durationMinutes) % 1440
  const startPercent = start / 1440 * 100
  const widthPercent = Math.min(100, durationMinutes / 1440 * 100)

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-label-md font-bold text-on-surface">{label}</p>
        <strong className="text-label-md text-primary">{formatWindow(durationMinutes)}</strong>
      </div>
      <div className="relative mt-md h-12 overflow-hidden rounded-xl bg-surface-container-high">
        <div className="absolute inset-y-0 bg-primary-container" style={{ left: `${startPercent}%`, width: `${widthPercent}%` }} />
        {startPercent + widthPercent > 100 && (
          <div className="absolute inset-y-0 left-0 bg-primary-container" style={{ width: `${startPercent + widthPercent - 100}%` }} />
        )}
        {[0, 6, 12, 18, 24].map((hour) => (
          <div key={hour} className="absolute inset-y-0 border-l border-white/80" style={{ left: `${hour / 24 * 100}%` }}>
            <span className="absolute left-1 top-1 text-[10px] font-bold text-secondary">{String(hour).padStart(2, '0')}</span>
          </div>
        ))}
      </div>
      <p className="mt-sm text-body-md font-bold text-on-surface">
        {durationMinutes >= 1440 ? '00:00~24:00' : `${minutesToTime(start)}~${minutesToTime(end)}`}
      </p>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  unavailable,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
  unavailable?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-lg rounded-xl border border-outline-variant bg-white p-md">
      <div>
        <p className="text-label-md font-bold text-on-surface">{label}</p>
        <p className="mt-xs text-label-sm text-secondary">{description}</p>
        {unavailable && <p className="mt-xs text-label-sm font-bold text-error">원본 데이터에 해당 계수가 없어 예측 수치에는 반영하지 않습니다.</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${checked ? 'bg-on-secondary-fixed' : 'bg-surface-container-highest'}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full transition-[left] ${checked ? 'left-7 bg-primary-fixed' : 'left-1 bg-white'}`} />
      </button>
    </div>
  )
}

function DeltaBars({ current, adjusted }: { current: ScenarioResult; adjusted: ScenarioResult }) {
  const changes = [
    {
      label: '차주 변화',
      current: current.availableDrivers,
      adjusted: adjusted.availableDrivers,
      currentText: `${current.availableDrivers}명`,
      adjustedText: `${adjusted.availableDrivers}명`,
      delta: `+${Math.max(0, adjusted.availableDrivers - current.availableDrivers)}명`,
      better: adjusted.availableDrivers >= current.availableDrivers,
    },
    {
      label: '운임 변화',
      current: current.estimatedFare,
      adjusted: adjusted.estimatedFare,
      currentText: formatShortCurrency(current.estimatedFare),
      adjustedText: formatShortCurrency(adjusted.estimatedFare),
      delta: `${adjusted.estimatedFare <= current.estimatedFare ? '-' : '+'}${formatShortCurrency(Math.abs(adjusted.estimatedFare - current.estimatedFare))}`,
      better: adjusted.estimatedFare <= current.estimatedFare,
    },
    {
      label: '배차시간 변화',
      current: current.dispatchMinutes,
      adjusted: adjusted.dispatchMinutes,
      currentText: `${current.dispatchMinutes}분`,
      adjustedText: `${adjusted.dispatchMinutes}분`,
      delta: `${adjusted.dispatchMinutes <= current.dispatchMinutes ? '-' : '+'}${Math.abs(adjusted.dispatchMinutes - current.dispatchMinutes)}분`,
      better: adjusted.dispatchMinutes <= current.dispatchMinutes,
    },
    {
      label: '유찰 확률',
      current: Math.round(current.failureProbability * 100),
      adjusted: Math.round(adjusted.failureProbability * 100),
      currentText: `${Math.round(current.failureProbability * 100)}%`,
      adjustedText: `${Math.round(adjusted.failureProbability * 100)}%`,
      delta: `${adjusted.failureProbability <= current.failureProbability ? '-' : '+'}${Math.abs(Math.round((adjusted.failureProbability - current.failureProbability) * 100))}%p`,
      better: adjusted.failureProbability <= current.failureProbability,
    },
  ]

  return (
    <div className="space-y-md">
      {changes.map((change) => {
        const max = Math.max(change.current, change.adjusted, 1)
        return (
          <div key={change.label} className="grid grid-cols-[130px_minmax(0,1fr)_88px] items-center gap-md">
            <div>
              <p className="text-label-md font-bold text-on-surface">{change.label}</p>
              <p className={`mt-xs text-label-sm font-black ${change.better ? 'text-[#007a5a]' : 'text-secondary'}`}>{change.delta}</p>
            </div>
            <div className="space-y-xs">
              <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
                <div className="h-full rounded-full bg-secondary" style={{ width: `${Math.max(6, change.current / max * 100)}%` }} />
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
                <div className="h-full rounded-full bg-primary-container" style={{ width: `${Math.max(6, change.adjusted / max * 100)}%` }} />
              </div>
            </div>
            <div className="text-right text-label-sm font-bold text-secondary">
              <p>{change.currentText}</p>
              <p className="mt-xs text-on-surface">{change.adjustedText}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DecisionDialog({
  form,
  current,
  scenarios,
  modelMetadata,
  options,
  onOptionsChange,
  onClose,
  onDecision,
}: {
  form: CallForm
  current: ScenarioResult
  scenarios: ScenarioResult[]
  modelMetadata: ShipperModelMetadata
  options: ComparisonOptions
  onOptionsChange: (options: ComparisonOptions) => void
  onClose: () => void
  onDecision: (decision: Exclude<DispatchDecision, null>) => void
}) {
  const adjusted = getScenario(current.tonnage, options.relaxedWindowMinutes, scenarios)
  const noChange = current.windowMinutes === adjusted.windowMinutes

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-xl" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="decision-dialog-title" className="max-h-[92vh] w-full max-w-[1180px] overflow-y-auto rounded-3xl bg-background p-xl shadow-2xl">
        <div className="flex items-start justify-between gap-lg">
          <div>
            <p className="text-label-sm font-black text-primary">데이터 기반 등록 선택</p>
            <h2 id="decision-dialog-title" className="mt-xs text-[30px] font-black tracking-[-0.03em] text-on-surface">이대로 진행할까요, 조정안을 사용할까요?</h2>
            <p className="mt-sm text-body-md text-secondary">현재 조건과 원본 시나리오에서 조회한 완화 조건 두 결과만 비교합니다.</p>
          </div>
          <button type="button" aria-label="알림창 닫기" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high">
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="mt-lg grid grid-cols-[350px_minmax(0,1fr)] gap-lg">
          <div className="space-y-md">
            <div className="rounded-2xl border border-outline-variant bg-white p-lg">
              <p className="text-label-md font-black text-on-surface">상차 시간창 조정</p>
              <p className="mt-xs text-label-sm text-secondary">원본에 있는 시간창 단계만 선택할 수 있습니다.</p>
              <div className="mt-md space-y-sm">
                {windowOptions.filter((window) => window >= current.windowMinutes).map((window) => (
                  <button
                    key={window}
                    type="button"
                    aria-pressed={options.relaxedWindowMinutes === window}
                    onClick={() => onOptionsChange({ ...options, relaxedWindowMinutes: window, allowDateDelay: window === 1440 })}
                    className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-md text-label-md font-bold ${
                      options.relaxedWindowMinutes === window
                        ? 'border-primary bg-[#fff9cc] text-on-surface'
                        : 'border-outline-variant bg-white text-secondary hover:text-on-surface'
                    }`}
                  >
                    <span>{formatWindow(window)}</span>
                    <span>{window === current.windowMinutes ? '현재 조건' : window === 1440 ? '상차일 연기 포함' : '완화 조건'}</span>
                  </button>
                ))}
              </div>
            </div>

            <ToggleRow
              label="차종 대체 허용"
              description="선택 상태는 등록 조건에 기록됩니다."
              checked={options.allowVehicleSubstitution}
              unavailable
              onChange={(allowVehicleSubstitution) => onOptionsChange({ ...options, allowVehicleSubstitution })}
            />
            <ToggleRow
              label="상차일 하루 연기"
              description="24시간 시간창 원본 행과 비교합니다."
              checked={options.allowDateDelay}
              onChange={(allowDateDelay) => onOptionsChange({ ...options, allowDateDelay, relaxedWindowMinutes: allowDateDelay ? 1440 : getNextRelaxedWindow(current.windowMinutes) })}
            />
          </div>

          <div className="space-y-md">
            <div className="grid grid-cols-2 gap-md">
              <div className="rounded-2xl border border-outline-variant bg-white p-lg">
                <p className="text-label-sm font-bold text-secondary">현재 조건 그대로</p>
                <p className="mt-sm text-headline-sm font-black text-on-surface">{formatWindow(current.windowMinutes)} 시간창</p>
                <div className="mt-lg grid grid-cols-3 gap-sm">
                  <div><p className="text-label-sm text-secondary">차주</p><strong className="text-headline-md">{current.availableDrivers}명</strong></div>
                  <div><p className="text-label-sm text-secondary">운임</p><strong className="text-headline-md">{formatShortCurrency(current.estimatedFare)}</strong></div>
                  <div><p className="text-label-sm text-secondary">배차</p><strong className="text-headline-md">{current.dispatchMinutes}분</strong></div>
                </div>
              </div>
              <div className="rounded-2xl border-2 border-primary bg-[#fffdf0] p-lg">
                <p className="text-label-sm font-bold text-primary">조정안</p>
                <p className="mt-sm text-headline-sm font-black text-on-surface">{formatWindow(adjusted.windowMinutes)} 시간창</p>
                <div className="mt-lg grid grid-cols-3 gap-sm">
                  <div><p className="text-label-sm text-secondary">차주</p><strong className="text-headline-md">{adjusted.availableDrivers}명</strong></div>
                  <div><p className="text-label-sm text-secondary">운임</p><strong className="text-headline-md">{formatShortCurrency(adjusted.estimatedFare)}</strong></div>
                  <div><p className="text-label-sm text-secondary">배차</p><strong className="text-headline-md">{adjusted.dispatchMinutes}분</strong></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-white p-lg">
              <h3 className="text-headline-sm font-black text-on-surface">변화가 보이는 비교</h3>
              <div className="mt-lg"><DeltaBars current={current} adjusted={adjusted} /></div>
              <p className="mt-lg rounded-xl bg-surface-container-low p-md text-body-md font-bold leading-6 text-secondary">
                {adjusted.dispatchMinutes > current.dispatchMinutes
                  ? `이 원본 조합에서는 후보와 운임은 개선되지만 예상 배차시간은 ${adjusted.dispatchMinutes - current.dispatchMinutes}분 늘어납니다. 어느 지표를 우선할지 직접 선택하세요.`
                  : `이 원본 조합에서는 예상 배차시간이 ${current.dispatchMinutes - adjusted.dispatchMinutes}분 단축됩니다. 최종 선택은 화주/주선사가 결정합니다.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-md rounded-2xl border border-outline-variant bg-white p-lg">
              <TimeWindowTrack form={form} durationMinutes={current.windowMinutes} label="현재 상차 시간창" />
              <TimeWindowTrack form={form} durationMinutes={adjusted.windowMinutes} label="완화 상차 시간창" />
            </div>

            {noChange && (
              <p className="rounded-xl bg-surface-container-low p-md text-body-md font-bold text-secondary">현재 조건과 같은 원본 행을 선택했습니다. 수치 변화가 없습니다.</p>
            )}
          </div>
        </div>

        <div className="mt-lg flex items-center justify-between gap-lg border-t border-outline-variant pt-lg">
          <p className="max-w-xl text-label-sm text-secondary">
            근거: 톤급×시간창 시나리오 {modelMetadata.scenarioRows}행 · 모델 표본 {modelMetadata.trainingRows.toLocaleString('ko-KR')}행 · 차종 대체는 원본 축 부재로 수치 제외
          </p>
          <div className="grid w-[520px] grid-cols-2 gap-sm">
            <button type="button" onClick={() => onDecision('current')} className="min-h-12 rounded-full border border-outline bg-white px-lg text-label-md font-black text-on-surface hover:bg-surface-container-low">현재 조건대로 진행</button>
            <button type="button" onClick={() => onDecision('adjusted')} className="min-h-12 rounded-full bg-on-secondary-fixed px-lg text-label-md font-black text-primary-fixed hover:bg-[#292927]">조정안으로 등록</button>
          </div>
        </div>
      </section>
    </div>
  )
}

/**
 * Gemini 자연어 설명.
 *
 * 없어도 되는 값이다 — 키 미설정·API 실패·환각 숫자 탐지 시 전부 빈 문자열이
 * 오고, 그러면 이 영역을 통째로 숨긴다. 화면의 다른 부분은 영향받지 않는다.
 *
 * facts 에는 **화면에 이미 떠 있는 값만** 담는다. 차이·합계를 계산해 넣지 마라 —
 * 핸들러가 facts 에 없는 숫자를 응답에서 발견하면 통째로 버리도록 되어 있고,
 * 그 검사가 우리가 넣은 파생값까지 정답으로 인정해 버리면 검증이 헐거워진다.
 *
 * `시나리오_facts` 는 `ShipperReport.tsx` 의 AI 요약도 같이 쓰므로 shipperModel.ts 에 있다.
 */
function InsightNote({ current, adjusted }: { current: ScenarioResult; adjusted: ScenarioResult }) {
  const facts = useMemo(
    () => ({
      현재조건: 시나리오_facts(current),
      조정안: 시나리오_facts(adjusted),
    }),
    [current, adjusted],
  )

  const { text, 로딩중 } = useInsight('SHIPPER', facts)

  if (로딩중) {
    return (
      <div className="mt-md rounded-xl border border-outline-variant bg-surface-container-low p-lg" aria-busy="true">
        <div className="h-3 w-1/3 rounded bg-surface-variant animate-pulse" />
        <div className="mt-sm h-3 w-full rounded bg-surface-variant animate-pulse" />
      </div>
    )
  }

  if (text === '') return null

  return (
    <div className="mt-md rounded-xl border border-primary bg-[#fffdf0] p-lg">
      <div className="flex items-center gap-xs">
        <span className="material-symbols-outlined text-[18px] text-on-primary-container" aria-hidden="true">auto_awesome</span>
        <p className="text-label-sm font-bold text-on-primary-container">AI 설명</p>
      </div>
      <p className="mt-sm whitespace-pre-line text-body-md leading-6 text-on-surface">{text}</p>
      <p className="mt-sm text-label-sm text-secondary">위 수치를 문장으로 옮긴 것입니다. 새로운 값을 계산하지 않습니다.</p>
    </div>
  )
}

function ConditionComparison({ form, scenarios, modelMetadata, options, onOptionsChange, onDecision }: ConditionComparisonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const current = getCurrentScenario(form, scenarios)
  const selectedDuration = timeWindowDuration(form.loadingStartMinutes, form.loadingEndMinutes)
  const exactWindowMatch = windowOptions.includes(selectedDuration as ScenarioResult['windowMinutes'])
  const adjusted = getScenario(current.tonnage, options.relaxedWindowMinutes, scenarios)
  const route = `${getSelectedLocation(form.originRegion, form.originDetail, form.originCustom) || '미선택'} → ${getSelectedLocation(form.destinationRegion, form.destinationDetail, form.destinationCustom) || '미선택'}`
  const interpretation = useMemo(() => {
    const preference = current.failureProbability >= 0.3 ? '현재 시간창은 유찰 위험이 높은 편입니다.' : '현재 시간창은 유찰 위험이 비교적 낮습니다.'
    return `${current.tonnage}톤급·${formatWindow(current.windowMinutes)} 원본 조합을 연결했습니다. ${preference}`
  }, [current])

  return (
    <section className="space-y-lg" aria-labelledby="compare-title">
      <div className="rounded-2xl border border-outline-variant bg-white p-xl">
        <div className="flex items-start justify-between gap-xl">
          <div>
            <h1 id="compare-title" className="text-[32px] font-black leading-tight tracking-[-0.03em] text-on-surface">조건 비교</h1>
            <p className="mt-sm text-body-lg text-secondary">입력한 운송 조건을 원본 시나리오와 연결해 예상 결과를 보여줍니다.</p>
          </div>
          <div className="rounded-xl bg-on-secondary-fixed px-lg py-md text-right">
            <p className="text-label-sm text-secondary-fixed-dim">예상 첫 수락</p>
            <p className="mt-xs text-headline-sm font-black text-primary-fixed">{expectedAcceptanceWindow(current)}</p>
          </div>
        </div>

        <div className="mt-lg grid grid-cols-4 gap-sm rounded-xl bg-surface-container-low p-md">
          {[
            ['노선', route],
            ['차량', getSelectedVehicle(form) || '미선택'],
            ['품목', getSelectedCargo(form) || '미선택'],
            ['상차', `${formatDate(form.loadingDate)} · ${minutesToTime(form.loadingStartMinutes)}~${minutesToTime(form.loadingEndMinutes)}`],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-label-sm text-secondary">{label}</p>
              <p className="mt-xs text-body-md font-bold text-on-surface">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-white p-xl">
        <div className="flex items-end justify-between gap-lg">
          <div>
            <h2 className="text-headline-sm font-black text-on-surface">현재 조건 예상 결과</h2>
            <p className="mt-xs text-body-md text-secondary">핵심 숫자를 먼저 보고, 아래에서 시간창과 근거를 확인하세요.</p>
          </div>
        </div>
        <div className="mt-lg"><MetricCards scenario={current} /></div>

        <div className="mt-md grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-md">
          <div className="rounded-xl bg-surface-container-low p-lg">
            <TimeWindowTrack form={form} durationMinutes={current.windowMinutes} label="상차 시간창" />
          </div>
          <div className="rounded-xl bg-on-secondary-fixed p-lg text-secondary-fixed">
            <p className="text-label-sm text-secondary-fixed-dim">기본 조건 해석</p>
            <p className="mt-sm text-body-md font-bold leading-6 text-secondary-fixed">{interpretation}</p>
            <p className="mt-md border-t border-[#444] pt-md text-label-sm leading-5 text-secondary-fixed-dim">
              선택한 조건은 연결된 원본의 참조 범위 밖이라 데모 산식으로 표시했습니다. (원본 참조 범위 밖 · 원(KRW) 정수 · 별도 비용 미합산)
            </p>
          </div>
        </div>

        <InsightNote current={current} adjusted={adjusted} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-lg">
        <div className="rounded-2xl border border-outline-variant bg-white p-xl">
          <h2 className="text-headline-sm font-black text-on-surface">현재 선택한 조건과 데이터 연결</h2>
          <dl className="mt-lg grid grid-cols-3 gap-x-lg gap-y-md">
            {[
              ['출발지', getSelectedLocation(form.originRegion, form.originDetail, form.originCustom) || '미선택'],
              ['도착지', getSelectedLocation(form.destinationRegion, form.destinationDetail, form.destinationCustom) || '미선택'],
              ['차량', getSelectedVehicle(form) || '미선택'],
              ['품목', getSelectedCargo(form) || '미선택'],
              ['상차 날짜', formatDate(form.loadingDate)],
              ['상차 시간', `${minutesToTime(form.loadingStartMinutes)}~${minutesToTime(form.loadingEndMinutes)}`],
              ['별도 톨비', '원본 데이터 없음'],
              ['운임 범위', '원본 데이터 없음'],
              ['원본 표본', `${current.tonnage}t × ${current.windowMinutes}분 · 학습 ${modelMetadata.trainingRows.toLocaleString('ko-KR')}행`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-label-sm text-secondary">{label}</dt>
                <dd className="mt-xs text-body-md font-bold text-on-surface">{value}</dd>
              </div>
            ))}
          </dl>
          {!exactWindowMatch && (
            <p className="mt-lg rounded-xl bg-[#fff9cc] p-md text-body-md font-bold text-on-surface">
              선택한 {formatWindow(selectedDuration)} 시간창은 원본 조합에 없어 가장 가까운 {formatWindow(current.windowMinutes)} 행을 사용했습니다.
            </p>
          )}
        </div>

        <div className="space-y-md">
          <ToggleRow
            label="차종 대체 허용"
            description="등록 조건에는 저장되지만 현재 모델에는 별도 축이 없습니다."
            checked={options.allowVehicleSubstitution}
            unavailable
            onChange={(allowVehicleSubstitution) => onOptionsChange({ ...options, allowVehicleSubstitution })}
          />
          <ToggleRow
            label="상차일 하루 연기"
            description="24시간 시간창 조합을 조정안으로 사용합니다."
            checked={options.allowDateDelay}
            onChange={(allowDateDelay) => onOptionsChange({ ...options, allowDateDelay, relaxedWindowMinutes: allowDateDelay ? 1440 : getNextRelaxedWindow(current.windowMinutes) })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-lg rounded-2xl bg-on-secondary-fixed p-lg text-secondary-fixed">
        <div>
          <p className="text-label-md font-black text-primary-fixed">현재 조건과 완화 조건만 비교합니다.</p>
          <p className="mt-xs text-body-md text-secondary-fixed-dim">현재 {formatWindow(current.windowMinutes)} → 조정안 {formatWindow(adjusted.windowMinutes)} · 임의 보간 없이 원본 행 조회</p>
        </div>
        <button type="button" onClick={() => setDialogOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-sm rounded-full bg-primary-container px-xl text-label-md font-black text-on-primary-fixed hover:bg-primary-fixed">
          진행 조건 선택하기
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">compare_arrows</span>
        </button>
      </div>

      {dialogOpen && (
        <DecisionDialog
          form={form}
          current={current}
          scenarios={scenarios}
          modelMetadata={modelMetadata}
          options={options}
          onOptionsChange={onOptionsChange}
          onClose={() => setDialogOpen(false)}
          onDecision={(decision) => {
            setDialogOpen(false)
            onDecision(decision)
          }}
        />
      )}
    </section>
  )
}

export default ConditionComparison
