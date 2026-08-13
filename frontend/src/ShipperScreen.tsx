import { useState } from 'react'
import PreferenceSetup from './features/shipper/PreferenceSetup'
import {
  preferenceGroups,
  type PreferenceGroupId,
  type PreferenceSelections,
} from './features/shipper/shipperPreferences'

type TabId = 'settings' | 'register' | 'compare' | 'report' | 'profile'

type ShipperTab = {
  id: TabId
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
  dispatch: [],
  schedule: [],
  carrier: [],
}

const dispatchFields = [
  ['배차번호', '미입력'],
  ['출발지', '미입력'],
  ['도착지', '미입력'],
  ['차량', '미선택'],
  ['품목', '미입력'],
  ['상차 날짜', '미선택'],
  ['상차 시간', '미선택'],
] as const

function SelectionValue({ values }: { values: string[] }) {
  if (values.length === 0) {
    return <span className="font-bold text-secondary">미선택</span>
  }

  return <span className="font-bold text-on-surface">{values.join(' · ')}</span>
}

function DecisionSummary({
  selections,
  answeredCount,
}: {
  selections: PreferenceSelections
  answeredCount: number
}) {
  return (
    <aside className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(26,28,28,0.04)] xl:sticky xl:top-[88px] xl:h-fit">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h2 className="text-headline-sm font-bold text-on-surface">실시간 결정 요약</h2>
          <p className="mt-xs text-body-md text-secondary">선택 즉시 반영됩니다.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-fixed">
          <span className="material-symbols-outlined" aria-hidden="true">bolt</span>
        </div>
      </div>

      <div className="my-lg h-px bg-outline-variant" />

      <div className="space-y-lg">
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
              <p className="mt-xs break-words text-body-md">
                <SelectionValue values={selections[group.id]} />
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-xl rounded-xl bg-surface-container-low p-md">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-secondary">필수 설정</span>
          <strong className="text-label-md text-on-surface">{answeredCount}/3</strong>
        </div>
        <div className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container-high">
          <div
            className="h-full rounded-full bg-primary-container transition-[width] duration-300"
            style={{ width: `${Math.round((answeredCount / 3) * 100)}%` }}
          />
        </div>
      </div>
    </aside>
  )
}

function CurrentDispatch({ activeTab }: { activeTab: TabId }) {
  const statusByTab: Record<TabId, string> = {
    settings: '필수 설정 중',
    register: '콜 등록 전',
    compare: '조정안 미선택',
    report: '배차 완료 후 제공',
    profile: '기본정보 확인 중',
  }

  return (
    <section aria-labelledby="current-dispatch-title" className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(26,28,28,0.04)] md:p-xl">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="current-dispatch-title" className="text-headline-sm font-bold text-on-surface">현재 배차 정보</h2>
          <p className="mt-xs text-body-md text-secondary">모든 화주 탭에서 동일하게 표시됩니다.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-xs rounded-full bg-surface-container px-md py-sm text-label-sm font-bold text-on-surface">
          <span className="h-2 w-2 rounded-full bg-primary-container" />
          {statusByTab[activeTab]}
        </span>
      </div>

      <dl className="mt-lg grid grid-cols-2 gap-x-lg gap-y-md lg:grid-cols-4">
        {dispatchFields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-label-sm text-secondary">{label}</dt>
            <dd className="mt-xs text-body-md font-bold text-on-surface">{value}</dd>
          </div>
        ))}
        <div>
          <dt className="text-label-sm text-secondary">현재 상태</dt>
          <dd className="mt-xs text-body-md font-bold text-on-surface">{statusByTab[activeTab]}</dd>
        </div>
      </dl>
    </section>
  )
}

function RegisterCallScaffold({ saved }: { saved: boolean }) {
  const sections = [
    ['기본 운송 정보', '출발지·도착지·차량·품목'],
    ['상차 일정', '상차 날짜·시간·조정 가능 범위'],
    ['요청 내용', '운송 시 전달할 참고사항'],
  ]

  return (
    <section className="space-y-lg" aria-labelledby="register-call-title">
      {saved && (
        <div className="flex items-start gap-md rounded-xl border border-primary bg-[#fff9cc] p-md text-on-surface">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">check_circle</span>
          <div>
            <p className="text-label-md font-bold">선호 조건 설정이 완료되었습니다.</p>
            <p className="mt-xs text-body-md text-secondary">저장한 조건은 내 정보에서 다시 수정할 수 있어요.</p>
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl">
        <h1 id="register-call-title" className="text-[28px] font-black leading-tight tracking-[-0.03em] text-on-surface md:text-[32px]">화물 정보 등록</h1>
        <p className="mt-sm max-w-2xl text-body-lg text-secondary">배차에 필요한 운송 정보를 입력하는 화면 골격입니다.</p>
        <div className="mt-xl grid gap-md md:grid-cols-3">
          {sections.map(([title, description], index) => (
            <div key={title} className="min-h-40 rounded-xl border border-outline-variant bg-surface-container-low p-lg">
              <div className="flex items-center justify-between">
                <span className="text-label-sm font-bold text-primary">0{index + 1}</span>
                <span className="text-label-sm text-secondary">작성 전</span>
              </div>
              <h2 className="mt-lg text-headline-sm font-bold text-on-surface">{title}</h2>
              <p className="mt-sm text-body-md text-secondary">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CompareScaffold() {
  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl" aria-labelledby="compare-title">
      <h1 id="compare-title" className="text-[28px] font-black leading-tight tracking-[-0.03em] text-on-surface md:text-[32px]">AI 화물 조정안 제안</h1>
      <p className="mt-sm max-w-2xl text-body-lg text-secondary">현재 조건과 일정 조정안을 나란히 비교하는 화면 골격입니다.</p>
      <div className="mt-xl grid gap-md md:grid-cols-2">
        {[
          ['현재 조건', '입력한 운송 조건을 그대로 유지'],
          ['조정안', '후보·운임·배차시간 변화 비교'],
        ].map(([title, description], index) => (
          <div key={title} className={`min-h-64 rounded-2xl border p-lg ${index === 1 ? 'border-primary bg-[#fffdf0]' : 'border-outline-variant bg-surface-container-low'}`}>
            <h2 className="text-headline-sm font-bold text-on-surface">{title}</h2>
            <p className="mt-sm text-body-md text-secondary">{description}</p>
            <div className="mt-xl grid grid-cols-3 gap-sm">
              {['후보', '예상 운임', '배차시간'].map((label) => (
                <div key={label}>
                  <p className="text-label-sm text-secondary">{label}</p>
                  <p className="mt-sm text-body-md font-bold text-on-surface">미산정</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReportScaffold() {
  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl" aria-labelledby="report-title">
      <h1 id="report-title" className="text-[28px] font-black leading-tight tracking-[-0.03em] text-on-surface md:text-[32px]">운임 절감·탄소배출 리포트</h1>
      <p className="mt-sm max-w-2xl text-body-lg text-secondary">배차 이력이 쌓이면 월간 성과와 변화 원인을 확인할 수 있습니다.</p>
      <div className="mt-xl grid gap-md sm:grid-cols-2">
        {[
          ['운임 절감', '월간 절감액과 주요 개선 요인'],
          ['탄소배출 감축', '공차거리 감소에 따른 감축 추정'],
        ].map(([title, description]) => (
          <div key={title} className="rounded-xl bg-surface-container-low p-lg">
            <p className="text-label-md font-bold text-on-surface">{title}</p>
            <p className="mt-xs text-body-md text-secondary">{description}</p>
            <p className="mt-xl text-headline-md font-black text-on-surface">데이터 없음</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProfileScaffold({
  selections,
  onEditPreferences,
}: {
  selections: PreferenceSelections
  onEditPreferences: () => void
}) {
  return (
    <section className="space-y-lg" aria-labelledby="profile-title">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl">
        <h1 id="profile-title" className="text-[28px] font-black leading-tight tracking-[-0.03em] text-on-surface md:text-[32px]">화주 기본정보</h1>
        <p className="mt-sm text-body-lg text-secondary">회사와 담당자 정보를 관리하는 화면 골격입니다.</p>
        <div className="mt-xl grid gap-md sm:grid-cols-2">
          {['회사 정보', '담당자 정보'].map((title) => (
            <div key={title} className="rounded-xl bg-surface-container-low p-lg">
              <p className="text-label-md font-bold text-on-surface">{title}</p>
              <p className="mt-md text-body-md text-secondary">입력된 정보가 없습니다.</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl">
        <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-headline-sm font-bold text-on-surface">화주 선호 조건</h2>
            <p className="mt-xs text-body-md text-secondary">필수 설정에서 선택한 기준입니다.</p>
          </div>
          <button type="button" onClick={onEditPreferences} className="inline-flex min-h-11 items-center justify-center gap-sm rounded-full border border-outline px-lg text-label-md font-bold text-on-surface transition-colors hover:bg-surface-container-low">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
            선호 조건 수정
          </button>
        </div>
        <div className="mt-lg grid gap-md md:grid-cols-3">
          {preferenceGroups.map((group) => (
            <div key={group.id} className="rounded-xl bg-surface-container-low p-md">
              <p className="text-label-sm text-secondary">{group.title}</p>
              <p className="mt-sm text-body-md"><SelectionValue values={selections[group.id]} /></p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ShipperScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('settings')
  const [selections, setSelections] = useState<PreferenceSelections>(initialSelections)
  const [preferencesSaved, setPreferencesSaved] = useState(false)

  const answeredCount = preferenceGroups.filter((group) => selections[group.id].length > 0).length

  const setupProgress = preferencesSaved ? 100 : Math.round((answeredCount / preferenceGroups.length) * 100)
  const activeTabIndex = shipperTabs.findIndex((tab) => tab.id === activeTab)

  const togglePreference = (groupId: PreferenceGroupId, option: string) => {
    setPreferencesSaved(false)
    setSelections((currentSelections) => {
      const currentGroup = currentSelections[groupId]
      const exists = currentGroup.includes(option)

      if (!exists && currentGroup.length >= 2) {
        return currentSelections
      }

      return {
        ...currentSelections,
        [groupId]: exists
          ? currentGroup.filter((currentOption) => currentOption !== option)
          : [...currentGroup, option],
      }
    })
  }

  const savePreferences = () => {
    if (answeredCount !== preferenceGroups.length) return
    setPreferencesSaved(true)
    setActiveTab('register')
  }

  const tabProgress = (tabId: TabId) => {
    if (tabId === 'settings') return setupProgress
    return 0
  }

  return (
    <div className="shipper-app min-h-screen bg-background text-on-surface">
      <nav className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop" aria-label="역할 선택">
        <div className="flex items-center">
          <span className="mr-xl text-headline-md font-black tracking-[-0.04em] text-on-surface">Mov!n</span>
          <div className="flex gap-lg">
            <a className="border-b-2 border-primary py-2 text-label-md font-bold text-primary" href="/shipper">화주</a>
            <a className="py-2 text-label-md text-secondary transition-colors hover:text-on-surface" href="/carrier">운송인</a>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button type="button" aria-label="알림" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container">
            <span className="material-symbols-outlined text-on-surface" aria-hidden="true">notifications</span>
          </button>
          <button type="button" aria-label="설정" className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container sm:flex">
            <span className="material-symbols-outlined text-on-surface" aria-hidden="true">settings</span>
          </button>
          <div className="ml-xs flex h-9 w-9 items-center justify-center rounded-full bg-on-secondary-fixed text-label-sm font-black text-primary-fixed" aria-label="화주 프로필">화주</div>
        </div>
      </nav>

      <div className="flex min-h-screen pt-16">
        <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-64px)] w-[264px] flex-col bg-on-secondary-fixed py-lg shadow-sm lg:flex">
          <div className="px-lg pb-lg">
            <h2 className="text-headline-sm font-bold text-primary-fixed">화주 업무</h2>
            <p className="mt-xs text-label-sm text-secondary-fixed-dim">발주부터 리포트까지 5단계</p>
          </div>
          <nav className="flex-1" aria-label="화주 업무 탭">
            {shipperTabs.map((tab, index) => {
              const isActive = tab.id === activeTab
              const progress = tabProgress(tab.id)
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full border-l-4 px-lg py-md text-left transition-colors ${
                    isActive
                      ? 'border-primary-fixed bg-on-secondary-fixed-variant text-primary-fixed'
                      : 'border-transparent text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant hover:text-secondary-fixed'
                  }`}
                >
                  <span className="flex items-center gap-md">
                    <span className="material-symbols-outlined" aria-hidden="true">{tab.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-sm">
                        <span className="text-label-md font-bold">{tab.label}</span>
                        <span className="text-label-sm">{index + 1}/5</span>
                      </span>
                      <span className="mt-sm block h-1 overflow-hidden rounded-full bg-[#5d5d5b]">
                        <span className="block h-full rounded-full bg-primary-fixed transition-[width]" style={{ width: `${progress}%` }} />
                      </span>
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>
          <div className="mx-lg rounded-xl bg-[#252525] p-md">
            <p className="text-label-sm text-secondary-fixed-dim">현재 단계</p>
            <p className="mt-xs text-label-md font-bold text-secondary-fixed">{shipperTabs[activeTabIndex].label}</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-margin-mobile lg:ml-[264px] lg:p-margin-desktop">
          <nav className="-mx-margin-mobile mb-lg flex gap-sm overflow-x-auto border-b border-outline-variant px-margin-mobile pb-md lg:hidden" aria-label="모바일 화주 업무 탭">
            {shipperTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-full px-md py-sm text-label-md font-bold ${
                  activeTab === tab.id
                    ? 'bg-on-secondary-fixed text-primary-fixed'
                    : 'bg-surface-container text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mb-lg flex items-center gap-sm text-label-sm text-secondary">
            <span>화주 업무</span>
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chevron_right</span>
            <strong className="text-on-surface">{shipperTabs[activeTabIndex].label}</strong>
            <span className="ml-auto font-bold text-on-surface">{activeTabIndex + 1}/5 단계</span>
          </div>

          <div className="grid min-w-0 gap-lg xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div className="min-w-0">
              {activeTab === 'settings' && (
                <PreferenceSetup
                  selections={selections}
                  answeredCount={answeredCount}
                  onToggle={togglePreference}
                  onSave={savePreferences}
                />
              )}
              {activeTab === 'register' && <RegisterCallScaffold saved={preferencesSaved} />}
              {activeTab === 'compare' && <CompareScaffold />}
              {activeTab === 'report' && <ReportScaffold />}
              {activeTab === 'profile' && (
                <ProfileScaffold selections={selections} onEditPreferences={() => setActiveTab('settings')} />
              )}
            </div>
            <DecisionSummary selections={selections} answeredCount={answeredCount} />
          </div>

          <div className="mt-lg">
            <CurrentDispatch activeTab={activeTab} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default ShipperScreen
