import { post } from '../../lib/api'
import type { ApiFeedbackRequest, ApiFeedbackResponse } from './carrierApiTypes'

/** 피드백 저장 실패는 운행 상태 전환과 독립적이다. */
export async function 피드백전송(value: ApiFeedbackRequest): Promise<boolean> {
  try {
    await post<ApiFeedbackResponse>('/api/v1/matches/feedback', value)
    return true
  } catch {
    return false
  }
}

export function 피드백요청(
  journeyId: string,
  carrierId: string,
  callId: string,
  action: 'ACCEPT' | 'REJECT',
): ApiFeedbackRequest {
  return {
    feedbackId: `${journeyId}:${callId}:${action}`,
    journeyId,
    carrierId,
    callId,
    action,
    occurredAt: new Date().toISOString(),
  }
}
