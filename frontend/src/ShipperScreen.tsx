import { useState } from 'react'
import CallRegistration from './features/shipper/CallRegistration'
import ConditionComparison from './features/shipper/ConditionComparison'
import PreferenceSetup from './features/shipper/PreferenceSetup'
import ShipperProfile from './features/shipper/ShipperProfile'
import ShipperReport from './features/shipper/ShipperReport'
import { useShipperScenarios } from './features/shipper/useShipperScenarios'
import {
  addDaysToDate,
  adjustedWindowLabel,
  callFieldCompletion,
  formatDate,
  getCurrentScenario,
  getNextRelaxedWindow,
  getSelectedCargo,
  getSelectedLocation,
  getSelectedVehicle,
  minutesToTime,
} from './features/shipper/shipperModel'
import {
  preferenceGroups,
  type PreferenceGroupId,
  type PreferenceSelections,
} from './features/shipper/shipperPreferences'
import {
  emptyCallForm,
  type CallForm,
  type ComparisonOptions,
  type DispatchDecision,
  type ShipperTabId,
} from './features/shipper/shipperTypes'

type ShipperTab = {
  id: ShipperTabId
  label: string
  icon: string
}

const shipperTabs: ShipperTab[] = [
  { id: 'settings', label: '필수 설정', icon: 'tune' },
  { id: 'register', label: '콜 등록', icon: 'add_box' },
  { id: 'compare', label: '조건 비교', icon: 'compare_arrows' },
  { id: 'report', label: '월간 리포트', icon: 'assessment' },
  { id: 'profile', label: '내 정보', icon: 'person' },
]

const initialSelections: PreferenceSelections = {
  priority: [],
  schedule: [],
}

const initialComparisonOptions: ComparisonOptions = {
  allowVehicleSubstitution: false,
  allowDateDelay: false,
  relaxedWindowMinutes: 240,
}

function SelectionValue({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="font-bold text-secondary">미선택</span>
  return <span className="font-bold text-on-surface">{values.join(' · ')}</span>
}

function DecisionSummary({
  selections,
  answeredCount,
  form,
  decision,
  options,
}: {
  selections: PreferenceSelections
  answeredCount: number
  form: CallForm
  decision: DispatchDecision
  options: ComparisonOptions
}) {
  const adjusted = decision === 'adjusted'
  const effectiveDate = adjusted && options.allowDateDelay ? addDaysToDate(form.loadingDate, 1) : form.loadingDate
  const effectiveTime = adjusted
    ? adjustedWindowLabel(form, options.relaxedWindowMinutes)
    : `${minutesToTime(form.loadingStartMinutes)}~${minutesToTime(form.loadingEndMinutes)}`
  const route = [
    getSelectedLocation(form.originRegion, form.originDetail, form.originCustom),
    getSelectedLocation(form.destinationRegion, form.destinationDetail, form.destinationCustom),
  ]
  const callItems = [
    ['노선', route.every(Boolean) ? route.join(' → ') : '미선택'],
    ['차량', getSelectedVehicle(form) || '미선택'],
    ['품목', getSelectedCargo(form) || '미선택'],
    ['상차', effectiveDate ? `${formatDate(effectiveDate)} ${effectiveTime}${adjusted ? ' · 조정안' : ''}` : '미선택'],
  ]

  return (
    <aside className="sticky top-[88px] h-fit rounded-2xl border border-outline-variant bg-white p-lg shadow-[0_2px_8px_rgba(26,28,28,0.04)]">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h2 className="text-headline-sm font-black text-on-surface">실시간 결정 요약</h2>
          <p className="mt-xs text-body-md text-secondary">선택 즉시 반영됩니다.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-fixed">
          <span className="material-symbols-outlined" aria-hidden="true">bolt</span>
        </div>
      </div>

      <div className="my-lg h-px bg-outline-variant" />

      <div className="space-y-md">
        {preferenceGroups.map((group) => (
          <div key={group.id} className="flex gap-md">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-sm font-black ${
              selections[group.id].length > 0
                ? 'bg-primary-container text-on-primary-fixed'
                : 'bg-surface-container text-secondary'
            }`}>
              {group.number}
            </div>
            <div className="min-w-0">
              <p className="text-label-sm text-secondary">{group.title}</p>
              <p className="mt-xs break-words text-body-md"><SelectionValue values={selections[group.id]} /></p>
            </div>
          </div>
        ))}
      </div>

      <div className="my-lg h-px bg-outline-variant" />

      <div className="space-y-md">
        <p className="text-label-sm font-black text-on-surface">현재 콜</p>
        {callItems.map(([label, value]) => (
          <div key={label}>
            <p className="text-label-sm text-secondary">{label}</p>
            <p className={`mt-xs text-body-md font-bold ${value === '미선택' ? 'text-secondary' : 'text-on-surface'}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-lg rounded-xl bg-surface-container-low p-md">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-secondary">필수 설정</span>
          <strong className="text-label-md text-on-surface">{answeredCount}/{preferenceGroups.length}</strong>
        </div>
        <div className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full rounded-full bg-primary-container transition-[width] duration-300" style={{ width: `${Math.round((answeredCount / preferenceGroups.length) * 100)}%` }} />
        </div>
      </div>

      <div className="mt-md flex items-center justify-between rounded-xl bg-on-secondary-fixed p-md">
        <span className="text-label-sm text-secondary-fixed-dim">최근 선택</span>
        <strong className="text-label-sm text-primary-fixed">
          {decision === 'adjusted' ? '조정안 등록' : decision === 'current' ? '현재 조건 유지' : '미선택'}
        </strong>
      </div>
    </aside>
  )
}

function CurrentDispatch({ activeTab, form, decision, options }: { activeTab: ShipperTabId; form: CallForm; decision: DispatchDecision; options: ComparisonOptions }) {
  const completion = callFieldCompletion(form)
  const adjusted = decision === 'adjusted'
  const effectiveDate = adjusted && options.allowDateDelay ? addDaysToDate(form.loadingDate, 1) : form.loadingDate
  const effectiveTime = adjusted
    ? adjustedWindowLabel(form, options.relaxedWindowMinutes)
    : `${minutesToTime(form.loadingStartMinutes)}~${minutesToTime(form.loadingEndMinutes)}`
  const statusByTab: Record<ShipperTabId, string> = {
    settings: '필수 설정 중',
    register: completion === 6 ? '조건 비교 가능' : `콜 정보 ${completion}/6`,
    compare: decision ? '진행 조건 선택 완료' : '조정안 검토 전',
    report: decision ? '운송인 응답 대기' : '등록 결과 대기',
    profile: '기본정보 확인 중',
  }
  const fields = [
    ['배차번호', decision ? 'MVN-260813-042' : '미발급'],
    ['출발지', getSelectedLocation(form.originRegion, form.originDetail, form.originCustom) || '미선택'],
    ['도착지', getSelectedLocation(form.destinationRegion, form.destinationDetail, form.destinationCustom) || '미선택'],
    ['차량', getSelectedVehicle(form) || '미선택'],
    ['품목', getSelectedCargo(form) || '미선택'],
    ['상차 날짜', effectiveDate ? `${formatDate(effectiveDate)}${adjusted && options.allowDateDelay ? ' · 하루 연기' : ''}` : '미선택'],
    ['상차 시간', effectiveDate ? effectiveTime : '미선택'],
  ]

  return (
    <section aria-labelledby="current-dispatch-title" className="rounded-2xl border border-outline-variant bg-white p-xl shadow-[0_2px_8px_rgba(26,28,28,0.04)]">
      <div className="flex items-center justify-between gap-lg border-b border-outline-variant pb-md">
        <div>
          <h2 id="current-dispatch-title" className="text-headline-sm font-black text-on-surface">현재 배차 정보</h2>
          <p className="mt-xs text-body-md text-secondary">모든 화주/주선사 탭에서 동일하게 표시됩니다.</p>
        </div>
        <span className="inline-flex items-center gap-xs rounded-full bg-surface-container px-md py-sm text-label-sm font-bold text-on-surface">
          <span className="h-2 w-2 rounded-full bg-primary-container" />
          {statusByTab[activeTab]}
        </span>
      </div>

      <dl className="mt-lg grid grid-cols-4 gap-x-lg gap-y-md">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-label-sm text-secondary">{label}</dt>
            <dd className={`mt-xs text-body-md font-black ${value.includes('미') ? 'text-secondary' : 'text-on-surface'}`}>{value}</dd>
          </div>
        ))}
        <div>
          <dt className="text-label-sm text-secondary">현재 상태</dt>
          <dd className="mt-xs text-body-md font-black text-on-surface">{statusByTab[activeTab]}</dd>
        </div>
      </dl>
    </section>
  )
}

function ShipperScreen() {
  const [activeTab, setActiveTab] = useState<ShipperTabId>('settings')
  const [selections, setSelections] = useState<PreferenceSelections>(initialSelections)
  const [preferencesSaved, setPreferencesSaved] = useState(false)
  const [callForm, setCallForm] = useState<CallForm>(emptyCallForm)
  const [comparisonOptions, setComparisonOptions] = useState<ComparisonOptions>(initialComparisonOptions)
  const [decision, setDecision] = useState<DispatchDecision>(null)
  const { scenarios, modelMetadata, 상태: 시나리오상태 } = useShipperScenarios()

  const answeredCount = preferenceGroups.filter((group) => selections[group.id].length > 0).length
  const registrationCompletion = callFieldCompletion(callForm)
  const activeTabIndex = shipperTabs.findIndex((tab) => tab.id === activeTab)

  const togglePreference = (groupId: PreferenceGroupId, option: string) => {
    setPreferencesSaved(false)
    setSelections((currentSelections) => {
      const group = preferenceGroups.find((currentGroupOption) => currentGroupOption.id === groupId)!
      const currentGroup = currentSelections[groupId]
      const exists = currentGroup.includes(option)
      if (exists) {
        return { ...currentSelections, [groupId]: currentGroup.filter((currentOption) => currentOption !== option) }
      }
      if (group.maxSelect === 1) {
        return { ...currentSelections, [groupId]: [option] }
      }
      if (currentGroup.length >= group.maxSelect) return currentSelections
      return { ...currentSelections, [groupId]: [...currentGroup, option] }
    })
  }

  const savePreferences = () => {
    if (answeredCount !== preferenceGroups.length) return
    setPreferencesSaved(true)
    setActiveTab('register')
  }

  const continueToComparison = () => {
    if (registrationCompletion !== 6) return
    const currentScenario = getCurrentScenario(callForm, scenarios)
    setComparisonOptions((current) => ({ ...current, allowDateDelay: false, relaxedWindowMinutes: getNextRelaxedWindow(currentScenario.windowMinutes) }))
    setDecision(null)
    setActiveTab('compare')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const chooseDecision = (nextDecision: Exclude<DispatchDecision, null>) => {
    setDecision(nextDecision)
    setActiveTab('report')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const returnToMain = () => {
    setActiveTab('settings')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="shipper-app min-h-screen min-w-[1400px] bg-background text-on-surface">
      <nav className="fixed top-0 z-50 flex h-16 w-full min-w-[1400px] items-center justify-between border-b border-outline-variant bg-surface px-8" aria-label="역할 선택">
        <div className="flex items-center">
          <span className="mr-xl text-headline-md font-black tracking-[-0.04em] text-on-surface">Mov!n</span>
          <div className="flex gap-lg">
            <a className="border-b-2 border-primary py-2 text-label-md font-bold text-primary" href="/shipper">화주/주선사</a>
            <a className="py-2 text-label-md text-secondary transition-colors hover:text-on-surface" href="/carrier">운송인</a>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            aria-label="내 정보"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-on-surface" aria-hidden="true">person</span>
          </button>
          <div className="flex h-9 items-center justify-center rounded-full bg-on-secondary-fixed px-md text-label-sm font-black text-primary-fixed" aria-label="화주/주선사 프로필">화주/주선사</div>
        </div>
      </nav>

      <div className="flex min-h-screen pt-16">
        <main className="min-w-0 flex-1 p-6">
          <div className="mb-lg flex items-center gap-sm text-label-sm text-secondary">
            <span>화주/주선사 업무</span>
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chevron_right</span>
            <strong className="text-on-surface">{shipperTabs[activeTabIndex].label}</strong>
            {시나리오상태 === 'loading' && (
              <span className="animate-pulse text-label-sm text-secondary" role="status">
                최신 시나리오 불러오는 중…
              </span>
            )}
            <span className="ml-auto font-bold text-on-surface">{activeTabIndex + 1}/5 단계</span>
          </div>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_288px] items-start gap-lg">
            <div key={activeTab} className="min-w-0 animate-[mv-panel-in_200ms_ease-out] motion-reduce:animate-none">
              {activeTab === 'settings' && (
                <PreferenceSetup selections={selections} answeredCount={answeredCount} onToggle={togglePreference} onSave={savePreferences} />
              )}
              {activeTab === 'register' && (
                <CallRegistration
                  form={callForm}
                  modelMetadata={modelMetadata}
                  preferencesSaved={preferencesSaved}
                  onChange={(next) => {
                    setCallForm(next)
                    setDecision(null)
                  }}
                  onContinue={continueToComparison}
                />
              )}
              {activeTab === 'compare' && (
                <ConditionComparison form={callForm} scenarios={scenarios} modelMetadata={modelMetadata} options={comparisonOptions} onOptionsChange={setComparisonOptions} onDecision={chooseDecision} />
              )}
              {activeTab === 'report' && <ShipperReport form={callForm} scenarios={scenarios} modelMetadata={modelMetadata} options={comparisonOptions} decision={decision} />}
              {activeTab === 'profile' && (
                <ShipperProfile
                  selections={selections}
                  form={callForm}
                  modelMetadata={modelMetadata}
                  decision={decision}
                  onBackToMain={returnToMain}
                  onEditPreferences={() => setActiveTab('settings')}
                />
              )}
            </div>
            <DecisionSummary selections={selections} answeredCount={answeredCount} form={callForm} decision={decision} options={comparisonOptions} />
          </div>

          <div className="mt-lg"><CurrentDispatch activeTab={activeTab} form={callForm} decision={decision} options={comparisonOptions} /></div>
        </main>
      </div>
    </div>
  )
}

export default ShipperScreen
