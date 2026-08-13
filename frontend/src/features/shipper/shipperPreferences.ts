export type PreferenceGroupId = 'priority' | 'schedule'

export type PreferenceSelections = Record<PreferenceGroupId, string[]>

type PreferenceGroup = {
  id: PreferenceGroupId
  number: string
  title: string
  description: string
  icon: string
  options: string[]
  maxSelect: number
}

export const preferenceGroups: PreferenceGroup[] = [
  {
    id: 'priority',
    number: '01',
    title: '발주·콜 등록 시 최우선으로 고려할 항목을 선택해 주십시오.',
    description: '',
    icon: 'local_shipping',
    options: ['빠른 배차', '낮은 운임', '안전 기록', '정시성', '품목 경험'],
    maxSelect: 2,
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
    maxSelect: 1,
  },
]
