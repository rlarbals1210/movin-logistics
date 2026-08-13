"""새 camelCase API 계약의 결정론적 데모 데이터.

실제 공급 풀이나 모델 파일을 읽지 못해도 같은 요청은 항상 같은 결과를 돌려준다.
금액은 원 단위 정수, 거리는 km, 시간은 분, 확률은 0~1을 사용한다.

`carrier_matches()`는 두 단계로 실데이터를 흡수한다.

1. `predictions.json`의 `운송인_추천콜`이 7개 기본 필드(콜ID·출발지·도착지·
   거리km·예측_운임·톨비·표준소요_h) **와** `복화가능성`까지 전부 갖추면
   그 목록을 후보 풀로 쓴다. `복화가능성`은 AI 모델 예측값이라 아직 없다 —
   추가되는 순간 이 검증을 통과해 자동으로 전환된다(코드 수정 불필요).
2. 후보 풀과 무관하게, 매 요청마다 Kakao 지오코딩·길찾기(`app/kakao.py`)로
   `emptyDistanceKm`(공차거리)을 실측값으로 덮어쓴다. 운송인 데모의 핵심
   메시지("표면 운임 1위가 시간당 실수령으로는 꼴찌")가 전적으로 이 값에서
   나오는데, 이건 모델 예측이 아니라 지금 바로 계산 가능한 값이기 때문이다.
   실패하면(키 없음·API 오류) 해당 콜은 기존 고정값을 그대로 쓴다.

거리를 실측으로 덮으면 그 거리에 물린 비용(`emptyCostWon`·
`estimatedNetIncomeWon`)도 같이 재계산해야 앞뒤가 맞는다 — 안 그러면 "옛
공차거리로 계산한 비용"이 "새 공차거리"와 나란히 뜬다. `_비용재계산()`이 이
둘을 갱신한다. 사용하는 상수(유가 1,503원/L · 5톤 연비)는 이 시드 데이터가
원래도 쓰던 값이다(예: CALL-1042의 emptyCostWon 2,684 = 12.5÷7.0×1,503) —
`frontend/src/features/carrier/economics.ts`와 같은 값이고, 그쪽 상수 출처가
아직 미확정이라 여기도 같은 전제를 상속한다. 상수가 바뀌면 여기도 같이 바꾼다.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from app.kakao import driving_distance_km, geocode

PREDICTION_SOURCES = {
    "model": None,
    "supplyPool": "deterministicDemoSeed:carrier-v1",
    "calculations": "deterministicRules:cost-v1",
}

_경유_원_per_L = 1503
_연비_적재_km_per_L = 5.5  # 5톤 기준. 시드 데이터의 fuelCostWon 역산값과 일치.
_연비_공차_km_per_L = 7.0


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


# ── predictions.json 실데이터 흡수 ──────────────────────────────────────

_PREDICTIONS_CANDIDATES = [
    Path(__file__).resolve().parents[2] / "frontend" / "src" / "data" / "predictions.json",
    Path(__file__).resolve().parent / "data" / "predictions.json",
]

_추천콜_필수_문자열_필드 = ("콜ID", "출발지", "도착지")
_추천콜_필수_숫자_필드 = ("거리km", "예측_운임", "톨비", "표준소요_h")


def _숫자인가(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _유효한_추천콜_행(행: Any) -> bool:
    """기본 7개 필드 + 복화가능성까지 있어야 통과한다.

    반쪽짜리(복화가능성 없는 행)를 서빙하느니 데모 고정값이 낫다 —
    `fixtures.py`의 `_유효한_시나리오()`와 같은 판단이다.
    """
    if not isinstance(행, dict):
        return False
    if any(not isinstance(행.get(k), str) or not 행[k].strip() for k in _추천콜_필수_문자열_필드):
        return False
    if any(not _숫자인가(행.get(k)) for k in _추천콜_필수_숫자_필드):
        return False
    복화 = 행.get("복화가능성")
    return _숫자인가(복화) and 0 <= 복화 <= 1


def _태그와경고(공차km: float, 소요분: float, 복화가능성: float) -> tuple[list[str], list[str]]:
    tags: list[str] = []
    warnings: list[str] = []
    if 공차km <= 30:
        tags.append("공차 30km 이내")
    else:
        warnings.append("공차거리 주의")
    if 소요분 <= 8 * 60:
        tags.append("8시간 이내")
    else:
        warnings.append("8시간 초과")
    if 복화가능성 >= 0.5:
        tags.append("복화 가능성 높음")
    elif 복화가능성 < 0.3:
        warnings.append("복화 가능성 낮음")
    return tags, warnings


def _예측콜로(행: dict[str, Any], index: int) -> dict[str, Any]:
    """predictions.json의 운송인_추천콜 한 행을 DEMO_CARRIER_CALLS와 같은 모양으로 바꾼다."""
    적재km = float(행["거리km"])
    소요분 = round(float(행["표준소요_h"]) * 60)
    운임 = round(float(행["예측_운임"]))
    톨비 = round(float(행["톨비"]))
    유류비 = round(적재km / _연비_적재_km_per_L * _경유_원_per_L)
    복화가능성 = float(행["복화가능성"])
    tags, warnings = _태그와경고(0, 소요분, 복화가능성)

    return {
        "callId": str(행["콜ID"]),
        "origin": {"label": str(행["출발지"]), "lat": None, "lng": None},
        "destination": {"label": str(행["도착지"]), "lat": None, "lng": None},
        # predictions.json에 상차 시각이 없다 — 등록 순서로 30분 간격을 두어 임시 배치한다.
        "pickupAt": f"2026-08-13T{12 + index // 2:02d}:{(index % 2) * 30:02d}:00+09:00",
        "loadedDistanceKm": 적재km,
        # carrier_matches()가 매 요청마다 Kakao 실측값으로 덮는다. 실패하면 0 그대로 노출된다 —
        # 임의 추정치를 넣는 것보다 "0km"가 눈에 띄어서 낫다.
        "emptyDistanceKm": 0.0,
        "durationMinutes": 소요분,
        "fareWon": 운임,
        "tollWon": 톨비,
        "fuelCostWon": 유류비,
        "emptyCostWon": 0,
        "estimatedNetIncomeWon": 운임 - 유류비 - 톨비,
        "backhaulProbability": 복화가능성,
        "tags": tags,
        "warnings": warnings,
        "recommended": False,
    }


def _predictions_경로들() -> list[Path]:
    # fixtures.py의 경로 탐색과 같은 순서다 — Railway 는 backend/ 만 배포하므로
    # 레포 상대경로가 안 잡히고, PREDICTIONS_PATH 환경변수로 위치를 대신 준다.
    # (과거 실제로 이 경로를 안 맞춰서 배포본이 고정값을 서빙한 적이 있다.)
    경로들 = []
    환경변수 = os.getenv("PREDICTIONS_PATH", "").strip()
    if 환경변수:
        경로들.append(Path(환경변수).expanduser())
    경로들.extend(_PREDICTIONS_CANDIDATES)
    return 경로들


def _실데이터_추천콜_로드() -> list[dict[str, Any]] | None:
    for 경로 in _predictions_경로들():
        try:
            데이터 = json.loads(경로.read_bytes())
        except (OSError, ValueError):
            continue
        행목록 = 데이터.get("운송인_추천콜") if isinstance(데이터, dict) else None
        if not isinstance(행목록, list) or not 행목록 or not all(_유효한_추천콜_행(행) for 행 in 행목록):
            continue
        return [_예측콜로(행, i) for i, 행 in enumerate(행목록)]
    return None


_REAL_CALLS = _실데이터_추천콜_로드()
if _REAL_CALLS:
    PREDICTION_SOURCES["supplyPool"] = "predictions.json"


def _비용재계산(call: dict[str, Any], 공차km: float) -> dict[str, Any]:
    """emptyDistanceKm을 실측값으로 바꿀 때 관련 필드를 같이 갱신한다.

    안 그러면 "옛 공차거리로 계산한 비용"이 "새 공차거리"와 나란히 뜬다.
    """
    공차비 = round(공차km / _연비_공차_km_per_L * _경유_원_per_L)
    실수령 = call["fareWon"] - call["fuelCostWon"] - 공차비 - call["tollWon"]
    # durationMinutes(적재 구간 소요)는 이 계산과 무관해 건드리지 않는다 — 공차 이동
    # 소요시간 환산은 프론트 economics.ts가 이미 자기 상수(50km/h)로 하고 있다.
    tags, warnings = _태그와경고(공차km, call["durationMinutes"], call["backhaulProbability"])
    return {
        **call,
        "emptyDistanceKm": 공차km,
        "emptyCostWon": 공차비,
        "estimatedNetIncomeWon": 실수령,
        "tags": tags,
        "warnings": warnings,
    }


def _실측_공차거리_적용(calls: list[dict[str, Any]], reference_location: str | None) -> list[dict[str, Any]]:
    """기준 위치(현재 위치 또는 선호 권역) → 각 콜 출발지의 실도로거리로 emptyDistanceKm을 덮는다.

    지오코딩·길찾기가 실패하면(키 없음·API 오류) 해당 콜은 원래 값 그대로 남는다 —
    콜 단위 폴백이라 하나가 실패해도 나머지 화면은 정상이다.
    """
    reference_coord = geocode(reference_location) if reference_location else None

    updated: list[dict[str, Any]] = []
    for call in calls:
        next_call = call
        origin_coord = geocode(call["origin"]["label"])
        dest_coord = geocode(call["destination"]["label"])

        if origin_coord is not None:
            next_call = {**next_call, "origin": {**next_call["origin"], "lat": origin_coord[0], "lng": origin_coord[1]}}
        if dest_coord is not None:
            next_call = {**next_call, "destination": {**next_call["destination"], "lat": dest_coord[0], "lng": dest_coord[1]}}

        if reference_coord is not None and origin_coord is not None:
            공차km = driving_distance_km(reference_coord, origin_coord)
            if 공차km is not None:
                next_call = _비용재계산(next_call, 공차km)

        updated.append(next_call)
    return updated


def carrier_matches(
    *,
    current_location: str | None,
    exclude_call_ids: set[str],
    exclude_route_keys: set[str],
    reference_location: str | None = None,
) -> list[dict[str, Any]]:
    """현재 위치와 제외 목록을 반영해 최대 3건을 결정론적으로 반환한다.

    `reference_location`은 공차거리 실측 계산의 기준점이다. 보통 `current_location`과
    같지만, 아직 운행 전이라 현재 위치가 없는 첫 진입에서는 선호 권역으로 대신한다
    (main.py가 결정해서 넘긴다 — 여기는 순수하게 받은 값만 쓴다).
    """
    base_calls = _REAL_CALLS or DEMO_CARRIER_CALLS
    candidates = [
        call
        for call in base_calls
        if call["callId"] not in exclude_call_ids and route_key(call) not in exclude_route_keys
    ]
    candidates = _실측_공차거리_적용(candidates, reference_location or current_location)

    if current_location:
        exact = [call for call in candidates if call["origin"]["label"] == current_location]
        nearby = [call for call in candidates if call not in exact]
        candidates = exact + sorted(nearby, key=lambda item: (item["emptyDistanceKm"], item["callId"]))

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
