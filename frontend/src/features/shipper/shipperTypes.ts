export type ShipperTabId = 'settings' | 'register' | 'compare' | 'report' | 'profile'

export type CallForm = {
  originRegion: string
  originDetail: string
  originCustom: string
  destinationRegion: string
  destinationDetail: string
  destinationCustom: string
  vehicle: string
  vehicleCustom: string
  cargoItem: string
  cargoItemCustom: string
  cargoDescription: string
  loadingDate: string
  loadingStartMinutes: number
  loadingEndMinutes: number
}

export type ScenarioResult = {
  tonnage: 5 | 11 | 25
  windowMinutes: 40 | 120 | 240 | 480 | 1440
  availableDrivers: number
  estimatedFare: number
  dispatchMinutes: number
  failureProbability: number
}

export type ShipperModelMetadata = {
  scenarioRows: number
  trainingRows: number
  acceptanceAuc: number
  failureAuc: number
}

export type ComparisonOptions = {
  allowVehicleSubstitution: boolean
  allowDateDelay: boolean
  relaxedWindowMinutes: ScenarioResult['windowMinutes']
}

export type DispatchDecision = 'current' | 'adjusted' | null

export type OperationLog = {
  date: string
  title: string
  detail: string
  status: '완료' | '응답 대기' | '분석'
}

export const emptyCallForm: CallForm = {
  originRegion: '',
  originDetail: '',
  originCustom: '',
  destinationRegion: '',
  destinationDetail: '',
  destinationCustom: '',
  vehicle: '',
  vehicleCustom: '',
  cargoItem: '',
  cargoItemCustom: '',
  cargoDescription: '',
  loadingDate: '',
  loadingStartMinutes: 540,
  loadingEndMinutes: 660,
}
