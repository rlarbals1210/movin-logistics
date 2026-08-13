import { useEffect, useState } from 'react'
import { toPredictions } from '../../lib/adapters'
import { post } from '../../lib/api'
import type { 모델지표, 화주시나리오 } from '../../lib/types'
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

function toScenarioResult(scenario: 화주시나리오): ScenarioResult {
  return {
    tonnage: scenario.톤급,
    windowMinutes: scenario.시간창_분,
    availableDrivers: scenario.수락가능차주,
    estimatedFare: scenario.예측_운임,
    dispatchMinutes: scenario.예측_배차분,
    failureProbability: scenario.유찰확률,
  }
}

function toModelMetadata(metrics: 모델지표, scenarioRows: number): ShipperModelMetadata {
  return {
    scenarioRows,
    trainingRows: metrics.학습행수,
    acceptanceAuc: metrics.수락예측_AUC,
    failureAuc: metrics.유찰예측_AUC,
  }
}

function scenarioKey(scenario: Pick<ScenarioResult, 'tonnage' | 'windowMinutes'>) {
  return `${scenario.tonnage}:${scenario.windowMinutes}`
}

/** API에 일부 조합만 있어도 누락된 축만 기존 15개 폴백으로 채운다. */
function withMissingFallbacks(apiScenarios: ScenarioResult[]): ScenarioResult[] {
  const byKey = new Map(apiScenarios.map((scenario) => [scenarioKey(scenario), scenario]))
  return fallbackScenarios.map((fallback) => byKey.get(scenarioKey(fallback)) ?? fallback)
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

    post<unknown>('/v1/matches/shipper', {})
      .then((raw) => {
        if (controller.signal.aborted) return
        const predictions = toPredictions(raw)
        const apiScenarios = predictions.화주_시나리오.map(toScenarioResult)
        const hasApiScenarios = apiScenarios.length > 0

        setState({
          scenarios: hasApiScenarios ? withMissingFallbacks(apiScenarios) : fallbackScenarios,
          modelMetadata: toModelMetadata(
            predictions.모델지표,
            hasApiScenarios ? apiScenarios.length : fallbackScenarios.length,
          ),
          상태: 'ready',
          출처: hasApiScenarios ? 'api' : '폴백',
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
