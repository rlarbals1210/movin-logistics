import {
  preferenceGroups,
  type PreferenceGroupId,
  type PreferenceSelections,
} from './shipperPreferences'

type PreferenceSetupProps = {
  selections: PreferenceSelections
  answeredCount: number
  onToggle: (groupId: PreferenceGroupId, option: string) => void
  onSave: () => void
}

function PreferenceSetup({
  selections,
  answeredCount,
  onToggle,
  onSave,
}: PreferenceSetupProps) {
  const progress = Math.round((answeredCount / preferenceGroups.length) * 100)
  const canSave = answeredCount === preferenceGroups.length

  return (
    <section aria-labelledby="preference-setup-title" className="space-y-lg">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(26,28,28,0.04)] md:p-xl">
        <div className="flex flex-col gap-lg md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h1 id="preference-setup-title" className="text-[28px] font-black leading-tight tracking-[-0.03em] text-on-surface md:text-[32px]">
              화주/주선사 선호 조건 설정
            </h1>
            <p className="mt-sm text-body-lg text-secondary">
              발주 시 주요 고려 항목을 선택해 주십시오. 답변은 이후 AI 조정안과 운송 추천의 표시 순서에 반영됩니다.
            </p>
          </div>
          <div className="min-w-[180px] rounded-xl bg-surface-container-low px-md py-sm">
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-secondary">설정 진행률</span>
              <strong className="text-on-surface">{answeredCount}/3 완료</strong>
            </div>
            <div className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container-high" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary-container transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-md">
        {preferenceGroups.map((group) => {
          const selected = selections[group.id]
          const reachedLimit = selected.length >= 2

          return (
            <fieldset
              key={group.id}
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg shadow-[0_2px_8px_rgba(26,28,28,0.04)] md:p-xl"
            >
              <legend className="sr-only">{group.title}</legend>
              <div className="flex flex-col gap-lg">
                <div className="flex w-full max-w-[640px] gap-md">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-on-secondary-fixed text-primary">
                    <span className="material-symbols-outlined" aria-hidden="true">{group.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-sm">
                      <span className="text-label-sm font-bold text-primary">{group.number}</span>
                      <h2 className="text-headline-sm font-bold text-on-surface">{group.title}</h2>
                    </div>
                    {group.description && (
                      <p className="mt-xs text-body-md text-secondary">{group.description}</p>
                    )}
                    <p className="mt-sm text-label-sm text-secondary">
                      최소 1개 · 최대 2개
                      {reachedLimit ? ' · 최대 선택 완료' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-sm sm:grid-cols-2">
                  {group.options.map((option) => {
                    const isSelected = selected.includes(option)
                    const isDisabled = reachedLimit && !isSelected

                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={isDisabled}
                        onClick={() => onToggle(group.id, option)}
                        className={`flex min-h-12 items-center justify-between rounded-xl border px-md py-3 text-left text-label-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          isSelected
                            ? 'border-primary bg-[#fff9cc] text-on-surface shadow-[inset_0_0_0_1px_#6a5f00]'
                            : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container-low'
                        } ${isDisabled ? 'cursor-not-allowed opacity-40' : 'active:scale-[0.99]'}`}
                      >
                        <span>{option}</span>
                        <span
                          className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-primary' : 'text-outline'}`}
                          aria-hidden="true"
                        >
                          {isSelected ? 'check_circle' : 'circle'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </fieldset>
          )
        })}
      </div>

      <div className="flex flex-col items-stretch justify-between gap-md rounded-2xl bg-on-secondary-fixed px-lg py-lg text-secondary-fixed md:flex-row md:items-center md:px-xl">
        <div>
          <p className="text-label-md font-bold text-primary-fixed">선택 정보는 내 정보에서 다시 수정할 수 있어요.</p>
        </div>
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className="inline-flex min-h-12 items-center justify-center gap-sm rounded-full bg-primary-container px-xl py-3 text-label-md font-bold text-on-primary-fixed transition-all hover:bg-primary-fixed active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-on-secondary-fixed-variant disabled:text-secondary-fixed-dim"
        >
          선호 조건 저장하고 시작
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
    </section>
  )
}

export default PreferenceSetup
