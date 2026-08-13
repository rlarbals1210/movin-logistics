import { useEffect, useRef, useState } from 'react'
import { useCarrierCalls } from './features/carrier/useCarrierCalls'
import { 노선키, type 추천콜상세 } from './features/carrier/carrierTypes'
import { 귀가가능한가 } from './features/carrier/economics'
import { 피드백요청, 피드백전송 } from './features/carrier/decisions'
import type { ApiFeedbackRequest } from './features/carrier/carrierApiTypes'
import { KakaoRouteMap } from './features/carrier/KakaoRouteMap'
import { useInsight } from './lib/useInsight'
import {
  기본운송인,
  권역별_세부지역,
  등록화물_목록,
  선호시간_선택지,
  운송단계,
  우선조건_선택지,
  type 등록화물,
} from './features/carrier/carrierFlowData'
import {
  선호조건완료인가,
  선호조건읽기,
  선호조건저장,
  선호조건초기화,
  후속매칭쿼리문자열,
  빈선호조건,
  매칭쿼리문자열,
  type CarrierPreferences,
} from './features/carrier/carrierPreferences'

const 운송인ID = 'C-01'

const 원 = (value: number) => `${Math.round(value).toLocaleString('ko-KR')}원`

type IconName =
  | 'menu'
  | 'back'
  | 'bell'
  | 'headset'
  | 'chevron'
  | 'refresh'
  | 'user'
  | 'truck'
  | 'location'
  | 'clock'
  | 'won'
  | 'info'
  | 'check'
  | 'route'
  | 'close'
  | 'filter'
  | 'chart'

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  const path = (() => {
    switch (name) {
      case 'menu': return <><path d="M4 7h16M4 12h16M4 17h16" /></>
      case 'back': return <><path d="m15 18-6-6 6-6" /></>
      case 'bell': return <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>
      case 'headset': return <><path d="M4 14v-2a8 8 0 0 1 16 0v2" /><path d="M4 14h3v6H5a1 1 0 0 1-1-1v-5ZM20 14h-3v6h2a1 1 0 0 0 1-1v-5Z" /></>
      case 'chevron': return <><path d="m9 18 6-6-6-6" /></>
      case 'refresh': return <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M18.5 9A7 7 0 0 0 6.2 6.5L4 9m16 6-2.2 2.5A7 7 0 0 1 5.5 15" /></>
      case 'user': return <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>
      case 'truck': return <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>
      case 'location': return <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>
      case 'clock': return <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
      case 'won': return <><path d="m5 7 3 10 4-10 4 10 3-10M4 11h16M4 14h16" /></>
      case 'info': return <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>
      case 'check': return <><path d="m5 12 4 4L19 6" /></>
      case 'route': return <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h2a3 3 0 0 0 3-3 3 3 0 0 1 3-3h2M6 16V8a2 2 0 0 1 2-2h8" /></>
      case 'close': return <><path d="m6 6 12 12M18 6 6 18" /></>
      case 'filter': return <><path d="M4 6h16M7 12h10M10 18h4" /></>
      case 'chart': return <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>
    }
  })()

  return <svg {...common}>{path}</svg>
}

function AppHeader({
  단계,
  onBack,
  onMenu,
  onNotice,
  onHelp,
}: {
  단계: number
  onBack: () => void
  onMenu: () => void
  onNotice: () => void
  onHelp: () => void
}) {
  return (
    <header className="carrier-header">
      <div className="carrier-appbar">
        <button type="button" className="carrier-icon-button" onClick={단계 === 0 ? onMenu : onBack} aria-label={단계 === 0 ? '메뉴 열기' : '이전 화면'}>
          <Icon name={단계 === 0 ? 'menu' : 'back'} />
        </button>
        <strong className="carrier-brand">Mov!n <span>운송인</span></strong>
        <div className="carrier-appbar-actions">
          <button type="button" className="carrier-icon-button" onClick={onNotice} aria-label="알림"><Icon name="bell" size={20} /></button>
          <button type="button" className="carrier-icon-button" onClick={onHelp} aria-label="고객센터"><Icon name="headset" size={20} /></button>
        </div>
      </div>
      <div className="carrier-progress-copy">
        <strong>{단계 + 1} / 8</strong>
        <span>· {운송단계[단계].label}</span>
      </div>
      <div className="carrier-progress" aria-label={`전체 8단계 중 ${단계 + 1}단계`}>
        {운송단계.map((item, index) => (
          <span key={item.id} className={index <= 단계 ? 'is-filled' : ''} />
        ))}
      </div>
    </header>
  )
}

function StickyAction({
  label,
  disabled = false,
  onClick,
  helper,
  pending = false,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  helper?: string
  pending?: boolean
}) {
  return (
    <footer className="carrier-sticky-action">
      {helper && <p>{helper}</p>}
      <button type="button" disabled={disabled} onClick={onClick}>
        {pending && <span className="mv-spin" aria-hidden="true" />} {label}
      </button>
    </footer>
  )
}

function OrderRow({
  order,
  expanded,
  onToggle,
}: {
  order: 등록화물
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <article className={`carrier-order-row ${expanded ? 'is-expanded' : ''}`}>
      <button type="button" className="carrier-order-summary" onClick={onToggle} aria-expanded={expanded}>
        <span className="carrier-order-index">{order.id.slice(-2)}</span>
        <span className="carrier-order-route">
          <strong>{order.출발요약} <span aria-hidden="true">→</span> {order.도착요약}</strong>
          <small>{order.차량} · {order.화물} · {order.상차시간}</small>
        </span>
        <strong className="carrier-order-fare">{원(order.예상운임)}</strong>
        <span className={`carrier-disclosure ${expanded ? 'is-open' : ''}`}><Icon name="chevron" size={18} /></span>
      </button>
      {expanded && (
        <div className="carrier-order-details">
          <div><Icon name="location" size={18} /><span><small>출발지</small><strong>{order.출발지}</strong></span></div>
          <div><Icon name="location" size={18} /><span><small>도착지</small><strong>{order.도착지}</strong></span></div>
          <div className="carrier-detail-grid">
            <span><small>거리</small><strong>{order.거리km}km</strong></span>
            <span><small>상차 시간</small><strong>{order.상차시간}</strong></span>
          </div>
          <div className="carrier-detail-fare"><small>예상 운임</small><strong>{원(order.예상운임)}</strong></div>
        </div>
      )}
    </article>
  )
}

function StartScreen({
  expandedOrder,
  onToggleOrder,
  profileOpen,
  onToggleProfile,
  refreshedAt,
  onRefresh,
}: {
  expandedOrder: string
  onToggleOrder: (id: string) => void
  profileOpen: boolean
  onToggleProfile: () => void
  refreshedAt: string
  onRefresh: () => void
}) {
  return (
    <div className="carrier-screen carrier-start-screen">
      <h1>오늘 운행을<br />시작할까요?</h1>
      <button type="button" className="carrier-profile-summary" onClick={onToggleProfile} aria-expanded={profileOpen}>
        <span className="carrier-profile-icon"><Icon name="user" /></span>
        <span><strong>{기본운송인.역할} / {기본운송인.차량}</strong><small>{기본운송인.기반지역} 기반</small></span>
        <span className={`carrier-disclosure ${profileOpen ? 'is-open' : ''}`}><Icon name="chevron" size={18} /></span>
      </button>
      {profileOpen && (
        <div className="carrier-profile-detail">
          <span>운행 가능 지역 <strong>{기본운송인.운행가능지역}</strong></span>
          <span>운행 가능 시간 <strong>{기본운송인.운행가능시간}</strong></span>
        </div>
      )}

      <div className="carrier-section-heading">
        <div><h2>지금 등록된 화물</h2><small>{refreshedAt} 기준</small></div>
        <button type="button" onClick={onRefresh}><Icon name="refresh" size={17} /> 새로고침</button>
      </div>
      <div className="carrier-order-list">
        {등록화물_목록.map((order) => (
          <OrderRow key={order.id} order={order} expanded={expandedOrder === order.id} onToggle={() => onToggleOrder(order.id)} />
        ))}
      </div>
      <p className="carrier-inline-note"><Icon name="info" size={18} /> 화물을 펼쳐봐도 선택되지는 않아요.</p>
    </div>
  )
}

function ProfileScreen() {
  const rows = [
    ['운송 구분', 기본운송인.역할],
    ['차량 정보', 기본운송인.차량],
    ['기반 지역', 기본운송인.기반지역],
    ['운행 가능 지역', 기본운송인.운행가능지역],
    ['운행 가능 시간', 기본운송인.운행가능시간],
    ['휴무일', 기본운송인.휴무일],
  ]
  return (
    <div className="carrier-screen">
      <h1>기본 조건을<br />확인해 주세요</h1>
      <p className="carrier-lead">추천에 사용할 내 차량과 운행 정보입니다.</p>
      <div className="carrier-condition-list">
        {rows.map(([label, value], index) => (
          <div key={label}><span>{label}</span><strong>{value}</strong>{index < 3 && <Icon name={index === 0 ? 'user' : index === 1 ? 'truck' : 'location'} size={19} />}</div>
        ))}
      </div>
      <p className="carrier-inline-note"><Icon name="info" size={18} /> 기본 정보는 내 정보에서 언제든 바꿀 수 있어요.</p>
    </div>
  )
}

function ChoiceButton({ selected, children, onClick }: { selected: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" className={`carrier-choice ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={onClick}>{children}{selected && <Icon name="check" size={16} />}</button>
}

function PreferencesScreen({ value, onChange }: { value: CarrierPreferences; onChange: (value: CarrierPreferences) => void }) {
  const areas = Object.keys(권역별_세부지역)
  const subareas = value.권역 ? 권역별_세부지역[value.권역] ?? [] : []

  const toggleTime = (time: string) => {
    if (time === '상관없음') {
      onChange({ ...value, 선호시간: value.선호시간.includes(time) ? [] : [time] })
      return
    }
    const withoutAny = value.선호시간.filter((item) => item !== '상관없음')
    const next = withoutAny.includes(time) ? withoutAny.filter((item) => item !== time) : [...withoutAny, time]
    onChange({ ...value, 선호시간: next })
  }

  const togglePriority = (priority: string) => {
    const next = value.우선조건.includes(priority)
      ? value.우선조건.filter((item) => item !== priority)
      : [...value.우선조건, priority]
    onChange({ ...value, 우선조건: next })
  }

  const checklist = [Boolean(value.권역 && value.세부지역), value.선호시간.length > 0, value.우선조건.length > 0]
  return (
    <div className="carrier-screen carrier-preferences-screen">
      <h1>선호 조건을<br />설정해 주세요</h1>
      <p className="carrier-lead">원하는 조건을 알려주면 더 적합한 콜을 먼저 보여드려요.</p>

      <section className="carrier-form-section">
        <div className="carrier-form-title"><span>1</span><div><h2>선호 권역</h2><small>권역과 세부 지역을 하나씩 선택</small></div>{checklist[0] && <Icon name="check" size={18} />}</div>
        <div className="carrier-choice-grid carrier-choice-grid-area">
          {areas.map((area) => <ChoiceButton key={area} selected={value.권역 === area} onClick={() => onChange({ ...value, 권역: area, 세부지역: '' })}>{area}</ChoiceButton>)}
        </div>
        {value.권역 && (
          <div className="carrier-subarea-block">
            <small>{value.권역} 세부 지역</small>
            <div className="carrier-choice-grid">
              {subareas.map((area) => <ChoiceButton key={area} selected={value.세부지역 === area} onClick={() => onChange({ ...value, 세부지역: area })}>{area}</ChoiceButton>)}
            </div>
          </div>
        )}
      </section>

      <section className="carrier-form-section">
        <div className="carrier-form-title"><span>2</span><div><h2>선호 시간</h2><small>복수 선택 가능</small></div>{checklist[1] && <Icon name="check" size={18} />}</div>
        <div className="carrier-choice-grid carrier-choice-grid-time">
          {선호시간_선택지.map((time) => <ChoiceButton key={time} selected={value.선호시간.includes(time)} onClick={() => toggleTime(time)}>{time}</ChoiceButton>)}
        </div>
        {value.선호시간.includes('상관없음') && <p className="carrier-field-hint">상관없음을 선택하면 다른 시간은 해제돼요.</p>}
      </section>

      <section className="carrier-form-section">
        <div className="carrier-form-title"><span>3</span><div><h2>우선 조건</h2><small>복수 선택 가능</small></div>{checklist[2] && <Icon name="check" size={18} />}</div>
        <div className="carrier-choice-grid carrier-choice-grid-priority">
          {우선조건_선택지.map((priority) => <ChoiceButton key={priority} selected={value.우선조건.includes(priority)} onClick={() => togglePriority(priority)}>{priority}</ChoiceButton>)}
        </div>
      </section>
    </div>
  )
}

interface 계산후보 {
  콜: 추천콜상세
  분해: {
    운임: number
    유류비_적재: number
    유류비_공차: number
    톨비: number
    실수령: number
    총소요_h: number
    시간당_실수령: number
  }
  귀가: boolean
}

const 운행비 = (candidate: 계산후보) => candidate.분해.유류비_적재 + candidate.분해.유류비_공차 + candidate.분해.톨비

function 후보표시정보(candidate: 계산후보, index: number) {
  const tags = [index === 0 ? '추천 1순위' : '비교 후보', ...candidate.콜.태그]
  const warnings = [...candidate.콜.경고, ...(!candidate.귀가 ? ['귀가 경로 아님'] : [])]
  return { tags, warnings }
}

function CallsLoading() {
  return <div className="carrier-loading-list" aria-label="오더 불러오는 중" aria-busy="true">{[0, 1, 2].map((n) => <div key={n}><span /><span /><span /></div>)}</div>
}

function OrderBoardScreen({ candidates, loading, preferences, source, matchQuery, errorMessage, onRetry }: { candidates: 계산후보[]; loading: boolean; preferences: CarrierPreferences; source: 'api' | '폴백'; matchQuery: string; errorMessage: string; onRetry: () => void }) {
  return (
    <div className="carrier-screen carrier-board-screen" data-match-query={matchQuery}>
      <h1>조건에 맞는 오더를<br />찾았어요</h1>
      <div className="carrier-active-filter"><Icon name="filter" size={17} /><span>{preferences.권역} · {preferences.세부지역}</span><span>{preferences.선호시간.join(', ')}</span></div>
      <div className="carrier-section-heading"><div><h2>오더 게시판</h2><small>실수령과 공차거리까지 반영</small></div><strong>{candidates.length}건</strong></div>
      {loading ? <CallsLoading /> : (
        <div className="carrier-board-list">
          {candidates.map(({ 콜, 분해 }, index) => (
            <article key={콜.콜ID}>
              <span className="carrier-rank-line" data-rank={index + 1} />
              <div className="carrier-board-card-head"><strong>{콜.출발지.split(' ').slice(0, 2).join(' ')} <span>→</span> {콜.도착지.split(' ').slice(0, 2).join(' ')}</strong><b>{원(분해.실수령)}</b></div>
              <p>{콜.거리km.toLocaleString('ko-KR')}km · 공차 {콜.공차거리km.toLocaleString('ko-KR')}km · {분해.총소요_h.toFixed(1)}시간</p>
              <div><span>예상 운임 {원(콜.예측_운임)}</span><span>복화 {Math.round(콜.복화가능성 * 100)}%</span></div>
            </article>
          ))}
        </div>
      )}
      {source === '폴백' && <div className="carrier-api-fallback"><p>{errorMessage || '현재 결정론적 예시 오더를 표시하고 있어요.'}</p><button type="button" onClick={onRetry}>다시 시도</button></div>}
    </div>
  )
}

function CandidateNotification({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <button type="button" className="carrier-candidate-alert" onClick={onOpen} aria-label={`추천 후보 ${count}개 비교하기`}>
      <span className="carrier-alert-icon"><Icon name="bell" size={20} /></span>
      <span><strong>추천 후보 {count}개가 도착했어요</strong><small>눌러서 예상 실수령을 비교해 보세요.</small></span>
      <Icon name="chevron" size={18} />
    </button>
  )
}

interface CandidateDelta {
  label: string
  value: number
  unit: string
  digits?: number
}

function 차이표시({ value, unit, digits = 0 }: Omit<CandidateDelta, 'label'>) {
  if (Math.abs(value) < 0.0001) return `차이 없음`
  const absolute = Math.abs(value).toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  return `${value > 0 ? '+' : '−'}${absolute}${unit}`
}

function 규칙기반비교설명(recommended: 계산후보, selected: 계산후보): string {
  const netDelta = selected.분해.실수령 - recommended.분해.실수령
  const timeDelta = selected.분해.총소요_h - recommended.분해.총소요_h
  const netText = netDelta === 0 ? '같고' : `${원(Math.abs(netDelta))} ${netDelta > 0 ? '많고' : '적고'}`
  const timeText = Math.abs(timeDelta) < 0.05 ? '같습니다' : `${Math.abs(timeDelta).toFixed(1)}시간 ${timeDelta > 0 ? '깁니다' : '짧습니다'}`
  return `선택한 후보는 추천 1순위보다 예상 실수령이 ${netText}, 운행시간은 ${timeText}. 실수령과 운행시간의 차이를 함께 비교한 값입니다.`
}

function CompareScreen({
  candidates,
  selectedId,
  onSelect,
  locked,
}: {
  candidates: 계산후보[]
  selectedId: string
  onSelect: (id: string) => void
  locked: boolean
}) {
  const topCandidates = candidates.slice(0, 3)
  const recommended = topCandidates[0]
  const selected = topCandidates.find((candidate) => candidate.콜.콜ID === selectedId) ?? recommended
  const isAlternative = Boolean(recommended && selected && recommended.콜.콜ID !== selected.콜.콜ID)
  const deltas: CandidateDelta[] = recommended && selected ? [
    { label: '운행비', value: 운행비(selected) - 운행비(recommended), unit: '원' },
    { label: '운행시간', value: selected.분해.총소요_h - recommended.분해.총소요_h, unit: '시간', digits: 1 },
    { label: '표면운임', value: selected.콜.예측_운임 - recommended.콜.예측_운임, unit: '원' },
    { label: '순수익', value: selected.분해.실수령 - recommended.분해.실수령, unit: '원' },
    { label: '공차거리', value: selected.콜.공차거리km - recommended.콜.공차거리km, unit: 'km', digits: 1 },
    { label: '시간당 순수익', value: selected.분해.시간당_실수령 - recommended.분해.시간당_실수령, unit: '원' },
  ] : []
  const insightFacts = recommended && selected ? {
    추천1순위: { 예상실수령_원: recommended.분해.실수령, 운행시간_h: recommended.분해.총소요_h },
    선택후보: { 예상실수령_원: selected.분해.실수령, 운행시간_h: selected.분해.총소요_h },
    차이: { 예상실수령_원: selected.분해.실수령 - recommended.분해.실수령, 운행시간_h: Number((selected.분해.총소요_h - recommended.분해.총소요_h).toFixed(1)) },
  } : {}
  const { text: insightText, 로딩중: insightLoading } = useInsight('CARRIER', insightFacts, isAlternative)
  const aiHasDirective = /(선택하|추천하|확정하|결정하|고르세요|택하세요)/.test(insightText)
  const safeInsightText = aiHasDirective ? '' : insightText
  const comparisonText = recommended && selected ? (safeInsightText || 규칙기반비교설명(recommended, selected)) : ''

  return (
    <div className="carrier-screen carrier-compare-screen">
      <h1>추천 콜 후보<br />TOP 3</h1>
      <p className="carrier-lead">운임만 보지 않고 실제 남는 금액으로 비교했어요.</p>
      <div className="carrier-candidate-list" role="radiogroup" aria-label="콜 후보 선택">
        {topCandidates.map((candidate, index) => {
          const { 콜, 분해 } = candidate
          const selected = selectedId === 콜.콜ID
          const display = 후보표시정보(candidate, index)
          return (
            <button key={콜.콜ID} type="button" role="radio" aria-checked={selected} disabled={locked} onClick={() => onSelect(콜.콜ID)} className={`carrier-candidate-card ${selected ? 'is-selected' : ''}`}>
              <span className="carrier-candidate-rank">{index + 1}</span>
              <div className="carrier-candidate-copy">
                <div className="carrier-recommendation-state"><small>{index === 0 ? '기본 추천' : '비교 후보'}</small><b>{index === 0 ? '추천' : '추천 아님'}</b></div>
                <h2>{콜.출발지.split(' ').slice(0, 2).join(' ')} <span>→</span> {콜.도착지.split(' ').slice(0, 2).join(' ')}</h2>
                <p className="carrier-pickup-time"><Icon name="clock" size={14} /> 상차 {콜.상차시각}</p>
                <div className="carrier-candidate-metrics">
                  <span><small>공차거리</small><strong>{콜.공차거리km.toLocaleString('ko-KR')}km</strong></span>
                  <span><small>운행시간</small><strong>{분해.총소요_h.toFixed(1)}시간</strong></span>
                  <span><small>운임</small><strong>{원(콜.예측_운임)}</strong></span>
                  <span><small>유류비</small><strong>−{원(분해.유류비_적재)}</strong></span>
                  <span><small>공차비</small><strong>−{원(분해.유류비_공차)}</strong></span>
                  <span className="is-net"><small>예상 실수령</small><strong>{원(분해.실수령)}</strong></span>
                </div>
                <div className="carrier-candidate-labels">
                  {display.tags.map((tag) => <span key={tag} className="is-tag">{tag}</span>)}
                  {display.warnings.map((warning) => <span key={warning} className="is-warning">{warning}</span>)}
                </div>
              </div>
              <span className="carrier-radio"><span /></span>
            </button>
          )
        })}
      </div>
      {isAlternative && (
        <section className="carrier-delta-panel" aria-label="추천 1순위 대비 차이">
          <div><h2>추천 1순위 대비 차이</h2><small>선택 후보 − 추천 1순위</small></div>
          <div className="carrier-delta-grid">
            {deltas.map((delta) => <span key={delta.label}><small>{delta.label}</small><strong className={delta.value > 0 ? 'is-plus' : delta.value < 0 ? 'is-minus' : ''}>{차이표시(delta)}</strong></span>)}
          </div>
          <div className="carrier-ai-explanation">
            <strong>AI 비교 설명</strong>
            {insightLoading && !safeInsightText ? <p className="is-loading">실수령과 운행시간을 비교하고 있어요.</p> : <p>{comparisonText}</p>}
            {!insightLoading && !safeInsightText && <small>규칙 기반 설명</small>}
          </div>
        </section>
      )}
      {!isAlternative && <p className="carrier-default-recommendation"><Icon name="check" size={17} /> 첫 후보를 기본 추천으로 선택했어요.</p>}
      <p className="carrier-inline-note"><Icon name="info" size={18} /> 최종 선택은 운송인이 직접 결정합니다.</p>
    </div>
  )
}

function RouteScreen({ candidate, progress }: { candidate?: 계산후보; progress: number }) {
  if (!candidate) return <CallsLoading />
  const { 콜, 분해 } = candidate
  return (
    <div className="carrier-screen carrier-route-screen">
      <h1>이동 경로를<br />확인해 주세요</h1>
      <div className="carrier-route-summary"><strong>{콜.출발지.split(' ').slice(0, 2).join(' ')} → {콜.도착지.split(' ').slice(0, 2).join(' ')}</strong><span>{콜.거리km.toLocaleString('ko-KR')}km · 약 {분해.총소요_h.toFixed(1)}시간</span></div>
      <KakaoRouteMap call={콜} progress={progress} />
      <div className="carrier-drive-progress" aria-label={`운행 진행률 ${progress}%`}>
        <div><strong>운행 진행 중</strong><b>{progress}%</b></div>
        <span><i style={{ width: `${progress}%` }} /></span>
      </div>
      <div className="carrier-route-timeline">
        <div><span className="timeline-dot current" /><small>차량 위치</small><strong>{progress < 100 ? '경로를 따라 이동 중' : 콜.도착지}</strong><b>{progress}%</b></div>
        <div><span className="timeline-dot pickup" /><small>상차</small><strong>{콜.출발지}</strong><b>+ {콜.공차거리km.toLocaleString('ko-KR')}km</b></div>
        <div><span className="timeline-dot dropoff" /><small>하차</small><strong>{콜.도착지}</strong><b>+ {콜.거리km.toLocaleString('ko-KR')}km</b></div>
      </div>
      <div className="carrier-route-metrics"><span><Icon name="clock" size={19} /><small>예상 소요</small><strong>{분해.총소요_h.toFixed(1)}시간</strong></span><span><Icon name="won" size={19} /><small>예상 실수령</small><strong>{원(분해.실수령)}</strong></span></div>
    </div>
  )
}

function BackhaulScreen({ candidate, loading, source, errorMessage, deciding, onRetry, onAccept, onHome }: { candidate?: 계산후보; loading: boolean; source: 'api' | '폴백'; errorMessage: string; deciding: boolean; onRetry: () => void; onAccept: () => void; onHome: () => void }) {
  return (
    <div className="carrier-screen carrier-backhaul-screen">
      <h1>현재 위치 기준<br />다음 추천 콜</h1>
      <p className="carrier-lead">완료한 콜과 같은 callId·노선은 제외했어요.</p>
      {loading ? <CallsLoading /> : candidate ? (
        <article className="carrier-next-call-card">
          <small>다음 추천</small>
          <h2>{candidate.콜.출발지.split(' ').slice(0, 2).join(' ')} → {candidate.콜.도착지.split(' ').slice(0, 2).join(' ')}</h2>
          <p>상차 {candidate.콜.상차시각} · 공차 {candidate.콜.공차거리km}km · {(candidate.콜.운행시간분 / 60).toFixed(1)}시간</p>
          <div><span>예상 실수령</span><strong>{원(candidate.콜.예상실수령원)}</strong></div>
          <div className="carrier-candidate-labels">{candidate.콜.태그.map((tag) => <span key={tag} className="is-tag">{tag}</span>)}</div>
        </article>
      ) : <div className="carrier-empty-call"><strong>추천 가능한 다음 콜이 없어요.</strong><p>현재 운행을 마치고 리포트로 이동할 수 있어요.</p></div>}
      {source === '폴백' && <div className="carrier-api-fallback"><p>{errorMessage || '결정론적 예시 후보를 표시하고 있어요.'}</p><button type="button" onClick={onRetry}>다시 시도</button></div>}
      <div className="carrier-backhaul-actions">
        <button type="button" disabled={!candidate || deciding} onClick={onAccept}>{deciding && <span className="mv-spin" aria-hidden="true" />} {deciding ? '처리 중…' : '수락하고 다음 운행'}</button>
        <button type="button" disabled={deciding} onClick={onHome}>집으로 돌아가기</button>
      </div>
    </div>
  )
}

function ReportScreen({ calls }: { calls: 계산후보[] }) {
  const loadedKm = calls.reduce((sum, item) => sum + item.콜.거리km, 0)
  const emptyKm = calls.reduce((sum, item) => sum + item.콜.공차거리km, 0)
  const totalDistance = loadedKm + emptyKm
  const totalMinutes = calls.reduce((sum, item) => sum + item.콜.운행시간분, 0)
  const net = calls.reduce((sum, item) => sum + item.콜.예상실수령원, 0)
  const emptyRatio = totalDistance > 0 ? (emptyKm / totalDistance) * 100 : 0
  return (
    <div className="carrier-screen carrier-report-screen">
      <div className="carrier-report-check"><Icon name="check" size={28} /></div>
      <h1>오늘 운행을<br />완료했어요</h1>
      <p className="carrier-lead">실제로 선택한 {calls.length}개 콜의 운행 결과입니다.</p>
      <div className="carrier-report-hero"><small>총 실수령</small><strong>{원(net)}</strong><span>완료 콜 {calls.length}건</span></div>
      <div className="carrier-report-grid">
        <div><Icon name="truck" size={20} /><small>적재거리</small><strong>{loadedKm.toFixed(1)}km</strong></div>
        <div><Icon name="route" size={20} /><small>공차거리</small><strong>{emptyKm.toFixed(1)}km</strong></div>
        <div><Icon name="route" size={20} /><small>총 주행거리</small><strong>{totalDistance.toFixed(1)}km</strong></div>
        <div><Icon name="clock" size={20} /><small>총 운행시간</small><strong>{(totalMinutes / 60).toFixed(1)}시간</strong></div>
        <div><Icon name="chart" size={20} /><small>공차 비율</small><strong>{emptyRatio.toFixed(1)}%</strong></div>
        <div><Icon name="check" size={20} /><small>완료 콜</small><strong>{calls.length}건</strong></div>
      </div>
      <section className="carrier-report-routes">
        <h2>운행 내역</h2>
        {calls.map((item, index) => <div key={item.콜.콜ID}><span>{index === 0 ? '본 운송' : `후속 ${index}`}</span><strong>{item.콜.출발지.split(' ').slice(0, 2).join(' ')} → {item.콜.도착지.split(' ').slice(0, 2).join(' ')}</strong><b>{원(item.콜.예상실수령원)}</b></div>)}
      </section>
      <p className="carrier-data-note">API가 제공한 원 단위 비용과 실제 선택 결과만 합산했습니다.</p>
    </div>
  )
}

function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="carrier-drawer-layer" role="presentation" onClick={onClose}>
      <aside className="carrier-drawer" role="dialog" aria-modal="true" aria-label="운송인 메뉴" onClick={(event) => event.stopPropagation()}>
        <div className="carrier-drawer-head"><strong>Mov!n 운송인</strong><button type="button" onClick={onClose} aria-label="메뉴 닫기"><Icon name="close" /></button></div>
        <div className="carrier-drawer-profile"><span><Icon name="user" /></span><div><strong>운송인</strong><small>5톤 카고 · 수도권 기반</small></div></div>
        <nav><button type="button" onClick={onClose}>운행 홈</button><button type="button" onClick={onClose}>내 차량 정보</button><button type="button" onClick={onClose}>고객센터</button><a href="/shipper">화주/주선사 화면으로 전환</a></nav>
      </aside>
    </div>
  )
}

function CarrierScreen() {
  const [단계, set단계] = useState(0)
  const [확장오더, set확장오더] = useState(등록화물_목록[1]?.id ?? '')
  const [프로필열림, set프로필열림] = useState(false)
  const [선호조건, set선호조건] = useState<CarrierPreferences>(() => 선호조건읽기())
  const [매칭쿼리, set매칭쿼리] = useState('')
  const 초기매칭 = useCarrierCalls(운송인ID, 매칭쿼리)
  const [후속쿼리, set후속쿼리] = useState('')
  const 후속매칭 = useCarrierCalls(운송인ID, 후속쿼리)
  const [선택콜ID, set선택콜ID] = useState('')
  const [현재콜, set현재콜] = useState<계산후보 | undefined>()
  const [완료콜, set완료콜] = useState<계산후보[]>([])
  const [후속콜수, set후속콜수] = useState(0)
  const [운행진행률, set운행진행률] = useState(0)
  const [운행알림열림, set운행알림열림] = useState(false)
  const [메뉴열림, set메뉴열림] = useState(false)
  const [안내, set안내] = useState('')
  const [새로고침시각, set새로고침시각] = useState('방금 전')
  const [추천알림열림, set추천알림열림] = useState(false)
  const [확정중, set확정중] = useState(false)
  const [확정콜ID, set확정콜ID] = useState('')
  const [실패피드백, set실패피드백] = useState<ApiFeedbackRequest | null>(null)
  const [여정ID, set여정ID] = useState(() => crypto.randomUUID())
  const 확정잠금 = useRef(false)
  const 안내타이머 = useRef<number | undefined>(undefined)
  const 잠금타이머 = useRef<number | undefined>(undefined)

  const 후보로 = (calls: 추천콜상세[]): 계산후보[] => {
    const homeArea = 선호조건.세부지역 || '서울'
    return calls.map((콜) => {
      const 총소요_h = 콜.운행시간분 / 60
      return {
        콜,
        분해: {
          운임: 콜.예측_운임,
          유류비_적재: 콜.유류비원,
          유류비_공차: 콜.공차비원,
          톨비: 콜.톨비,
          실수령: 콜.예상실수령원,
          총소요_h,
          시간당_실수령: 총소요_h > 0 ? Math.round(콜.예상실수령원 / 총소요_h) : 0,
        },
        귀가: 귀가가능한가(콜.도착지, homeArea),
      }
    })
  }

  const 후보 = 후보로(초기매칭.목록)
  const 처리콜ID = new Set([...완료콜.map((item) => item.콜.콜ID), ...(현재콜 ? [현재콜.콜.콜ID] : [])])
  const 처리노선 = new Set([...완료콜.map((item) => 노선키(item.콜)), ...(현재콜 ? [노선키(현재콜.콜)] : [])])
  const 후속후보 = 후보로(후속매칭.목록).filter((item) => !처리콜ID.has(item.콜.콜ID) && !처리노선.has(노선키(item.콜)))

  const 선택후보 = 후보.find((item) => item.콜.콜ID === 선택콜ID)

  useEffect(() => {
    if (단계 !== 3 || 초기매칭.상태 === 'loading' || 후보.length === 0) {
      set추천알림열림(false)
      return
    }
    const timer = window.setTimeout(() => set추천알림열림(true), 2200)
    return () => window.clearTimeout(timer)
  }, [단계, 초기매칭.상태, 후보.length, 매칭쿼리])

  useEffect(() => {
    if (단계 !== 5 || !현재콜) return
    set운행진행률(0)
    set운행알림열림(false)
    const interval = window.setInterval(() => set운행진행률((value) => Math.min(100, value + 5)), 420)
    return () => window.clearInterval(interval)
  }, [단계, 현재콜])

  useEffect(() => {
    if (단계 !== 5 || !현재콜 || 운행진행률 < 55) return
    set운행알림열림(true)
    if (후속콜수 >= 2) return
    set후속쿼리(후속매칭쿼리문자열(
      선호조건,
      현재콜.콜.도착지,
      [...완료콜.map((item) => item.콜.콜ID), 현재콜.콜.콜ID],
      [...완료콜.map((item) => 노선키(item.콜)), 노선키(현재콜.콜)],
    ))
  }, [단계, 운행진행률, 현재콜, 후속콜수, 선호조건, 완료콜])

  useEffect(() => () => {
    if (안내타이머.current !== undefined) window.clearTimeout(안내타이머.current)
    if (잠금타이머.current !== undefined) window.clearTimeout(잠금타이머.current)
  }, [])

  const showNotice = (message: string) => {
    if (안내타이머.current !== undefined) window.clearTimeout(안내타이머.current)
    set안내(message)
    안내타이머.current = window.setTimeout(() => set안내(''), 2600)
  }

  const 이전 = () => {
    if (단계 >= 5) {
      showNotice('운행 중에는 이전 단계로 돌아갈 수 없어요.')
      return
    }
    if (단계 > 0) set단계((current) => current - 1)
  }

  const 기본다음 = () => {
    if (단계 === 2) {
      선호조건저장(선호조건)
      set매칭쿼리(매칭쿼리문자열(선호조건))
    }
    set단계((current) => Math.min(7, current + 1))
  }

  const 전체초기화 = () => {
    선호조건초기화()
    set단계(0); set확장오더(등록화물_목록[1]?.id ?? ''); set프로필열림(false)
    set선호조건(빈선호조건); set매칭쿼리(''); set후속쿼리(''); set선택콜ID('')
    set현재콜(undefined); set완료콜([]); set후속콜수(0); set운행진행률(0); set운행알림열림(false)
    set추천알림열림(false); set확정중(false); set확정콜ID(''); set실패피드백(null); set여정ID(crypto.randomUUID())
    set메뉴열림(false); set안내(''); set새로고침시각('방금 전'); 확정잠금.current = false
  }

  const 추천알림열기 = () => {
    const first = 후보[0]
    if (!first) return
    set선택콜ID(first.콜.콜ID)
    set추천알림열림(false)
    set단계(4)
  }

  const 콜확정 = () => {
    if (!선택후보) return
    if (확정콜ID === 선택후보.콜.콜ID) {
      set단계(5)
      return
    }
    if (확정잠금.current) return

    확정잠금.current = true
    set확정중(true)
    set확정콜ID(선택후보.콜.콜ID)
    set현재콜(선택후보)
    set단계(5)
    const request = 피드백요청(여정ID, 운송인ID, 선택후보.콜.콜ID, 'ACCEPT')
    void 피드백전송(request).then((성공) => {
      if (!성공) { set실패피드백(request); showNotice('ACCEPT 피드백 저장에 실패했지만 운행은 계속됩니다.') }
    }).finally(() => {
      잠금타이머.current = window.setTimeout(() => {
        확정잠금.current = false
        set확정중(false)
      }, 650)
    })
  }

  const 현재콜완료처리 = () => {
    if (!현재콜) return
    set완료콜((calls) => calls.some((item) => item.콜.콜ID === 현재콜.콜.콜ID) ? calls : [...calls, 현재콜])
  }

  const 운행알림열기 = () => {
    if (!현재콜 || 운행진행률 < 55) return
    현재콜완료처리()
    set운행알림열림(false)
    if (후속콜수 >= 2) {
      set단계(7)
      return
    }
    set단계(6)
  }

  const 복화수락 = () => {
    const next = 후속후보[0]
    if (!next || 확정잠금.current) return
    확정잠금.current = true
    set확정중(true)
    const request = 피드백요청(여정ID, 운송인ID, next.콜.콜ID, 'ACCEPT')
    const feedback = 피드백전송(request)
    set현재콜(next)
    set후속콜수((count) => count + 1)
    set후속쿼리('')
    set단계(5)
    void feedback.then((성공) => {
      if (!성공) { set실패피드백(request); showNotice('ACCEPT 피드백 저장에 실패했지만 다음 운행을 시작합니다.') }
    }).finally(() => {
      잠금타이머.current = window.setTimeout(() => { 확정잠금.current = false; set확정중(false) }, 650)
    })
  }

  const 집으로돌아가기 = () => {
    if (확정잠금.current) return
    확정잠금.current = true
    set확정중(true)
    현재콜완료처리()
    const rejected = 후속후보[0]
    const request = rejected ? 피드백요청(여정ID, 운송인ID, rejected.콜.콜ID, 'REJECT') : null
    const feedback = request ? 피드백전송(request) : Promise.resolve(true)
    set단계(7)
    void feedback.then((성공) => {
      if (!성공 && request) { set실패피드백(request); showNotice('REJECT 피드백 저장에 실패했지만 리포트로 이동했습니다.') }
    }).finally(() => {
      잠금타이머.current = window.setTimeout(() => { 확정잠금.current = false; set확정중(false) }, 650)
    })
  }

  const action = (() => {
    switch (단계) {
      case 0: return { label: '최적안 추천 받기', disabled: false, helper: undefined }
      case 1: return { label: '확인했어요', disabled: false, helper: undefined }
      case 2: return { label: '저장하고 오더 보기', disabled: !선호조건완료인가(선호조건), helper: !선호조건완료인가(선호조건) ? '모든 분류에서 하나 이상 선택해 주세요.' : '조건이 모두 선택됐어요.' }
      case 3: return null
      case 4: return { label: 확정콜ID ? '확정한 콜 경로 보기' : 확정중 ? '콜 확정 중…' : '이 콜 확정하기', disabled: !선택콜ID || 확정중, helper: !선택콜ID ? '운행할 콜을 하나 선택해 주세요.' : undefined }
      case 5: return { label: 운행진행률 >= 55 ? (후속콜수 >= 2 ? '운행 완료하고 리포트 보기' : '다음 콜 후보 보기') : `운행 중 · ${운행진행률}%`, disabled: 운행진행률 < 55, helper: 운행진행률 < 55 ? '55% 이상 운행하면 다음 콜을 확인할 수 있어요.' : undefined }
      case 6: return null
      default: return { label: '처음으로', disabled: false, helper: undefined }
    }
  })()

  const actionClick = 단계 === 4 ? 콜확정 : 단계 === 5 ? 운행알림열기 : 단계 === 7 ? 전체초기화 : 기본다음

  const 피드백재시도 = () => {
    if (!실패피드백) return
    const request = 실패피드백
    set실패피드백(null)
    void 피드백전송(request).then((성공) => {
      if (성공) showNotice('피드백을 다시 저장했어요.')
      else { set실패피드백(request); showNotice('피드백 저장에 다시 실패했어요.') }
    })
  }

  return (
    <div className="carrier-page">
      <div className="carrier-mobile-shell">
        <div className="carrier-app">
          <AppHeader 단계={단계} onBack={이전} onMenu={() => set메뉴열림(true)} onNotice={() => showNotice('새 알림이 없습니다.')} onHelp={() => showNotice('고객센터 연결을 준비하고 있어요.')} />
          <main className="carrier-content">
            {단계 === 0 && <StartScreen expandedOrder={확장오더} onToggleOrder={(id) => set확장오더((current) => current === id ? '' : id)} profileOpen={프로필열림} onToggleProfile={() => set프로필열림((open) => !open)} refreshedAt={새로고침시각} onRefresh={() => { set새로고침시각('방금 전'); showNotice('최신 오더를 확인했어요.') }} />}
            {단계 === 1 && <ProfileScreen />}
            {단계 === 2 && <PreferencesScreen value={선호조건} onChange={set선호조건} />}
            {단계 === 3 && <OrderBoardScreen candidates={후보} loading={초기매칭.상태 === 'loading'} preferences={선호조건} source={초기매칭.출처} matchQuery={매칭쿼리} errorMessage={초기매칭.오류메시지} onRetry={초기매칭.재시도} />}
            {단계 === 4 && <CompareScreen candidates={후보} selectedId={선택콜ID} onSelect={set선택콜ID} locked={Boolean(확정콜ID)} />}
            {단계 === 5 && <RouteScreen candidate={현재콜} progress={운행진행률} />}
            {단계 === 6 && <BackhaulScreen candidate={후속후보[0]} loading={후속매칭.상태 === 'loading'} source={후속매칭.출처} errorMessage={후속매칭.오류메시지} deciding={확정중} onRetry={후속매칭.재시도} onAccept={복화수락} onHome={집으로돌아가기} />}
            {단계 === 7 && <ReportScreen calls={완료콜} />}
          </main>
          {action && <StickyAction label={action.label} disabled={action.disabled} helper={action.helper} onClick={actionClick} pending={단계 === 4 && 확정중} />}
          {단계 === 3 && 추천알림열림 && <CandidateNotification count={Math.min(3, 후보.length)} onOpen={추천알림열기} />}
          {단계 === 5 && 운행알림열림 && <CandidateNotification count={후속콜수 >= 2 ? 완료콜.length + 1 : Math.max(1, 후속후보.length)} onOpen={운행알림열기} />}
          {안내 && <div className="carrier-toast" role="status"><span>{안내}</span>{실패피드백 && <button type="button" onClick={피드백재시도}>다시 시도</button>}</div>}
          <MenuDrawer open={메뉴열림} onClose={() => set메뉴열림(false)} />
        </div>
      </div>
    </div>
  )
}

export default CarrierScreen
