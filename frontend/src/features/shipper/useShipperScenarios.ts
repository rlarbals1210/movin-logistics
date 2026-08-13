import { useEffect, useState } from 'react'
import { post } from '../../lib/api'
import { modelMetadata as fallbackModelMetadata, scenarioResults as fallbackScenarios } from './shipperData'
import type { ScenarioResult, ShipperModelMetadata } from './shipperTypes'

export type ShipperScenarioLoadingState = 'loading' | 'ready' | 'error'
export type ShipperScenarioSource = 'api' | '폴백'

export interface ShipperScenariosState {
  scenarios: ScenarioResult[]
  modelMetadata: ShipperModelMetadata
  상태: ShipperScenarioLoadingState
  출처: ShipperScenarioSource
}

interface ApiShipperScenario {
  tonnage: ScenarioResult['tonnage']
  timeWindowMinutes: ScenarioResult['windowMinutes']
  availableDrivers: number
  estimatedFareWon: number
  estimatedDispatchMinutes: number
  failureProbability: number
}

interface ApiShipperResponse {
  shipperScenarios: ApiShipperScenario[]
  modelMetrics: { trainingRows: number; acceptanceAuc: number; failureAuc: number }
}

function api응답인가(value: unknown): value is ApiShipperResponse {
  if (typeof value !== 'object' || value === null) return false
  const response = value as Partial<ApiShipperResponse>
  return Array.isArray(response.shipperScenarios) && response.shipperScenarios.length > 0 &&
    typeof response.modelMetrics?.trainingRows === 'number' &&
    typeof response.modelMetrics.acceptanceAuc === 'number' &&
    typeof response.modelMetrics.failureAuc === 'number'
}

export function useShipperScenarios(): ShipperScenariosState {
  const [state, setState] = useState<ShipperScenariosState>({
    scenarios: fallbackScenarios,
    modelMetadata: fallbackModelMetadata,
    상태: 'loading',
    출처: '폴백',
  })

  useEffect(() => {
    const controller = new AbortController()

    setState({
      scenarios: fallbackScenarios,
      modelMetadata: fallbackModelMetadata,
      상태: 'loading',
      출처: '폴백',
    })

    post<unknown>('/api/v1/matches/shipper', {}, { signal: controller.signal })
      .then((raw) => {
        if (controller.signal.aborted) return
        if (!api응답인가(raw)) throw new Error('INVALID_API_RESPONSE')

        setState({
          scenarios: raw.shipperScenarios.map((scenario) => ({
            tonnage: scenario.tonnage,
            windowMinutes: scenario.timeWindowMinutes,
            availableDrivers: scenario.availableDrivers,
            estimatedFare: scenario.estimatedFareWon,
            dispatchMinutes: scenario.estimatedDispatchMinutes,
            failureProbability: scenario.failureProbability,
          })),
          modelMetadata: { ...raw.modelMetrics, scenarioRows: raw.shipperScenarios.length },
          상태: 'ready',
          출처: 'api',
        })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setState({
          scenarios: fallbackScenarios,
          modelMetadata: fallbackModelMetadata,
          상태: 'error',
          출처: '폴백',
        })
      })

    return () => controller.abort()
  }, [])

  return state
}
