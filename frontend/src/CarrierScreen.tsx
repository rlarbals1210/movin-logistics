import { useMemo, useState } from 'react'
import { useCarrierCalls } from './features/carrier/useCarrierCalls'
import type { 추천콜상세 } from './features/carrier/carrierTypes'
import {
  경유_원_per_L,
  귀가가능한가,
  수익분해계산,
  자기점검,
  type 수익분해,
} from './features/carrier/economics'
import {
  지역_선택지,
  톤급_선택지,
  프로필읽기,
  프로필저장,
  type VehicleProfile,
} from './features/carrier/vehicleProfile'
import {
  결정전송,
  미선택사유_목록,
  type 결정,
  type 미선택사유,
} from './features/carrier/decisions'
import type { 톤급 } from './lib/types'

/**
 * 하단 탭.
 *
 * 회차·후보·실적은 아직 받쳐줄 데이터가 없다. 억지로 채우지 않고 "데이터 축적 중"
 * 안내를 보여준다 — 기획의 "데이터가 부족하면 억지로 예측하지 않는다" 원칙이다.
 * 셋을 한 id 로 묶으면 하단 탭 세 개가 동시에 활성으로 보이므로 id 는 따로 둔다.
 */
type CarrierTab = 'home' | 'settings' | 'profile' | '회차' | '후보' | '실적'

const 준비중_탭: CarrierTab[] = ['회차', '후보', '실적']

const 하단탭_목록: { id: CarrierTab; icon: string; label: string }[] = [
  { id: 'settings', icon: 'settings', label: '설정' },
  { id: 'home', icon: 'home', label: '홈' },
  { id: '회차', icon: 'swap_calls', label: '회차' },
  { id: '후보', icon: 'groups', label: '후보' },
  { id: '실적', icon: 'analytics', label: '실적' },
  { id: 'profile', icon: 'account_circle', label: '내 정보' },
]

/** 데모용 고정 운송인. 로그인이 없으므로 화면이 이 ID 로 조회한다 */
const 운송인ID = 'C-01'

const 원 = (v: number) => `${v.toLocaleString('ko-KR')}원`

자기점검()

function CallSkeleton() {
  return (
    <div className="flex flex-col gap-md" aria-busy="true" aria-label="추천 콜 불러오는 중">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-surface rounded-xl border border-tertiary-fixed p-md flex flex-col gap-sm">
          <div className="h-4 w-24 rounded bg-surface-variant animate-pulse" />
          <div className="h-3 w-full rounded bg-surface-variant animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-surface-variant animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function 분해줄({ 라벨, 값, 부호 }: { 라벨: string; 값: number; 부호?: '-' }) {
  return (
    <div className="flex justify-between">
      <span className="text-secondary">{라벨}</span>
      <span className={부호 === '-' ? 'text-on-surface-variant' : 'text-on-surface'}>
        {부호 === '-' ? '−' : ''}{원(값)}
      </span>
    </div>
  )
}

function CallCard({
  콜,
  분해,
  실수령1위,
  시간당1위,
  귀가,
  결정값,
  on선택,
  on미선택,
}: {
  콜: 추천콜상세
  분해: 수익분해
  실수령1위: boolean
  시간당1위: boolean
  귀가: boolean
  결정값?: 결정
  on선택: (콜ID: string) => void
  on미선택: (콜ID: string, 사유: 미선택사유) => void
}) {
  const [사유열림, set사유열림] = useState(false)
  const 거절됨 = 결정값?.선택여부 === false

  return (
    <div className={`bg-surface rounded-xl border shadow-sm p-md flex flex-col gap-sm transition-opacity ${거절됨 ? 'opacity-60' : ''} ${실수령1위 && !거절됨 ? 'border-primary' : 'border-tertiary-fixed'}`}>
      <div className="flex justify-between items-start gap-xs">
        <div className="font-headline-sm text-headline-sm text-on-surface">{콜.콜ID}</div>
        <div className="flex gap-xs shrink-0">
          {실수령1위 && (
            <span className="bg-primary-container text-on-primary-container px-2 py-1 rounded text-[10px] font-bold">실수령 1위</span>
          )}
          {시간당1위 && !실수령1위 && (
            <span className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold">시간당 1위</span>
          )}
        </div>
      </div>

      <div className="font-body-md text-body-md text-secondary flex items-start gap-xs">
        <span className="material-symbols-outlined text-[16px] mt-[2px]">location_on</span>
        <span>
          {콜.출발지}
          <span className="mx-xs text-tertiary">→</span>
          {콜.도착지}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-md gap-y-xs font-label-sm text-label-sm text-secondary">
        <span>적재 {콜.거리km.toLocaleString('ko-KR')}km</span>
        <span>공차 {콜.공차거리km.toLocaleString('ko-KR')}km</span>
        <span>총 {분해.총소요_h.toFixed(1)}시간</span>
      </div>

      <div className="flex flex-wrap gap-xs">
        <span className={`px-2 py-1 rounded text-[10px] font-bold ${귀가 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'}`}>
          {귀가 ? '귀가 가능' : '귀가 어려움'}
        </span>
        <span className="bg-surface-variant text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold">
          복화 가능성 {Math.round(콜.복화가능성 * 100)}%
        </span>
      </div>

      <div className="border-t border-outline-variant pt-sm">
        <div className="flex items-baseline justify-between">
          <span className="font-label-sm text-label-sm text-secondary">예상 실수령</span>
          <strong className="font-headline-sm text-headline-sm text-on-surface">{원(분해.실수령)}</strong>
        </div>
        <div className="flex items-baseline justify-between mt-xs">
          <span className="font-label-sm text-label-sm text-secondary">시간당</span>
          <span className="font-label-md text-label-md text-on-surface-variant">{원(분해.시간당_실수령)}/h</span>
        </div>
      </div>

      <details className="group">
        <summary className="cursor-pointer list-none font-label-sm text-label-sm text-primary flex items-center gap-xs">
          <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-90">chevron_right</span>
          비용 분해 보기
        </summary>
        <div className="mt-sm flex flex-col gap-xs font-label-sm text-label-sm">
          <분해줄 라벨="표면 운임" 값={분해.운임} />
          <분해줄 라벨="유류비 (적재)" 값={분해.유류비_적재} 부호="-" />
          <분해줄 라벨="유류비 (공차)" 값={분해.유류비_공차} 부호="-" />
          <분해줄 라벨="톨비" 값={분해.톨비} 부호="-" />
          <div className="flex justify-between border-t border-outline-variant pt-xs font-bold">
            <span className="text-on-surface">실수령</span>
            <span className="text-on-surface">{원(분해.실수령)}</span>
          </div>
          <div className="flex justify-between text-secondary">
            <span>탄소배출 (TTW)</span>
            <span>{분해.탄소배출_kg.toLocaleString('ko-KR')}kg CO₂</span>
          </div>
        </div>
      </details>

      {/* 최종 선택은 항상 운송인이 직접 한다. 자동 수락은 넣지 않는다 */}
      {결정값 === undefined && !사유열림 && (
        <div className="flex gap-sm">
          <button
            type="button"
            onClick={() => on선택(콜.콜ID)}
            className="flex-1 bg-primary-container text-on-primary-container font-label-md text-label-md font-bold py-2 rounded-lg transition-colors hover:bg-surface-container-high"
          >
            이 콜 선택
          </button>
          <button
            type="button"
            onClick={() => set사유열림(true)}
            className="px-4 bg-surface-variant text-on-surface-variant font-label-md text-label-md py-2 rounded-lg transition-colors hover:bg-surface-container-high border border-tertiary-fixed"
          >
            안 볼래요
          </button>
        </div>
      )}

      {결정값 === undefined && 사유열림 && (
        <div className="flex flex-col gap-sm">
          <p className="font-label-sm text-label-sm text-secondary">안 고른 이유를 알려주시면 다음 추천이 좋아집니다.</p>
          <div className="flex flex-wrap gap-xs">
            {미선택사유_목록.map((사유) => (
              <button
                key={사유}
                type="button"
                onClick={() => on미선택(콜.콜ID, 사유)}
                className="bg-surface-variant text-on-surface-variant font-label-sm text-label-sm px-3 py-1 rounded-full border border-tertiary-fixed transition-colors hover:bg-surface-container-high"
              >
                {사유}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set사유열림(false)}
            className="self-start font-label-sm text-label-sm text-secondary underline"
          >
            취소
          </button>
        </div>
      )}

      {결정값 !== undefined && (
        <div className={`flex items-center gap-xs font-label-md text-label-md rounded-lg py-2 px-3 ${
          결정값.선택여부 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-variant text-on-surface-variant'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {결정값.선택여부 ? 'check_circle' : 'do_not_disturb_on'}
          </span>
          {결정값.선택여부 ? '이 콜을 선택했습니다' : `미선택 · ${결정값.사유}`}
        </div>
      )}
    </div>
  )
}

function SettingsPanel({
  프로필,
  on톤급,
  on지역,
}: {
  프로필: VehicleProfile
  on톤급: (t: 톤급) => void
  on지역: (지역: string) => void
}) {
  return (
    <div className="flex flex-col gap-md">
      <div className="bg-surface rounded-xl border border-tertiary-fixed p-md flex flex-col gap-sm">
        <div className="font-headline-sm text-headline-sm text-on-surface">내 차량</div>
        <p className="font-body-md text-body-md text-secondary">
          톤급은 유류비 계산에 쓰입니다. 바꾸면 추천 콜의 실수령이 즉시 다시 계산됩니다.
        </p>
        <div className="flex gap-xs" role="group" aria-label="톤급 선택">
          {톤급_선택지.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => on톤급(t)}
              aria-pressed={프로필.톤급 === t}
              className={`flex-1 px-3 py-2 rounded-lg font-label-md text-label-md transition-colors ${
                프로필.톤급 === t
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {t}톤
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-tertiary-fixed p-md flex flex-col gap-sm">
        <div className="font-headline-sm text-headline-sm text-on-surface">귀가 희망 지역</div>
        <p className="font-body-md text-body-md text-secondary">
          도착지가 이 지역이면 귀가 가능으로 표시합니다.
        </p>
        <div className="flex flex-wrap gap-xs">
          {지역_선택지.map((지역) => (
            <button
              key={지역}
              type="button"
              onClick={() => on지역(지역)}
              aria-pressed={프로필.귀가희망지역 === 지역}
              className={`px-3 py-1 rounded-full font-label-sm text-label-sm transition-colors ${
                프로필.귀가희망지역 === 지역
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {지역}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function DecisionHistory({ 결정목록 }: { 결정목록: 결정[] }) {
  if (결정목록.length === 0) {
    return (
      <div className="bg-surface rounded-xl border border-tertiary-fixed p-lg flex flex-col items-center gap-sm text-center">
        <span className="material-symbols-outlined text-secondary">history</span>
        <p className="font-label-md text-label-md text-on-surface">아직 기록이 없습니다</p>
        <p className="font-body-md text-body-md text-secondary">
          홈에서 콜을 선택하거나 미선택 사유를 남기면 여기에 쌓입니다.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-sm">
      <div className="font-label-md text-label-md text-secondary tracking-wide">내 판단 기록</div>
      {[...결정목록].sort((a, b) => b.시각 - a.시각).map((d) => (
        <div key={d.콜ID} className="bg-surface rounded-xl border border-tertiary-fixed p-md flex items-center justify-between gap-sm">
          <div>
            <div className="font-label-md text-label-md text-on-surface">{d.콜ID}</div>
            <div className="font-label-sm text-label-sm text-secondary">
              {d.선택여부 ? '선택' : `미선택 · ${d.사유}`}
            </div>
          </div>
          <span className={`material-symbols-outlined ${d.선택여부 ? 'text-primary' : 'text-secondary'}`}>
            {d.선택여부 ? 'check_circle' : 'do_not_disturb_on'}
          </span>
        </div>
      ))}
      <p className="font-label-sm text-label-sm text-secondary">
        미선택 사유는 선호 데이터로 되돌아가 다음 추천 순서에 반영됩니다.
      </p>
    </div>
  )
}

function CarrierScreen() {
  const { 목록, 상태, 출처 } = useCarrierCalls(운송인ID)
  const [프로필, set프로필] = useState<VehicleProfile>(() => 프로필읽기())
  const [탭, set탭] = useState<CarrierTab>('home')
  const [결정목록, set결정목록] = useState<결정[]>([])

  const 톤급변경 = (t: 톤급) => {
    const 다음 = { ...프로필, 톤급: t }
    set프로필(다음)
    프로필저장(다음)
  }

  const 지역변경 = (지역: string) => {
    const 다음 = { ...프로필, 귀가희망지역: 지역 }
    set프로필(다음)
    프로필저장(다음)
  }

  const 결정기록 = (콜ID: string, 선택여부: boolean, 사유?: 미선택사유) => {
    const 값: 결정 = { 콜ID, 선택여부, 사유, 시각: Date.now() }
    set결정목록((이전) => [...이전.filter((d) => d.콜ID !== 콜ID), 값])
    결정전송(값)
  }

  /**
   * 기획 기준대로 실수령 내림차순으로 세운다.
   * 시간당 1위는 따로 뽑는다 — 둘이 갈리는 지점이 이 화면이 하려는 말이다.
   */
  const 후보 = useMemo(() => {
    const 계산됨 = 목록.map((콜) => ({
      콜,
      분해: 수익분해계산(콜, 프로필.톤급),
      귀가: 귀가가능한가(콜.도착지, 프로필.귀가희망지역),
    }))

    const 시간당최고 = 계산됨.reduce<string | null>(
      (best, c) =>
        best === null || c.분해.시간당_실수령 > (계산됨.find((x) => x.콜.콜ID === best)?.분해.시간당_실수령 ?? -Infinity)
          ? c.콜.콜ID
          : best,
      null,
    )

    const 정렬됨 = [...계산됨].sort((a, b) => b.분해.실수령 - a.분해.실수령)
    return { 정렬됨, 시간당최고 }
  }, [목록, 프로필])

  const 뒤집힘 =
    후보.정렬됨.length > 1 &&
    후보.시간당최고 !== null &&
    후보.정렬됨[0].콜.콜ID !== 후보.시간당최고

  return (
    <div className="bg-[#f2f2f2] text-on-background font-body-md min-h-screen">
      <nav className="fixed top-0 z-[200] flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop" aria-label="역할 선택">
        <div className="flex items-center">
          <span className="mr-xl text-headline-md font-black tracking-[-0.04em] text-on-surface">Mov!n</span>
          <div className="flex gap-lg">
            <a className="py-2 text-label-md text-secondary transition-colors hover:text-on-surface" href="/shipper">화주</a>
            <a className="border-b-2 border-primary py-2 text-label-md font-bold text-primary" href="/carrier">운송인</a>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <button type="button" aria-label="알림" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container">
            <span className="material-symbols-outlined text-on-surface" aria-hidden="true">notifications</span>
          </button>
          <button type="button" aria-label="설정" className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-container sm:flex">
            <span className="material-symbols-outlined text-on-surface" aria-hidden="true">settings</span>
          </button>
          <div className="ml-xs flex h-9 w-9 items-center justify-center rounded-full bg-on-secondary-fixed text-label-sm font-black text-primary-fixed" aria-label="운송인 프로필">운송</div>
        </div>
      </nav>

      <div className="flex min-h-screen items-center justify-center p-lg pt-[88px]">
        <div className="flex items-center gap-xl max-w-6xl w-full">
        {/* Left Side: Stepper Menu */}
        <div className="hidden md:flex flex-col gap-lg w-1/3 p-lg bg-surface rounded-xl shadow-sm border border-tertiary-fixed h-[600px] justify-center relative">
          <div className="font-headline-md text-headline-md text-on-surface mb-lg">운송 진행 상황</div>
          <div className="relative pl-8 border-l-2 border-surface-variant flex flex-col gap-8">
            {/* Step 1: Dispatch */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-surface border-2 border-primary-fixed flex items-center justify-center z-10">
                <span className="material-symbols-outlined text-primary-fixed" style={{ fontSize: '16px' }}>check</span>
              </div>
              <div className="font-label-md text-label-md text-on-surface-variant">오전 08:00</div>
              <div className="font-headline-sm text-headline-sm text-on-surface">배차 완료</div>
              <div className="font-body-md text-body-md text-secondary mt-xs">기사 배정 후 상차지로 이동 중입니다.</div>
            </div>
            {/* Step 2: Loading (Active) */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-primary-container border-2 border-primary-fixed flex items-center justify-center z-10 shadow-sm">
                <div className="w-3 h-3 bg-on-primary-container rounded-full"></div>
              </div>
              <div className="font-label-md text-label-md text-primary font-bold">오전 10:30</div>
              <div className="font-headline-sm text-headline-sm text-on-surface">상차 중</div>
              <div className="font-body-md text-body-md text-secondary mt-xs">물류창고에서 화물을 싣고 있습니다.</div>
            </div>
            {/* Step 3: Transit */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-surface border-2 border-surface-variant flex items-center justify-center z-10"></div>
              <div className="font-label-md text-label-md text-secondary-fixed-dim">대기</div>
              <div className="font-headline-sm text-headline-sm text-tertiary">운송 중</div>
            </div>
            {/* Step 4: Completion */}
            <div className="relative">
              <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-surface border-2 border-surface-variant flex items-center justify-center z-10"></div>
              <div className="font-label-md text-label-md text-secondary-fixed-dim">대기</div>
              <div className="font-headline-sm text-headline-sm text-tertiary">운송 완료</div>
            </div>
            {/* Active Line Overlay */}
            <div className="absolute left-[-2px] top-4 bottom-0 w-[2px] bg-primary-fixed z-0" style={{ height: '35%' }}></div>
          </div>
        </div>
        {/* Center: Smartphone Frame */}
        <div className="w-[375px] h-[812px] bg-background phone-frame flex flex-col mx-auto flex-shrink-0">
          <div className="notch"></div>
          {/* TopAppBar Container (Simulated inside phone) */}
          <div className="flex justify-between items-center px-margin-mobile py-md w-full bg-surface pt-[50px] z-50">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-surface" data-icon="menu">menu</span>
            </div>
            <div className="font-headline-sm-mobile text-headline-sm-mobile font-bold text-on-surface">
              Mov!n 운송인
            </div>
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-surface" data-icon="notifications">notifications</span>
            </div>
          </div>
          {/* Content Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-margin-mobile flex flex-col gap-md pb-[100px] bg-surface-container-lowest">
            {탭 === 'home' && (
              <>
                {/* 톤급이 바뀌면 유류비가 바뀌고 순위도 바뀔 수 있다. 계산의 전제라 화면 맨 위에 둔다 */}
                <div className="bg-surface rounded-xl border border-tertiary-fixed p-md flex items-center justify-between gap-sm">
                  <div>
                    <div className="font-label-sm text-label-sm text-secondary">내 차량</div>
                    <div className="font-label-md text-label-md text-on-surface">귀가 희망 {프로필.귀가희망지역}</div>
                  </div>
                  <div className="flex gap-xs" role="group" aria-label="톤급 선택">
                    {톤급_선택지.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => 톤급변경(t)}
                        aria-pressed={프로필.톤급 === t}
                        className={`px-3 py-1 rounded-lg font-label-sm text-label-sm transition-colors ${
                          프로필.톤급 === t
                            ? 'bg-primary-container text-on-primary-container font-bold'
                            : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
                        }`}
                      >
                        {t}t
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="font-label-md text-label-md text-secondary tracking-wide">추천 콜 · 실수령 순</div>
                  {상태 === 'ready' && <span className="text-label-sm text-secondary">{목록.length}건</span>}
                </div>

                {뒤집힘 && (
                  <div className="bg-[#fff9cc] border border-primary rounded-xl p-md font-body-md text-body-md text-on-surface">
                    실수령 1위와 시간당 수익 1위가 다릅니다. 공차거리와 소요시간까지 넣으면 순서가 바뀝니다.
                  </div>
                )}

                {상태 === 'loading' && <CallSkeleton />}

                {상태 !== 'loading' && 후보.정렬됨.map(({ 콜, 분해, 귀가 }, index) => (
                  <CallCard
                    key={콜.콜ID}
                    콜={콜}
                    분해={분해}
                    실수령1위={index === 0}
                    시간당1위={콜.콜ID === 후보.시간당최고}
                    귀가={귀가}
                    결정값={결정목록.find((d) => d.콜ID === 콜.콜ID)}
                    on선택={(콜ID) => 결정기록(콜ID, true)}
                    on미선택={(콜ID, 사유) => 결정기록(콜ID, false, 사유)}
                  />
                ))}

                {상태 !== 'loading' && (
                  <div className="mt-xs flex flex-col gap-xs font-label-sm text-label-sm text-secondary">
                    <p>
                      산출 근거 — 경유 {경유_원_per_L.toLocaleString('ko-KR')}원/L, 톤급별 연비·배출계수는 탄소 산정 기준표(TTW).
                      연비는 업계 평균 추정치입니다.
                    </p>
                    <p>
                      ※ 최종 기획안 초안의 유류비(부산→서울 7.4만원)와는 차이가 있습니다. 위 값은 탄소 산정 기준표의
                      연비 가정으로 재계산한 것입니다.
                    </p>
                    {출처 === '폴백' && <p>예시 데이터를 표시하고 있습니다.</p>}
                  </div>
                )}
              </>
            )}

            {탭 === 'settings' && (
              <SettingsPanel 프로필={프로필} on톤급={톤급변경} on지역={지역변경} />
            )}

            {탭 === 'profile' && <DecisionHistory 결정목록={결정목록} />}

            {준비중_탭.includes(탭) && (
              <div className="bg-surface rounded-xl border border-tertiary-fixed p-lg flex flex-col items-center gap-sm text-center">
                <span className="material-symbols-outlined text-secondary">database</span>
                <p className="font-label-md text-label-md text-on-surface">{탭} · 데이터 축적 중</p>
                <p className="font-body-md text-body-md text-secondary">
                  운행 이력이 쌓이면 열립니다. 지금은 추정으로 채우지 않습니다.
                </p>
              </div>
            )}
          </div>
          {/* BottomNavBar Container (Simulated inside phone) */}
          <nav aria-label="운송인 메뉴" className="absolute bottom-3 left-3 right-3 bg-surface rounded-xl shadow-lg border border-outline-variant flex justify-around items-center px-xs pb-safe py-2 z-50">
            {하단탭_목록.map(({ id, icon, label }) => {
              const 활성 = 탭 === id
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => set탭(id)}
                  aria-current={활성 ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center transition-all duration-200 scale-90 active:scale-75 ${
                    활성
                      ? 'bg-primary-container text-on-primary-container rounded-full px-4 py-1'
                      : 'text-on-secondary-container hover:bg-surface-variant rounded-lg p-1'
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    data-icon={icon}
                    style={활성 ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {icon}
                  </span>
                  <span className="font-label-sm text-label-sm mt-1">{label}</span>
                </button>
              )
            })}
          </nav>
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-[#1a1c1c] rounded-full z-[100] opacity-50"></div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default CarrierScreen
