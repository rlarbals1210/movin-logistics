import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { cargoOptions, regionGroups, vehicleOptions } from './shipperData'
import {
  callFieldCompletion,
  formatDate,
  getSelectedCargo,
  getSelectedLocation,
  getSelectedVehicle,
  minutesToTime,
  timeWindowDuration,
} from './shipperModel'
import type { CallForm, ShipperModelMetadata } from './shipperTypes'

type CallRegistrationProps = {
  form: CallForm
  modelMetadata: ShipperModelMetadata
  preferencesSaved: boolean
  onChange: (next: CallForm) => void
  onContinue: () => void
}

type RegionSelectorProps = {
  label: string
  region: string
  detail: string
  custom: string
  onChange: (values: { region: string; detail: string; custom: string }) => void
}

const weekLabels = ['일', '월', '화', '수', '목', '금', '토']

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function RegionSelector({ label, region, detail, custom, onChange }: RegionSelectorProps) {
  const selectedGroup = regionGroups.find((group) => group.name === region)
  const regionNames = [...regionGroups.map((group) => group.name), '기타']

  return (
    <fieldset className="min-w-0">
      <legend className="text-label-md font-bold text-on-surface">{label}</legend>
      <div className="mt-md flex flex-wrap gap-sm">
        {regionNames.map((name) => {
          const selected = region === name
          return (
            <button
              key={name}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange({ region: name, detail: '', custom: '' })}
              className={`rounded-full border px-md py-sm text-label-md font-bold transition-colors ${
                selected
                  ? 'border-on-secondary-fixed bg-on-secondary-fixed text-primary-fixed'
                  : 'border-outline-variant bg-white text-on-surface hover:border-outline'
              }`}
            >
              {name}
            </button>
          )
        })}
      </div>

      {selectedGroup && (
        <div className="mt-md rounded-xl bg-surface-container-low p-md animate-[mv-panel-in_160ms_ease-out] motion-reduce:animate-none">
          <p className="text-label-sm font-bold text-secondary">세부 위치</p>
          <div className="mt-sm flex flex-wrap gap-sm">
            {selectedGroup.locations.map((location) => (
              <button
                key={location}
                type="button"
                aria-pressed={detail === location}
                onClick={() => onChange({ region, detail: location, custom: '' })}
                className={`rounded-lg border px-md py-sm text-body-md font-bold transition-colors ${
                  detail === location
                    ? 'border-primary bg-[#fff9cc] text-on-surface'
                    : 'border-outline-variant bg-white text-secondary hover:text-on-surface'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      )}

      {region === '기타' && (
        <label className="mt-md block animate-[mv-panel-in_160ms_ease-out] motion-reduce:animate-none">
          <span className="text-label-sm font-bold text-secondary">직접 입력</span>
          <input
            value={custom}
            onChange={(event) => onChange({ region, detail: '', custom: event.target.value })}
            placeholder="예: 경기 안산시 단원구"
            className="mt-sm h-12 w-full rounded-xl border border-outline-variant bg-white px-md text-body-md font-bold text-on-surface outline-none transition-colors placeholder:font-normal placeholder:text-secondary focus:border-primary"
          />
        </label>
      )}
    </fieldset>
  )
}

function CalendarPicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const initialDate = value ? new Date(`${value}T00:00:00`) : new Date()
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))

  const days = useMemo(() => {
    const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    start.setDate(start.getDate() - start.getDay())
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }, [visibleMonth])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="rounded-xl border border-outline-variant bg-white p-md">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
        </button>
        <strong className="text-label-md text-on-surface">
          {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
        </strong>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
        </button>
      </div>
      <div className="mt-md grid grid-cols-7 text-center text-label-sm font-bold text-secondary">
        {weekLabels.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="mt-sm grid grid-cols-7 gap-xs">
        {days.map((date) => {
          const dateKey = toDateKey(date)
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth()
          const isSelected = value === dateKey
          const disabled = date < today
          return (
            <button
              key={dateKey}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onChange(dateKey)}
              className={`h-10 rounded-lg text-body-md font-bold transition-colors ${
                isSelected
                  ? 'bg-on-secondary-fixed text-primary-fixed'
                  : isCurrentMonth
                    ? 'text-on-surface hover:bg-surface-container-low'
                    : 'text-outline'
              } disabled:cursor-not-allowed disabled:opacity-25`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function polarPoint(minutes: number, radius: number) {
  const angle = (minutes / 1440) * Math.PI * 2 - Math.PI / 2
  return { x: 150 + Math.cos(angle) * radius, y: 150 + Math.sin(angle) * radius }
}

function arcPath(start: number, end: number, radius: number) {
  const startPoint = polarPoint(start, radius)
  const endPoint = polarPoint(end, radius)
  const duration = timeWindowDuration(start, end)
  const largeArc = duration > 720 ? 1 : 0
  return `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}`
}

function CircularTimePicker({
  start,
  end,
  onChange,
}: {
  start: number
  end: number
  onChange: (start: number, end: number) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragTarget, setDragTarget] = useState<'start' | 'end' | null>(null)
  const startPoint = polarPoint(start, 104)
  const endPoint = polarPoint(end, 104)
  const duration = timeWindowDuration(start, end)

  const minutesFromPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return 0
    const x = ((event.clientX - rect.left) / rect.width) * 300 - 150
    const y = ((event.clientY - rect.top) / rect.height) * 300 - 150
    const angle = Math.atan2(y, x) + Math.PI / 2
    const normalized = angle < 0 ? angle + Math.PI * 2 : angle
    return Math.round(((normalized / (Math.PI * 2)) * 1440) / 30) * 30 % 1440
  }

  const moveTarget = (target: 'start' | 'end', minutes: number) => {
    if (target === 'start') onChange(minutes, end)
    else onChange(start, minutes)
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!dragTarget) return
    event.currentTarget.setPointerCapture(event.pointerId)
    moveTarget(dragTarget, minutesFromPointer(event))
  }

  const setNearestHandle = (event: ReactPointerEvent<SVGSVGElement>) => {
    const minutes = minutesFromPointer(event)
    const startGap = Math.min(Math.abs(minutes - start), 1440 - Math.abs(minutes - start))
    const endGap = Math.min(Math.abs(minutes - end), 1440 - Math.abs(minutes - end))
    const nextTarget = startGap <= endGap ? 'start' : 'end'
    setDragTarget(nextTarget)
    moveTarget(nextTarget, minutes)
  }

  return (
    <div className="rounded-xl border border-outline-variant bg-white p-lg">
      <svg
        ref={svgRef}
        viewBox="0 0 300 300"
        className="mx-auto h-[300px] w-[300px] touch-none select-none"
        role="img"
        aria-label={`24시간 시계, ${minutesToTime(start)}부터 ${minutesToTime(end)}까지`}
        onPointerDown={setNearestHandle}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragTarget(null)}
        onPointerCancel={() => setDragTarget(null)}
      >
        <circle cx="150" cy="150" r="126" fill="#f9f9f9" stroke="#cdc7aa" strokeWidth="1" />
        <circle cx="150" cy="150" r="104" fill="none" stroke="#e8e8e8" strokeWidth="18" />
        <path d={arcPath(start, end, 104)} fill="none" stroke="#fee500" strokeWidth="18" strokeLinecap="round" />
        {Array.from({ length: 24 }, (_, hour) => {
          const outer = polarPoint(hour * 60, 120)
          const inner = polarPoint(hour * 60, hour % 3 === 0 ? 111 : 115)
          const label = polarPoint(hour * 60, 84)
          return (
            <g key={hour}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={hour % 3 === 0 ? '#1a1c1c' : '#7c775f'} strokeWidth={hour % 3 === 0 ? 2 : 1} />
              {hour % 3 === 0 && (
                <text x={label.x} y={label.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#5f5e5e">{hour}</text>
              )}
            </g>
          )
        })}
        <circle cx={startPoint.x} cy={startPoint.y} r="12" fill="#1c1b1b" stroke="#fee500" strokeWidth="4" />
        <circle cx={endPoint.x} cy={endPoint.y} r="12" fill="#1c1b1b" stroke="#fee500" strokeWidth="4" />
        <text x="150" y="137" textAnchor="middle" fontSize="13" fontWeight="700" fill="#5f5e5e">상차 시간창</text>
        <text x="150" y="166" textAnchor="middle" fontSize="24" fontWeight="900" fill="#1a1c1c">{Math.round(duration / 60 * 10) / 10}h</text>
      </svg>

      <div className="mt-lg">
        <h3 className="text-headline-sm font-bold text-on-surface">시계의 두 점을 드래그하세요</h3>
        <p className="mt-xs text-body-md text-secondary">30분 단위로 시작과 종료 시각을 조정할 수 있습니다.</p>
        <div className="mt-lg grid grid-cols-2 gap-md">
          {([
            ['start', '시작 시각', start],
            ['end', '종료 시각', end],
          ] as const).map(([target, label, value]) => (
            <div key={target} className="rounded-xl bg-surface-container-low p-md">
              <p className="text-label-sm font-bold text-secondary">{label}</p>
              <p className="mt-xs text-headline-md font-black text-on-surface">{minutesToTime(value)}</p>
              <div className="mt-md flex gap-sm">
                <button
                  type="button"
                  aria-label={`${label} 30분 앞당기기`}
                  onClick={() => moveTarget(target, (value - 30 + 1440) % 1440)}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-white text-label-sm font-bold text-on-surface hover:border-outline"
                >
                  -30분
                </button>
                <button
                  type="button"
                  aria-label={`${label} 30분 늦추기`}
                  onClick={() => moveTarget(target, (value + 30) % 1440)}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-white text-label-sm font-bold text-on-surface hover:border-outline"
                >
                  +30분
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-md rounded-xl bg-on-secondary-fixed p-md text-secondary-fixed">
          <p className="text-label-sm text-secondary-fixed-dim">선택한 상차 시간</p>
          <p className="mt-xs text-headline-sm font-black text-primary-fixed">
            {minutesToTime(start)} ~ {minutesToTime(end)}
          </p>
        </div>
      </div>
    </div>
  )
}

function OptionGrid({
  options,
  value,
  custom,
  customPlaceholder,
  onChange,
}: {
  options: readonly string[]
  value: string
  custom: string
  customPlaceholder: string
  onChange: (value: string, custom: string) => void
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-sm">
        {[...options, '기타'].map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option, '')}
            className={`min-h-12 rounded-xl border px-md py-sm text-left text-label-md font-bold transition-colors ${
              value === option
                ? 'border-primary bg-[#fff9cc] text-on-surface shadow-[inset_0_0_0_1px_#6a5f00]'
                : 'border-outline-variant bg-white text-on-surface hover:border-outline'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {value === '기타' && (
        <input
          value={custom}
          onChange={(event) => onChange(value, event.target.value)}
          placeholder={customPlaceholder}
          className="mt-md h-12 w-full rounded-xl border border-outline-variant bg-white px-md text-body-md font-bold text-on-surface outline-none placeholder:font-normal placeholder:text-secondary focus:border-primary animate-[mv-panel-in_160ms_ease-out] motion-reduce:animate-none"
        />
      )}
    </>
  )
}

function StepHeading({ number, title, description, icon }: { number: string; title: string; description: string; icon: string }) {
  return (
    <div className="flex items-start gap-md border-b border-outline-variant pb-lg">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-on-secondary-fixed text-primary-fixed">
        <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      </div>
      <div>
        <div className="flex items-center gap-sm">
          <span className="text-label-sm font-black text-primary">{number}</span>
          <h2 className="text-headline-sm font-black text-on-surface">{title}</h2>
        </div>
        <p className="mt-xs text-body-md text-secondary">{description}</p>
      </div>
    </div>
  )
}

function RouteSummary({ form }: { form: CallForm }) {
  const summaryItems = [
    ['출발지', getSelectedLocation(form.originRegion, form.originDetail, form.originCustom)],
    ['도착지', getSelectedLocation(form.destinationRegion, form.destinationDetail, form.destinationCustom)],
    ['차량', getSelectedVehicle(form)],
    ['품목', getSelectedCargo(form)],
    ['상차 날짜', form.loadingDate ? formatDate(form.loadingDate) : ''],
    ['상차 시간', `${minutesToTime(form.loadingStartMinutes)}~${minutesToTime(form.loadingEndMinutes)}`],
  ]

  return (
    <section className="rounded-2xl bg-on-secondary-fixed p-xl text-secondary-fixed" aria-labelledby="route-summary-title">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="route-summary-title" className="text-headline-sm font-black text-primary-fixed">등록 예정 노선</h2>
          <p className="mt-xs text-body-md text-secondary-fixed-dim">선택할 때마다 한 칸씩 채워집니다.</p>
        </div>
        <span className="rounded-full bg-[#2a2a28] px-md py-sm text-label-sm font-bold text-primary-fixed">
          {callFieldCompletion(form)}/6 입력
        </span>
      </div>
      <dl className="mt-lg grid grid-cols-3 gap-sm">
        {summaryItems.map(([label, value]) => (
          <div key={label} className="min-h-20 rounded-xl bg-[#292927] p-md">
            <dt className="text-label-sm text-secondary-fixed-dim">{label}</dt>
            <dd className={`mt-xs text-body-md font-bold ${value ? 'text-secondary-fixed' : 'text-[#777]'} `}>{value || '미선택'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function CallRegistration({ form, modelMetadata, preferencesSaved, onChange, onContinue }: CallRegistrationProps) {
  const completion = callFieldCompletion(form)
  const canContinue = completion === 6
  const update = <K extends keyof CallForm>(key: K, value: CallForm[K]) => onChange({ ...form, [key]: value })

  return (
    <section className="space-y-lg" aria-labelledby="register-call-title">
      <div className="rounded-2xl border border-outline-variant bg-white p-xl shadow-[0_2px_8px_rgba(26,28,28,0.04)]">
        <div className="flex items-start justify-between gap-xl">
          <div className="max-w-3xl">
            <h1 id="register-call-title" className="text-[32px] font-black leading-tight tracking-[-0.03em] text-on-surface">화물 정보 등록</h1>
            <p className="mt-sm text-body-lg text-secondary">운송 기본 정보를 입력하면 필수 설정과 함께 조건 비교에 반영됩니다.</p>
          </div>
          <div className="min-w-[210px] rounded-xl bg-surface-container-low p-md">
            <div className="flex items-center justify-between text-label-sm">
              <span className="text-secondary">콜 등록 진행률</span>
              <strong className="text-on-surface">{completion}/6</strong>
            </div>
            <div className="mt-sm h-2 overflow-hidden rounded-full bg-surface-container-high">
              <div className="h-full rounded-full bg-primary-container transition-[width] duration-300" style={{ width: `${Math.round(completion / 6 * 100)}%` }} />
            </div>
          </div>
        </div>
        {!preferencesSaved && (
          <div className="mt-lg flex items-center gap-sm rounded-xl border border-[#e4ce00] bg-[#fff9cc] px-md py-sm text-body-md text-on-surface">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">info</span>
            필수 설정을 저장하면 선호 조건까지 함께 반영됩니다.
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-outline-variant bg-white p-xl">
        <StepHeading number="01" title="출발지와 도착지" description="권역을 먼저 고른 뒤 세부 위치를 선택하세요." icon="route" />
        <div className="mt-lg grid grid-cols-2 gap-xl">
          <RegionSelector
            label="출발지"
            region={form.originRegion}
            detail={form.originDetail}
            custom={form.originCustom}
            onChange={(values) => onChange({ ...form, originRegion: values.region, originDetail: values.detail, originCustom: values.custom })}
          />
          <RegionSelector
            label="도착지"
            region={form.destinationRegion}
            detail={form.destinationDetail}
            custom={form.destinationCustom}
            onChange={(values) => onChange({ ...form, destinationRegion: values.region, destinationDetail: values.detail, destinationCustom: values.custom })}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-white p-xl">
        <StepHeading number="02" title="차량과 품목" description="실제 배차에 필요한 차량과 화물 성격을 선택하세요." icon="local_shipping" />
        <div className="mt-lg grid grid-cols-2 gap-xl">
          <fieldset>
            <legend className="text-label-md font-bold text-on-surface">차량</legend>
            <div className="mt-md">
              <OptionGrid
                options={vehicleOptions}
                value={form.vehicle}
                custom={form.vehicleCustom}
                customPlaceholder="예: 8톤 리프트 윙바디"
                onChange={(vehicle, vehicleCustom) => onChange({ ...form, vehicle, vehicleCustom })}
              />
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-label-md font-bold text-on-surface">품목</legend>
            <div className="mt-md">
              <OptionGrid
                options={cargoOptions}
                value={form.cargoItem}
                custom={form.cargoItemCustom}
                customPlaceholder="예: 의료기기"
                onChange={(cargoItem, cargoItemCustom) => onChange({ ...form, cargoItem, cargoItemCustom })}
              />
            </div>
          </fieldset>
        </div>

        <label className="mt-xl block rounded-xl bg-surface-container-low p-lg">
          <span className="flex items-center justify-between gap-md">
            <span>
              <strong className="text-label-md text-on-surface">내 화물 설명</strong>
              <span className="ml-sm text-label-sm text-secondary">필수 · 자연어 입력</span>
            </span>
            <span className="text-label-sm text-secondary">중량·포장·주의사항을 함께 적어주세요.</span>
          </span>
          <textarea
            value={form.cargoDescription}
            onChange={(event) => update('cargoDescription', event.target.value)}
            placeholder="예: 냉동만두 4.8톤, 파렛트 12개입니다. 영하 18도 유지가 필요하고 지게차 상차가 가능합니다."
            rows={4}
            className="mt-md w-full resize-none rounded-xl border border-outline-variant bg-white p-md text-body-md font-bold leading-6 text-on-surface outline-none placeholder:font-normal placeholder:text-secondary focus:border-primary"
          />
          <span className="mt-sm block text-label-sm text-secondary">입력 문장은 이후 중량 추출·톤급 매핑·배차 조건 해석의 연결 지점입니다.</span>
        </label>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-white p-xl">
        <StepHeading number="03" title="상차 날짜와 시간" description="달력에서 날짜를 고르고 24시간 시계에서 상차 가능 시간창을 설정하세요." icon="schedule" />
        <div className="mt-lg grid grid-cols-[360px_minmax(0,1fr)] gap-xl">
          <div>
            <p className="mb-md text-label-md font-bold text-on-surface">상차 날짜</p>
            <CalendarPicker value={form.loadingDate} onChange={(date) => update('loadingDate', date)} />
          </div>
          <div>
            <p className="mb-md text-label-md font-bold text-on-surface">상차 시간</p>
            <CircularTimePicker
              start={form.loadingStartMinutes}
              end={form.loadingEndMinutes}
              onChange={(loadingStartMinutes, loadingEndMinutes) => onChange({ ...form, loadingStartMinutes, loadingEndMinutes })}
            />
          </div>
        </div>
      </div>

      <RouteSummary form={form} />

      <div className="flex items-center justify-between rounded-2xl border border-outline-variant bg-white p-lg">
        <div>
          <p className="text-label-md font-bold text-on-surface">연결 데이터 · 모델</p>
          <p className="mt-xs text-label-sm text-secondary">
            입력: 노선·차량·품목·자연어 중량·상차 시간창 · 연결: 톤급×시간창 {modelMetadata.scenarioRows}개 원본 시나리오, 학습 표본 {modelMetadata.trainingRows.toLocaleString('ko-KR')}행
          </p>
        </div>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="inline-flex min-h-12 items-center justify-center gap-sm rounded-full bg-on-secondary-fixed px-xl text-label-md font-black text-primary-fixed transition-all hover:bg-[#292927] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-surface-container-high disabled:text-secondary"
        >
          조건 비교 보기
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
    </section>
  )
}

export default CallRegistration
