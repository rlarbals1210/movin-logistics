import { useMemo, useState } from 'react'
import { useCarrierCalls } from './features/carrier/useCarrierCalls'
import type { 추천콜상세 } from './features/carrier/carrierTypes'
import { 귀가가능한가, 수익분해계산, type 수익분해 } from './features/carrier/economics'
import { 결정전송 } from './features/carrier/decisions'
import {
  기본운송인,
  권역별_세부지역,
  등록화물_목록,
  복화후보_목록,
  선호시간_선택지,
  운송단계,
  우선조건_선택지,
  type 등록화물,
} from './features/carrier/carrierFlowData'
import {
  선호조건완료인가,
  선호조건읽기,
  선호조건저장,
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
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  helper?: string
}) {
  return (
    <footer className="carrier-sticky-action">
      {helper && <p>{helper}</p>}
      <button type="button" disabled={disabled} onClick={onClick}>{label}</button>
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
  분해: 수익분해
  귀가: boolean
}

function CallsLoading() {
  return <div className="carrier-loading-list" aria-label="오더 불러오는 중" aria-busy="true">{[0, 1, 2].map((n) => <div key={n}><span /><span /><span /></div>)}</div>
}

function OrderBoardScreen({ candidates, loading, preferences, source }: { candidates: 계산후보[]; loading: boolean; preferences: CarrierPreferences; source: 'api' | '폴백' }) {
  return (
    <div className="carrier-screen carrier-board-screen">
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
      {source === '폴백' && <p className="carrier-data-note">현재 예시 오더를 표시하고 있어요.</p>}
    </div>
  )
}

function CompareScreen({ candidates, selectedId, onSelect }: { candidates: 계산후보[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="carrier-screen carrier-compare-screen">
      <h1>추천 콜 후보<br />TOP 3</h1>
      <p className="carrier-lead">운임만 보지 않고 실제 남는 금액으로 비교했어요.</p>
      <div className="carrier-candidate-list" role="radiogroup" aria-label="콜 후보 선택">
        {candidates.slice(0, 3).map(({ 콜, 분해, 귀가 }, index) => {
          const selected = selectedId === 콜.콜ID
          return (
            <button key={콜.콜ID} type="button" role="radio" aria-checked={selected} onClick={() => onSelect(콜.콜ID)} className={`carrier-candidate-card ${selected ? 'is-selected' : ''}`}>
              <span className="carrier-candidate-rank">{index + 1}</span>
              <div className="carrier-candidate-copy">
                <small>{index === 0 ? '내 조건에 가장 적합' : index === 1 ? '수익 균형형' : '짧은 공차 우선'}</small>
                <h2>{콜.출발지.split(' ').slice(0, 2).join(' ')} <span>→</span> {콜.도착지.split(' ').slice(0, 2).join(' ')}</h2>
                <div className="carrier-net-earnings"><span>예상 실수령</span><strong>{원(분해.실수령)}</strong></div>
                <p>운임 {원(콜.예측_운임)} · 공차 {콜.공차거리km.toLocaleString('ko-KR')}km · 총 {분해.총소요_h.toFixed(1)}시간</p>
                <div className="carrier-fact-row"><span>복화 {Math.round(콜.복화가능성 * 100)}%</span><span>{귀가 ? '귀가 가능' : '귀가 경로 아님'}</span><span>{원(분해.시간당_실수령)}/h</span></div>
              </div>
              <span className="carrier-radio"><span /></span>
            </button>
          )
        })}
      </div>
      <p className="carrier-inline-note"><Icon name="info" size={18} /> 최종 선택은 운송인이 직접 결정합니다.</p>
    </div>
  )
}

function RouteMap() {
  return (
    <div className="carrier-route-map" aria-label="현재 위치에서 상차지, 하차지까지의 이동 경로 도식">
      <svg viewBox="0 0 340 230" role="img">
        <path className="street major" d="M-20 185C45 160 72 177 118 135S230 72 360 42" />
        <path className="street" d="M14 30C82 72 108 98 164 104s103-35 178-10M5 118c80-20 124 12 171 42s98 19 165 2M82-10c10 58-14 99-6 154s50 71 59 104M250-10c-16 58 8 86 2 137s-31 79-29 121" />
        <path className="route-shadow" d="M38 184C77 164 82 152 119 146c38-6 46-51 77-63 31-12 58 8 104-42" />
        <path className="route-line" d="M38 184C77 164 82 152 119 146c38-6 46-51 77-63 31-12 58 8 104-42" />
        <circle className="route-current" cx="38" cy="184" r="8" />
        <circle className="route-pickup" cx="119" cy="146" r="9" />
        <circle className="route-dropoff" cx="300" cy="41" r="9" />
      </svg>
      <span className="map-label current">현위치</span><span className="map-label pickup">상차</span><span className="map-label dropoff">하차</span>
    </div>
  )
}

function RouteScreen({ candidate }: { candidate?: 계산후보 }) {
  if (!candidate) return <CallsLoading />
  const { 콜, 분해 } = candidate
  return (
    <div className="carrier-screen carrier-route-screen">
      <h1>이동 경로를<br />확인해 주세요</h1>
      <div className="carrier-route-summary"><strong>{콜.출발지.split(' ').slice(0, 2).join(' ')} → {콜.도착지.split(' ').slice(0, 2).join(' ')}</strong><span>{콜.거리km.toLocaleString('ko-KR')}km · 약 {분해.총소요_h.toFixed(1)}시간</span></div>
      <RouteMap />
      <div className="carrier-route-timeline">
        <div><span className="timeline-dot current" /><small>현재 위치</small><strong>수도권 차고지</strong><b>지금</b></div>
        <div><span className="timeline-dot pickup" /><small>상차</small><strong>{콜.출발지}</strong><b>+ {콜.공차거리km.toLocaleString('ko-KR')}km</b></div>
        <div><span className="timeline-dot dropoff" /><small>하차</small><strong>{콜.도착지}</strong><b>+ {콜.거리km.toLocaleString('ko-KR')}km</b></div>
      </div>
      <div className="carrier-route-metrics"><span><Icon name="clock" size={19} /><small>예상 소요</small><strong>{분해.총소요_h.toFixed(1)}시간</strong></span><span><Icon name="won" size={19} /><small>예상 실수령</small><strong>{원(분해.실수령)}</strong></span></div>
    </div>
  )
}

function BackhaulScreen({ choice, onChoice }: { choice: string; onChoice: (id: string) => void }) {
  return (
    <div className="carrier-screen carrier-backhaul-screen">
      <h1>도착지 근처<br />복화 콜이 있어요</h1>
      <p className="carrier-lead">돌아오는 길의 공차를 줄일 수 있는 화물입니다.</p>
      <div className="carrier-backhaul-list" role="radiogroup" aria-label="복화 콜 선택">
        {복화후보_목록.map((call, index) => {
          const selected = choice === call.id
          return (
            <button key={call.id} type="button" role="radio" aria-checked={selected} onClick={() => onChoice(call.id)} className={selected ? 'is-selected' : ''}>
              <div><small>{index === 0 ? '가장 가까운 복화' : '운임 우선 복화'}</small><strong>{call.출발지.split(' ').slice(0, 2).join(' ')} → {call.도착지.split(' ').slice(0, 2).join(' ')}</strong><p>{call.거리km}km · 공차 {call.공차거리km}km · {call.상차시간}</p><span>{call.화물}</span></div>
              <b>{원(call.예상운임)}</b><span className="carrier-radio"><span /></span>
            </button>
          )
        })}
        <button type="button" role="radio" aria-checked={choice === 'none'} onClick={() => onChoice('none')} className={choice === 'none' ? 'is-selected' : ''}>
          <div><small>이번에는 쉬어가기</small><strong>복화 없이 차고지로 복귀</strong><p>추가 상차 없이 운행을 마칩니다.</p></div>
          <span className="carrier-radio"><span /></span>
        </button>
      </div>
    </div>
  )
}

function ReportScreen({ candidate, backhaulChoice }: { candidate?: 계산후보; backhaulChoice: string }) {
  if (!candidate) return <CallsLoading />
  const returnCall = 복화후보_목록.find((item) => item.id === backhaulChoice)
  const gross = candidate.콜.예측_운임 + (returnCall?.예상운임 ?? 0)
  const net = candidate.분해.실수령 + Math.round((returnCall?.예상운임 ?? 0) * 0.82)
  const totalDistance = candidate.콜.거리km + candidate.콜.공차거리km + (returnCall?.거리km ?? 0) + (returnCall?.공차거리km ?? 0)
  const emptySaved = returnCall ? Math.max(0, 104 - returnCall.공차거리km) : 0
  return (
    <div className="carrier-screen carrier-report-screen">
      <div className="carrier-report-check"><Icon name="check" size={28} /></div>
      <h1>오늘 운행을<br />완료했어요</h1>
      <p className="carrier-lead">본 운송{ returnCall ? '과 복화 운송까지' : '을' } 안전하게 마쳤습니다.</p>
      <div className="carrier-report-hero"><small>오늘 예상 실수령</small><strong>{원(net)}</strong><span>총 운임 {원(gross)}</span></div>
      <div className="carrier-report-grid">
        <div><Icon name="route" size={20} /><small>총 이동거리</small><strong>{Math.round(totalDistance).toLocaleString('ko-KR')}km</strong></div>
        <div><Icon name="clock" size={20} /><small>총 운행시간</small><strong>{(candidate.분해.총소요_h + (returnCall ? 3.1 : 0)).toFixed(1)}시간</strong></div>
        <div><Icon name="truck" size={20} /><small>공차 절감</small><strong>{emptySaved}km</strong></div>
        <div><Icon name="chart" size={20} /><small>운송 건수</small><strong>{returnCall ? 2 : 1}건</strong></div>
      </div>
      <section className="carrier-report-routes">
        <h2>운행 내역</h2>
        <div><span>본 운송</span><strong>{candidate.콜.출발지.split(' ').slice(0, 2).join(' ')} → {candidate.콜.도착지.split(' ').slice(0, 2).join(' ')}</strong><b>{원(candidate.콜.예측_운임)}</b></div>
        {returnCall && <div><span>복화</span><strong>{returnCall.출발지.split(' ').slice(0, 2).join(' ')} → {returnCall.도착지.split(' ').slice(0, 2).join(' ')}</strong><b>{원(returnCall.예상운임)}</b></div>}
      </section>
      <p className="carrier-data-note">실수령은 유류비와 톨비를 반영한 예상값입니다.</p>
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
        <nav><button type="button" onClick={onClose}>운행 홈</button><button type="button" onClick={onClose}>내 차량 정보</button><button type="button" onClick={onClose}>고객센터</button><a href="/shipper">화주 화면으로 전환</a></nav>
      </aside>
    </div>
  )
}

function CarrierScreen() {
  const { 목록, 상태, 출처 } = useCarrierCalls(운송인ID)
  const [단계, set단계] = useState(0)
  const [확장오더, set확장오더] = useState(등록화물_목록[1]?.id ?? '')
  const [프로필열림, set프로필열림] = useState(false)
  const [선호조건, set선호조건] = useState<CarrierPreferences>(() => 선호조건읽기())
  const [선택콜ID, set선택콜ID] = useState('')
  const [복화선택, set복화선택] = useState('')
  const [메뉴열림, set메뉴열림] = useState(false)
  const [안내, set안내] = useState('')
  const [새로고침시각, set새로고침시각] = useState('방금 전')

  const 후보 = useMemo<계산후보[]>(() => {
    const homeArea = 선호조건.세부지역 || '서울'
    return 목록
      .map((콜) => ({
        콜,
        분해: 수익분해계산(콜, 기본운송인.톤급),
        귀가: 귀가가능한가(콜.도착지, homeArea),
      }))
      .sort((a, b) => b.분해.시간당_실수령 - a.분해.시간당_실수령)
  }, [목록, 선호조건.세부지역])

  const 선택후보 = 후보.find((item) => item.콜.콜ID === 선택콜ID)

  const showNotice = (message: string) => {
    set안내(message)
    window.setTimeout(() => set안내(''), 2200)
  }

  const 이전 = () => {
    if (단계 > 0) set단계((current) => current - 1)
  }

  const 다음 = () => {
    if (단계 === 2) 선호조건저장(선호조건)
    if (단계 === 5 && 선택후보) {
      결정전송({ 콜ID: 선택후보.콜.콜ID, 선택여부: true, 시각: Date.now() })
    }
    if (단계 === 7) {
      set단계(0)
      set선택콜ID('')
      set복화선택('')
      set확장오더(등록화물_목록[1]?.id ?? '')
      return
    }
    set단계((current) => Math.min(7, current + 1))
  }

  const action = (() => {
    switch (단계) {
      case 0: return { label: '최적안 추천 받기', disabled: false, helper: undefined }
      case 1: return { label: '확인했어요', disabled: false, helper: undefined }
      case 2: return { label: '저장하고 오더 보기', disabled: !선호조건완료인가(선호조건), helper: !선호조건완료인가(선호조건) ? '모든 분류에서 하나 이상 선택해 주세요.' : '조건이 모두 선택됐어요.' }
      case 3: return { label: '추천 후보 3개 비교하기', disabled: 상태 === 'loading', helper: undefined }
      case 4: return { label: '선택한 콜 경로 보기', disabled: !선택콜ID, helper: !선택콜ID ? '운행할 콜을 하나 선택해 주세요.' : undefined }
      case 5: return { label: '이 경로로 운행하기', disabled: !선택후보, helper: undefined }
      case 6: return { label: '복화 콜 결정하기', disabled: !복화선택, helper: !복화선택 ? '복화 여부를 선택해 주세요.' : undefined }
      default: return { label: '새 운행 시작', disabled: false, helper: undefined }
    }
  })()

  return (
    <div className="carrier-page">
      <div className="carrier-mobile-shell">
        <div className="carrier-app">
          <AppHeader 단계={단계} onBack={이전} onMenu={() => set메뉴열림(true)} onNotice={() => showNotice('새 알림이 없습니다.')} onHelp={() => showNotice('고객센터 연결을 준비하고 있어요.')} />
          <main className="carrier-content">
            {단계 === 0 && <StartScreen expandedOrder={확장오더} onToggleOrder={(id) => set확장오더((current) => current === id ? '' : id)} profileOpen={프로필열림} onToggleProfile={() => set프로필열림((open) => !open)} refreshedAt={새로고침시각} onRefresh={() => { set새로고침시각('방금 전'); showNotice('최신 오더를 확인했어요.') }} />}
            {단계 === 1 && <ProfileScreen />}
            {단계 === 2 && <PreferencesScreen value={선호조건} onChange={set선호조건} />}
            {단계 === 3 && <OrderBoardScreen candidates={후보} loading={상태 === 'loading'} preferences={선호조건} source={출처} />}
            {단계 === 4 && <CompareScreen candidates={후보} selectedId={선택콜ID} onSelect={set선택콜ID} />}
            {단계 === 5 && <RouteScreen candidate={선택후보} />}
            {단계 === 6 && <BackhaulScreen choice={복화선택} onChoice={set복화선택} />}
            {단계 === 7 && <ReportScreen candidate={선택후보} backhaulChoice={복화선택} />}
          </main>
          <StickyAction label={action.label} disabled={action.disabled} helper={action.helper} onClick={다음} />
          {안내 && <div className="carrier-toast" role="status">{안내}</div>}
          <MenuDrawer open={메뉴열림} onClose={() => set메뉴열림(false)} />
        </div>
      </div>
    </div>
  )
}

export default CarrierScreen
