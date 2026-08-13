export interface ApiMapPoint {
  label: string
  lat: number | null
  lng: number | null
}

export interface ApiPredictionSources {
  model: string | null
  supplyPool: string | null
  calculations: string | null
}

export interface ApiCarrierCall {
  callId: string
  origin: ApiMapPoint
  destination: ApiMapPoint
  pickupAt: string
  loadedDistanceKm: number
  emptyDistanceKm: number
  durationMinutes: number
  fareWon: number
  tollWon: number
  fuelCostWon: number
  emptyCostWon: number
  estimatedNetIncomeWon: number
  backhaulProbability: number
  tags: string[]
  warnings: string[]
  recommended: boolean
}

export interface ApiCarrierMatchesResponse {
  carrierId: string
  calls: ApiCarrierCall[]
  selectionValid: boolean
  matchedCallCount: number
  generatedAt: string
  predictionSources: ApiPredictionSources
}

export interface ApiFeedbackRequest {
  feedbackId: string
  journeyId: string
  carrierId: string
  callId: string
  action: 'ACCEPT' | 'REJECT'
  occurredAt: string
}

export interface ApiFeedbackResponse {
  recorded: boolean
  duplicate: boolean
  feedbackId: string
}
