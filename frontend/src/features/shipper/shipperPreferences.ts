export type PreferenceGroupId = 'dispatch' | 'schedule' | 'carrier'

export type PreferenceSelections = Record<PreferenceGroupId, string[]>

type PreferenceGroup = {
  id: PreferenceGroupId
  number: string
  title: string
  description: string
  icon: string
  options: string[]
}

export const preferenceGroups: PreferenceGroup[] = [
  {
    id: 'dispatch',
    number: '01',
    title: '배차 결과에서 중요해요',
    description: '발주 시 주요 고려 항목을 선택해 주십시오.',
    icon: 'local_shipping',
    options: ['빠른 배차', '낮은 운임', '많은 후보'],
  },
  {
    id: 'schedule',
    number: '02',
    title: '가능한 상차 일정이에요',
    description: '실제 발주에서 조정할 수 있는 상차 시간대를 선택해 주세요.',
    icon: 'calendar_today',
    options: [
      '오전 상차 06:00~12:00',
      '오후 상차 12:00~18:00',
      '야간 상차 18:00~06:00',
      '일정 조정 가능',
    ],
  },
  {
    id: 'carrier',
    number: '03',
    title: '운송인 선택에서 중요해요',
    description: '콜 등록 시 최우선으로 비교할 결과 지표를 선택해 주십시오.',
    icon: 'badge',
    options: ['안전 기록', '정시성', '품목 경험'],
  },
]
