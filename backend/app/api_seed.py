"""새 camelCase API 계약의 결정론적 데모 데이터.

실제 공급 풀이나 모델 파일을 읽지 못해도 같은 요청은 항상 같은 결과를 돌려준다.
금액은 원 단위 정수, 거리는 km, 시간은 분, 확률은 0~1을 사용한다.
"""

from __future__ import annotations

from typing import Any

PREDICTION_SOURCES = {
    "model": None,
    "supplyPool": "deterministicDemoSeed:carrier-v1",
    "calculations": "deterministicRules:cost-v1",
}


DEMO_CARRIER_CALLS: list[dict[str, Any]] = [
    {
        "callId": "CALL-1042",
        "origin": {"label": "경기 화성시 향남읍", "lat": 37.1326, "lng": 126.9202},
        "destination": {"label": "충북 청주시 흥덕구", "lat": 36.6424, "lng": 127.4290},
        "pickupAt": "2026-08-13T13:00:00+09:00",
        "loadedDistanceKm": 118.4,
        "emptyDistanceKm": 12.5,
        "durationMinutes": 141,
        "fareWon": 352000,
        "tollWon": 6800,
        "fuelCostWon": 32355,
        "emptyCostWon": 2684,
        "estimatedNetIncomeWon": 310161,
        "backhaulProbability": 0.62,
        "tags": ["공차 30km 이내", "8시간 이내", "복화 가능성 높음"],
        "warnings": [],
        "recommended": True,
    },
    {
        "callId": "CALL-1113",
        "origin": {"label": "부산 강서구 미음동", "lat": 35.1293, "lng": 128.8760},
        "destination": {"label": "전남 광양시 황금동", "lat": 34.9416, "lng": 127.6959},
        "pickupAt": "2026-08-13T15:00:00+09:00",
        "loadedDistanceKm": 164.2,
        "emptyDistanceKm": 38.4,
        "durationMinutes": 202,
        "fareWon": 428000,
        "tollWon": 9700,
        "fuelCostWon": 44871,
        "emptyCostWon": 8245,
        "estimatedNetIncomeWon": 365184,
        "backhaulProbability": 0.44,
        "tags": ["8시간 이내"],
        "warnings": ["공차거리 주의"],
        "recommended": False,
    },
    {
        "callId": "CALL-1087",
        "origin": {"label": "인천 서구 가좌동", "lat": 37.4892, "lng": 126.6778},
        "destination": {"label": "경북 구미시 산동읍", "lat": 36.1718, "lng": 128.4315},
        "pickupAt": "2026-08-13T12:30:00+09:00",
        "loadedDistanceKm": 287.6,
        "emptyDistanceKm": 142.0,
        "durationMinutes": 428,
        "fareWon": 615000,
        "tollWon": 18400,
        "fuelCostWon": 78593,
        "emptyCostWon": 30489,
        "estimatedNetIncomeWon": 487518,
        "backhaulProbability": 0.21,
        "tags": ["8시간 이내"],
        "warnings": ["공차거리 주의", "복화 가능성 낮음"],
        "recommended": False,
    },
    {
        "callId": "CALL-2011",
        "origin": {"label": "충북 청주시 흥덕구", "lat": 36.6424, "lng": 127.4290},
        "destination": {"label": "경기 안산시 단원구", "lat": 37.3183, "lng": 126.8157},
        "pickupAt": "2026-08-13T18:00:00+09:00",
        "loadedDistanceKm": 132.0,
        "emptyDistanceKm": 8.0,
        "durationMinutes": 176,
        "fareWon": 300000,
        "tollWon": 8200,
        "fuelCostWon": 36065,
        "emptyCostWon": 1718,
        "estimatedNetIncomeWon": 254017,
        "backhaulProbability": 0.71,
        "tags": ["현재 위치 8km", "복화 가능성 높음"],
        "warnings": [],
        "recommended": True,
    },
    {
        "callId": "CALL-2012",
        "origin": {"label": "충북 진천군 이월면", "lat": 36.9279, "lng": 127.4311},
        "destination": {"label": "인천 서구 오류동", "lat": 37.5920, "lng": 126.6257},
        "pickupAt": "2026-08-13T19:00:00+09:00",
        "loadedDistanceKm": 156.0,
        "emptyDistanceKm": 25.0,
        "durationMinutes": 211,
        "fareWon": 330000,
        "tollWon": 9400,
        "fuelCostWon": 42622,
        "emptyCostWon": 5368,
        "estimatedNetIncomeWon": 272610,
        "backhaulProbability": 0.58,
        "tags": ["공차 30km 이내", "복화 가능성 높음"],
        "warnings": [],
        "recommended": False,
    },
    {
        "callId": "CALL-3011",
        "origin": {"label": "경기 안산시 단원구", "lat": 37.3183, "lng": 126.8157},
        "destination": {"label": "인천 남동구 고잔동", "lat": 37.3949, "lng": 126.6973},
        "pickupAt": "2026-08-13T21:30:00+09:00",
        "loadedDistanceKm": 31.0,
        "emptyDistanceKm": 5.0,
        "durationMinutes": 62,
        "fareWon": 145000,
        "tollWon": 0,
        "fuelCostWon": 8472,
        "emptyCostWon": 1074,
        "estimatedNetIncomeWon": 135454,
        "backhaulProbability": 0.35,
        "tags": ["현재 위치 5km", "짧은 운행"],
        "warnings": [],
        "recommended": True,
    },
    {
        "callId": "CALL-3012",
        "origin": {"label": "경기 시흥시 정왕동", "lat": 37.3392, "lng": 126.7335},
        "destination": {"label": "경기 용인시 기흥구", "lat": 37.2804, "lng": 127.1147},
        "pickupAt": "2026-08-13T22:00:00+09:00",
        "loadedDistanceKm": 58.0,
        "emptyDistanceKm": 14.0,
        "durationMinutes": 94,
        "fareWon": 190000,
        "tollWon": 2800,
        "fuelCostWon": 15851,
        "emptyCostWon": 3006,
        "estimatedNetIncomeWon": 168343,
        "backhaulProbability": 0.29,
        "tags": ["공차 30km 이내"],
        "warnings": ["복화 가능성 낮음"],
        "recommended": False,
    },
    {
        "callId": "CALL-2111",
        "origin": {"label": "전남 광양시 황금동", "lat": 34.9416, "lng": 127.6959},
        "destination": {"label": "부산 강서구 미음동", "lat": 35.1293, "lng": 128.8760},
        "pickupAt": "2026-08-13T19:30:00+09:00",
        "loadedDistanceKm": 163.0,
        "emptyDistanceKm": 6.0,
        "durationMinutes": 188,
        "fareWon": 390000,
        "tollWon": 9500,
        "fuelCostWon": 44500,
        "emptyCostWon": 1288,
        "estimatedNetIncomeWon": 334712,
        "backhaulProbability": 0.67,
        "tags": ["현재 위치 6km", "복화 가능성 높음"],
        "warnings": [],
        "recommended": True,
    },
    {
        "callId": "CALL-3111",
        "origin": {"label": "부산 강서구 미음동", "lat": 35.1293, "lng": 128.8760},
        "destination": {"label": "울산 남구 용연동", "lat": 35.4701, "lng": 129.3650},
        "pickupAt": "2026-08-13T23:00:00+09:00",
        "loadedDistanceKm": 63.0,
        "emptyDistanceKm": 7.0,
        "durationMinutes": 95,
        "fareWon": 210000,
        "tollWon": 2400,
        "fuelCostWon": 17190,
        "emptyCostWon": 1503,
        "estimatedNetIncomeWon": 188907,
        "backhaulProbability": 0.38,
        "tags": ["현재 위치 7km", "짧은 운행"],
        "warnings": [],
        "recommended": True,
    },
    {
        "callId": "CALL-2211",
        "origin": {"label": "경북 구미시 산동읍", "lat": 36.1718, "lng": 128.4315},
        "destination": {"label": "대전 대덕구 문평동", "lat": 36.4478, "lng": 127.4047},
        "pickupAt": "2026-08-13T21:00:00+09:00",
        "loadedDistanceKm": 126.0,
        "emptyDistanceKm": 5.0,
        "durationMinutes": 152,
        "fareWon": 310000,
        "tollWon": 6500,
        "fuelCostWon": 34397,
        "emptyCostWon": 1074,
        "estimatedNetIncomeWon": 268029,
        "backhaulProbability": 0.61,
        "tags": ["현재 위치 5km", "공차 30km 이내"],
        "warnings": [],
        "recommended": True,
    },
    {
        "callId": "CALL-3211",
        "origin": {"label": "대전 대덕구 문평동", "lat": 36.4478, "lng": 127.4047},
        "destination": {"label": "경기 평택시 포승읍", "lat": 36.9877, "lng": 126.8495},
        "pickupAt": "2026-08-13T23:40:00+09:00",
        "loadedDistanceKm": 128.0,
        "emptyDistanceKm": 10.0,
        "durationMinutes": 160,
        "fareWon": 320000,
        "tollWon": 7300,
        "fuelCostWon": 34943,
        "emptyCostWon": 2147,
        "estimatedNetIncomeWon": 275610,
        "backhaulProbability": 0.42,
        "tags": ["현재 위치 10km", "수도권 복귀"],
        "warnings": [],
        "recommended": True,
    },
]


def route_key(call: dict[str, Any]) -> str:
    return f"{call['origin']['label']}->{call['destination']['label']}"


def carrier_matches(
    *,
    current_location: str | None,
    exclude_call_ids: set[str],
    exclude_route_keys: set[str],
) -> list[dict[str, Any]]:
    """현재 위치와 제외 목록을 반영해 최대 3건을 결정론적으로 반환한다."""
    candidates = [
        call
        for call in DEMO_CARRIER_CALLS
        if call["callId"] not in exclude_call_ids and route_key(call) not in exclude_route_keys
    ]

    if current_location:
        exact = [call for call in candidates if call["origin"]["label"] == current_location]
        nearby = [call for call in candidates if call not in exact]
        candidates = exact + sorted(nearby, key=lambda item: (item["emptyDistanceKm"], item["callId"]))
    else:
        initial_ids = {"CALL-1042", "CALL-1113", "CALL-1087"}
        candidates = [call for call in candidates if call["callId"] in initial_ids]

    result: list[dict[str, Any]] = []
    for index, call in enumerate(candidates[:3]):
        result.append({**call, "recommended": index == 0})
    return result


CATALOG_TIME_WINDOWS = [40, 120, 240, 480, 1440]


def catalog_options(region: str | None, subregion: str | None, time_windows: list[int]) -> dict[str, Any]:
    unique_windows = sorted(set(CATALOG_TIME_WINDOWS + [item for item in time_windows if item > 0]))[:12]
    selection_valid = bool(region and subregion and all(item in unique_windows for item in time_windows))
    matched_count = 3 if selection_valid else len(DEMO_CARRIER_CALLS)
    return {
        "regions": [
            {"value": "CAPITAL", "label": "수도권", "callCount": 3, "subregions": [{"value": "서울", "label": "서울", "callCount": 0}, {"value": "경기", "label": "경기", "callCount": 2}, {"value": "인천", "label": "인천", "callCount": 1}]},
            {"value": "CHUNGCHEONG", "label": "충청", "callCount": 2, "subregions": [{"value": "대전", "label": "대전", "callCount": 0}, {"value": "세종", "label": "세종", "callCount": 0}, {"value": "충남", "label": "충남", "callCount": 0}, {"value": "충북", "label": "충북", "callCount": 2}]},
            {"value": "YEONGNAM", "label": "영남", "callCount": 1, "subregions": [{"value": "부산", "label": "부산", "callCount": 1}, {"value": "대구", "label": "대구", "callCount": 0}, {"value": "울산", "label": "울산", "callCount": 0}, {"value": "경남", "label": "경남", "callCount": 0}, {"value": "경북", "label": "경북", "callCount": 0}]},
            {"value": "HONAM", "label": "호남", "callCount": 1, "subregions": [{"value": "광주", "label": "광주", "callCount": 0}, {"value": "전남", "label": "전남", "callCount": 1}, {"value": "전북", "label": "전북", "callCount": 0}]},
            {"value": "GANGWON_JEJU", "label": "강원제주", "callCount": 0, "subregions": [{"value": "강원", "label": "강원", "callCount": 0}, {"value": "제주", "label": "제주", "callCount": 0}]},
        ],
        "timeWindows": [
            {"minutes": minutes, "callCount": max(0, len(DEMO_CARRIER_CALLS) - index)}
            for index, minutes in enumerate(unique_windows)
        ],
        "selectionValid": selection_valid,
        "matchedCallCount": matched_count,
        "predictionSources": PREDICTION_SOURCES,
    }
