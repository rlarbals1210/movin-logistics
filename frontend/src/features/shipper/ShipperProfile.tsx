import { operationLogs, shipperReportMetrics } from './shipperData'
import { formatDate, getSelectedCargo, getSelectedLocation, getSelectedVehicle, minutesToTime } from './shipperModel'
import { preferenceGroups, type PreferenceSelections } from './shipperPreferences'
import type { CallForm, DispatchDecision, ShipperModelMetadata } from './shipperTypes'

type ShipperProfileProps = {
  selections: PreferenceSelections
  form: CallForm
  modelMetadata: ShipperModelMetadata
  decision: DispatchDecision
  onBackToMain: () => void
  onEditPreferences: () => void
}

function SelectionValue({ values }: { values: string[] }) {
  return values.length > 0
    ? <span className="font-bold text-on-surface">{values.join(' · ')}</span>
    : <span className="font-bold text-secondary">미선택</span>
}

function ShipperProfile({ selections, form, modelMetadata, decision, onBackToMain, onEditPreferences }: ShipperProfileProps) {
  const recentRoute = `${getSelectedLocation(form.originRegion, form.originDetail, form.originCustom) || '미입력'} → ${getSelectedLocation(form.destinationRegion, form.destinationDetail, form.destinationCustom) || '미입력'}`

  return (
    <section className="space-y-lg" aria-labelledby="profile-title">
      <div className="rounded-2xl border border-outline-variant bg-white p-xl">
        <div className="flex items-start justify-between gap-lg">
          <div>
            <h1 id="profile-title" className="text-[32px] font-black leading-tight tracking-[-0.03em] text-on-surface">내 정보</h1>
            <p className="mt-sm text-body-lg text-secondary">화주/주선사 기본정보와 분석에 사용된 데이터, 선호 조건, 최근 운영 기록을 관리합니다.</p>
          </div>
          <button
            type="button"
            onClick={onBackToMain}
            className="inline-flex min-h-11 shrink-0 items-center gap-sm rounded-full bg-on-secondary-fixed px-lg text-label-md font-black text-primary-fixed transition-colors hover:bg-inverse-surface"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">home</span>
            메인화면으로
          </button>
        </div>
        <div className="mt-xl grid grid-cols-2 gap-md">
          <div className="rounded-xl bg-surface-container-low p-lg">
            <p className="text-label-sm text-secondary">회사 정보</p>
            <p className="mt-sm text-headline-sm font-black text-on-surface">Mov!n 데모 화주/주선사</p>
            <p className="mt-xs text-body-md text-secondary">물류 운영팀 · 기업 정보 API 연결 전</p>
          </div>
          <div className="rounded-xl bg-surface-container-low p-lg">
            <p className="text-label-sm text-secondary">담당자 정보</p>
            <p className="mt-sm text-headline-sm font-black text-on-surface">김무빈</p>
            <p className="mt-xs text-body-md text-secondary">연락처·계정 정보 API 연결 전</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-lg">
        <section className="rounded-2xl border border-outline-variant bg-white p-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-headline-sm font-black text-on-surface">화주/주선사 선호 조건</h2>
              <p className="mt-xs text-body-md text-secondary">필수 설정에서 선택한 기준입니다.</p>
            </div>
            <button type="button" onClick={onEditPreferences} className="inline-flex min-h-11 items-center gap-sm rounded-full border border-outline px-lg text-label-md font-black text-on-surface hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
              선호 조건 수정
            </button>
          </div>
          <div className="mt-lg grid grid-cols-2 gap-md">
            {preferenceGroups.map((group) => (
              <div key={group.id} className="rounded-xl bg-surface-container-low p-md">
                <p className="text-label-sm text-secondary">{group.title}</p>
                <p className="mt-sm text-body-md"><SelectionValue values={selections[group.id]} /></p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-on-secondary-fixed p-xl text-secondary-fixed">
          <p className="text-label-sm text-secondary-fixed-dim">분석 데이터</p>
          <dl className="mt-lg space-y-md">
            {[
              ['분석 콜', `${shipperReportMetrics.analyzedCalls}건`],
              ['시간 제안', `${shipperReportMetrics.timeSuggestions}건`],
              ['학습 표본', `${modelMetadata.trainingRows.toLocaleString('ko-KR')}행`],
              ['시나리오', '톤급×시간창 15개'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border-[#444] pb-sm last:border-0">
                <dt className="text-body-md text-secondary-fixed-dim">{label}</dt>
                <dd className="text-body-md font-black text-primary-fixed">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-outline-variant bg-white p-xl">
        <h2 className="text-headline-sm font-black text-on-surface">최근 입력·선택 정보</h2>
        <dl className="mt-lg grid grid-cols-4 gap-x-lg gap-y-md">
          {[
            ['최근 노선', recentRoute],
            ['차량', getSelectedVehicle(form) || '미선택'],
            ['품목', getSelectedCargo(form) || '미선택'],
            ['상차 날짜', formatDate(form.loadingDate)],
            ['상차 시간', `${minutesToTime(form.loadingStartMinutes)}~${minutesToTime(form.loadingEndMinutes)}`],
            ['최근 선택', decision === 'adjusted' ? '조정안으로 등록' : decision === 'current' ? '현재 조건 유지' : '미선택'],
            ['운송인 응답', decision ? '응답 대기' : '등록 전'],
            ['데이터 갱신', '프론트 상태 실시간 반영'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-label-sm text-secondary">{label}</dt>
              <dd className="mt-xs text-body-md font-black text-on-surface">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-outline-variant bg-white p-xl">
        <h2 className="text-headline-sm font-black text-on-surface">최근 운영 기록</h2>
        <div className="mt-lg divide-y divide-outline-variant">
          {operationLogs.map((log) => (
            <div key={`${log.date}-${log.title}`} className="grid grid-cols-[70px_260px_minmax(0,1fr)_80px] items-center gap-md py-md first:pt-0 last:pb-0">
              <span className="text-label-sm font-bold text-secondary">{log.date}</span>
              <strong className="text-body-md text-on-surface">{log.title}</strong>
              <span className="text-body-md text-secondary">{log.detail}</span>
              <span className="text-right text-label-sm font-black text-primary">{log.status}</span>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

export default ShipperProfile
