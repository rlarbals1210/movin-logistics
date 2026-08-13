import type { 추천콜상세 } from './carrierTypes'
import type { ApiCarrierCall, ApiCarrierMatchesResponse } from './carrierApiTypes'

function 객체인가(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function 유한수(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function 문자열배열(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function 좌표점인가(value: unknown): boolean {
  if (!객체인가(value) || typeof value.label !== 'string') return false
  return (value.lat === null || 유한수(value.lat)) && (value.lng === null || 유한수(value.lng))
}

function api콜인가(value: unknown): value is ApiCarrierCall {
  if (!객체인가(value)) return false
  return (
    typeof value.callId === 'string' &&
    (value.tonnage === 5 || value.tonnage === 11 || value.tonnage === 25) &&
    좌표점인가(value.origin) &&
    좌표점인가(value.destination) &&
    typeof value.pickupAt === 'string' &&
    ['loadedDistanceKm', 'emptyDistanceKm', 'durationMinutes', 'fareWon', 'tollWon', 'fuelCostWon', 'emptyCostWon', 'estimatedNetIncomeWon', 'backhaulProbability'].every((key) => 유한수(value[key])) &&
    문자열배열(value.tags) &&
    문자열배열(value.warnings) &&
    typeof value.recommended === 'boolean'
  )
}

function 응답인가(value: unknown): value is ApiCarrierMatchesResponse {
  if (!객체인가(value)) return false
  return (
    typeof value.carrierId === 'string' &&
    Array.isArray(value.calls) &&
    value.calls.every(api콜인가) &&
    typeof value.selectionValid === 'boolean' &&
    유한수(value.matchedCallCount) &&
    typeof value.generatedAt === 'string' &&
    객체인가(value.predictionSources)
  )
}

function 날짜표시(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '시간 확인 중'
  return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
}

function 화면콜로(call: ApiCarrierCall): 추천콜상세 {
  return {
    콜ID: call.callId,
    톤급: call.tonnage,
    출발지: call.origin.label,
    도착지: call.destination.label,
    거리km: call.loadedDistanceKm,
    예측_운임: call.fareWon,
    톨비: call.tollWon,
    표준소요_h: call.durationMinutes / 60,
    공차거리km: call.emptyDistanceKm,
    복화가능성: call.backhaulProbability,
    상차시각: 날짜표시(call.pickupAt),
    상차ISO: call.pickupAt,
    출발좌표: call.origin.lat === null || call.origin.lng === null ? null : { lat: call.origin.lat, lng: call.origin.lng },
    도착좌표: call.destination.lat === null || call.destination.lng === null ? null : { lat: call.destination.lat, lng: call.destination.lng },
    운행시간분: call.durationMinutes,
    유류비원: call.fuelCostWon,
    공차비원: call.emptyCostWon,
    예상실수령원: call.estimatedNetIncomeWon,
    태그: [...call.tags],
    경고: [...call.warnings],
    추천여부: call.recommended,
  }
}

export const 결정론적데모응답: ApiCarrierMatchesResponse = {
  carrierId: 'C-01', selectionValid: true, matchedCallCount: 3,
  generatedAt: '2026-08-13T12:00:00+09:00',
  predictionSources: { model: null, supplyPool: 'deterministicDemoSeed:carrier-v1', calculations: 'deterministicRules:cost-v1' },
  calls: [
    { callId: 'CALL-1042', tonnage: 5, origin: { label: '경기 화성시 향남읍', lat: 37.1326, lng: 126.9202 }, destination: { label: '충북 청주시 흥덕구', lat: 36.6424, lng: 127.429 }, pickupAt: '2026-08-13T13:00:00+09:00', loadedDistanceKm: 118.4, emptyDistanceKm: 12.5, durationMinutes: 141, fareWon: 352000, tollWon: 6800, fuelCostWon: 32355, emptyCostWon: 2684, estimatedNetIncomeWon: 310161, backhaulProbability: 0.62, tags: ['공차 30km 이내', '8시간 이내', '복화 가능성 높음'], warnings: [], recommended: true },
    { callId: 'CALL-1113', tonnage: 5, origin: { label: '부산 강서구 미음동', lat: 35.1293, lng: 128.876 }, destination: { label: '전남 광양시 황금동', lat: 34.9416, lng: 127.6959 }, pickupAt: '2026-08-13T15:00:00+09:00', loadedDistanceKm: 164.2, emptyDistanceKm: 38.4, durationMinutes: 202, fareWon: 428000, tollWon: 9700, fuelCostWon: 44871, emptyCostWon: 8245, estimatedNetIncomeWon: 365184, backhaulProbability: 0.44, tags: ['8시간 이내'], warnings: ['공차거리 주의'], recommended: false },
    { callId: 'CALL-1087', tonnage: 5, origin: { label: '인천 서구 가좌동', lat: 37.4892, lng: 126.6778 }, destination: { label: '경북 구미시 산동읍', lat: 36.1718, lng: 128.4315 }, pickupAt: '2026-08-13T12:30:00+09:00', loadedDistanceKm: 287.6, emptyDistanceKm: 142, durationMinutes: 428, fareWon: 615000, tollWon: 18400, fuelCostWon: 78593, emptyCostWon: 30489, estimatedNetIncomeWon: 487518, backhaulProbability: 0.21, tags: ['8시간 이내'], warnings: ['공차거리 주의', '복화 가능성 낮음'], recommended: false },
  ],
}

const 후속데모콜: ApiCarrierCall[] = [
  { callId: 'CALL-2011', tonnage: 5, origin: { label: '충북 청주시 흥덕구', lat: 36.6424, lng: 127.429 }, destination: { label: '경기 안산시 단원구', lat: 37.3183, lng: 126.8157 }, pickupAt: '2026-08-13T18:00:00+09:00', loadedDistanceKm: 132, emptyDistanceKm: 8, durationMinutes: 176, fareWon: 300000, tollWon: 8200, fuelCostWon: 36065, emptyCostWon: 1718, estimatedNetIncomeWon: 254017, backhaulProbability: 0.71, tags: ['현재 위치 8km', '복화 가능성 높음'], warnings: [], recommended: true },
  { callId: 'CALL-2012', tonnage: 5, origin: { label: '충북 진천군 이월면', lat: 36.9279, lng: 127.4311 }, destination: { label: '인천 서구 오류동', lat: 37.592, lng: 126.6257 }, pickupAt: '2026-08-13T19:00:00+09:00', loadedDistanceKm: 156, emptyDistanceKm: 25, durationMinutes: 211, fareWon: 330000, tollWon: 9400, fuelCostWon: 42622, emptyCostWon: 5368, estimatedNetIncomeWon: 272610, backhaulProbability: 0.58, tags: ['공차 30km 이내', '복화 가능성 높음'], warnings: [], recommended: false },
  { callId: 'CALL-3011', tonnage: 5, origin: { label: '경기 안산시 단원구', lat: 37.3183, lng: 126.8157 }, destination: { label: '인천 남동구 고잔동', lat: 37.3949, lng: 126.6973 }, pickupAt: '2026-08-13T21:30:00+09:00', loadedDistanceKm: 31, emptyDistanceKm: 5, durationMinutes: 62, fareWon: 145000, tollWon: 0, fuelCostWon: 8472, emptyCostWon: 1074, estimatedNetIncomeWon: 135454, backhaulProbability: 0.35, tags: ['현재 위치 5km', '짧은 운행'], warnings: [], recommended: true },
  { callId: 'CALL-3012', tonnage: 5, origin: { label: '경기 시흥시 정왕동', lat: 37.3392, lng: 126.7335 }, destination: { label: '경기 용인시 기흥구', lat: 37.2804, lng: 127.1147 }, pickupAt: '2026-08-13T22:00:00+09:00', loadedDistanceKm: 58, emptyDistanceKm: 14, durationMinutes: 94, fareWon: 190000, tollWon: 2800, fuelCostWon: 15851, emptyCostWon: 3006, estimatedNetIncomeWon: 168343, backhaulProbability: 0.29, tags: ['공차 30km 이내'], warnings: ['복화 가능성 낮음'], recommended: false },
  { callId: 'CALL-2111', tonnage: 5, origin: { label: '전남 광양시 황금동', lat: 34.9416, lng: 127.6959 }, destination: { label: '부산 강서구 미음동', lat: 35.1293, lng: 128.876 }, pickupAt: '2026-08-13T19:30:00+09:00', loadedDistanceKm: 163, emptyDistanceKm: 6, durationMinutes: 188, fareWon: 390000, tollWon: 9500, fuelCostWon: 44500, emptyCostWon: 1288, estimatedNetIncomeWon: 334712, backhaulProbability: 0.67, tags: ['현재 위치 6km', '복화 가능성 높음'], warnings: [], recommended: true },
  { callId: 'CALL-3111', tonnage: 5, origin: { label: '부산 강서구 미음동', lat: 35.1293, lng: 128.876 }, destination: { label: '울산 남구 용연동', lat: 35.4701, lng: 129.365 }, pickupAt: '2026-08-13T23:00:00+09:00', loadedDistanceKm: 63, emptyDistanceKm: 7, durationMinutes: 95, fareWon: 210000, tollWon: 2400, fuelCostWon: 17190, emptyCostWon: 1503, estimatedNetIncomeWon: 188907, backhaulProbability: 0.38, tags: ['현재 위치 7km', '짧은 운행'], warnings: [], recommended: true },
  { callId: 'CALL-2211', tonnage: 5, origin: { label: '경북 구미시 산동읍', lat: 36.1718, lng: 128.4315 }, destination: { label: '대전 대덕구 문평동', lat: 36.4478, lng: 127.4047 }, pickupAt: '2026-08-13T21:00:00+09:00', loadedDistanceKm: 126, emptyDistanceKm: 5, durationMinutes: 152, fareWon: 310000, tollWon: 6500, fuelCostWon: 34397, emptyCostWon: 1074, estimatedNetIncomeWon: 268029, backhaulProbability: 0.61, tags: ['현재 위치 5km', '공차 30km 이내'], warnings: [], recommended: true },
  { callId: 'CALL-3211', tonnage: 5, origin: { label: '대전 대덕구 문평동', lat: 36.4478, lng: 127.4047 }, destination: { label: '경기 평택시 포승읍', lat: 36.9877, lng: 126.8495 }, pickupAt: '2026-08-13T23:40:00+09:00', loadedDistanceKm: 128, emptyDistanceKm: 10, durationMinutes: 160, fareWon: 320000, tollWon: 7300, fuelCostWon: 34943, emptyCostWon: 2147, estimatedNetIncomeWon: 275610, backhaulProbability: 0.42, tags: ['현재 위치 10km', '수도권 복귀'], warnings: [], recommended: true },
]

export function 데모응답(currentLocation?: string): ApiCarrierMatchesResponse {
  if (!currentLocation) return 결정론적데모응답
  const exact = 후속데모콜.filter((call) => call.origin.label === currentLocation)
  const nearby = 후속데모콜.filter((call) => call.origin.label !== currentLocation).sort((a, b) => a.emptyDistanceKm - b.emptyDistanceKm)
  const calls = [...exact, ...nearby].slice(0, 3)
  return { ...결정론적데모응답, calls, matchedCallCount: calls.length, selectionValid: calls.length > 0 }
}

export function 운송인응답변환(raw: unknown): 추천콜상세[] | null {
  if (!응답인가(raw)) return null
  return raw.calls.map(화면콜로)
}

export function 데모콜변환(currentLocation?: string): 추천콜상세[] {
  return 데모응답(currentLocation).calls.map(화면콜로)
}
