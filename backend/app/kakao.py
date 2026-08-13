"""
Kakao 지오코딩·길찾기 클라이언트.

`KAKAOMAP_REST_API_KEY` 가 없거나 API 가 실패해도 예외를 던지지 않는다 — 이 레포
전체의 방침("모델이 죽어도 데모는 산다")과 같다. 실패하면 호출부가 기존
고정값을 그대로 쓴다.

반드시 **REST API 키**여야 한다. Kakao 콘솔은 앱 하나에 JavaScript 키·REST API
키·Admin 키를 따로 발급하는데, JavaScript 키로 서버에서 직접 호출하면
"KA Header is required..." 401 이 난다(브라우저 Origin 검증용 키라서다).

주소→좌표는 프로세스 메모리에 캐싱한다. 같은 출발지/도착지 문자열이 여러
콜에 반복 등장하고, 요청마다 다시 지오코딩할 이유가 없다. 실거리(길찾기)는
캐싱하지 않는다 — 기준점(현재 위치)이 요청마다 달라진다.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import httpx

_LOCAL_SEARCH_BASE = "https://dapi.kakao.com/v2/local/search"
_MOBILITY_DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/directions"
_TIMEOUT = httpx.Timeout(4.0)

_geocode_cache: dict[str, tuple[float, float] | None] = {}

# 레포 루트 → backend/ 순. fixtures.py 의 경로 탐색과 같은 방식이다.
_ENV_CANDIDATES = [
    Path(__file__).resolve().parents[2] / ".env",
    Path(__file__).resolve().parents[1] / ".env",
]

_env_읽음 = False


def _env파일_읽기() -> None:
    """`.env` 의 값을 os.environ 에 채운다(이미 있는 값은 덮지 않는다).

    `uv run uvicorn ...` 은 .env 를 자동으로 읽지 않는다. 그래서 키가 .env 에
    분명히 있는데도 서버 프로세스에는 없어서 지오코딩이 조용히 전부 실패했고,
    predictions.json 콜이 좌표 null · 공차거리 0km 로 나갔다. 새 의존성
    (python-dotenv)을 붙이는 대신 필요한 만큼만 직접 읽는다.
    """
    global _env_읽음
    if _env_읽음:
        return
    _env_읽음 = True

    for 경로 in _ENV_CANDIDATES:
        try:
            본문 = 경로.read_text(encoding="utf-8")
        except OSError:
            continue
        for 줄 in 본문.splitlines():
            줄 = 줄.strip()
            if not 줄 or 줄.startswith("#") or "=" not in 줄:
                continue
            이름, _, 값 = 줄.partition("=")
            이름 = 이름.strip()
            값 = 값.strip().strip('"').strip("'")
            if 이름 and 값 and not os.getenv(이름):
                os.environ[이름] = 값
        return


def _api_key() -> str | None:
    key = os.getenv("KAKAOMAP_REST_API_KEY", "").strip()
    if not key:
        _env파일_읽기()
        key = os.getenv("KAKAOMAP_REST_API_KEY", "").strip()
    return key or None


def _auth_headers(key: str) -> dict[str, str]:
    return {"Authorization": f"KakaoAK {key}"}


def _first_coord(payload: dict[str, Any]) -> tuple[float, float] | None:
    documents = payload.get("documents")
    if not isinstance(documents, list) or not documents:
        return None
    first = documents[0]
    if not isinstance(first, dict):
        return None
    try:
        lat = float(first["y"])
        lng = float(first["x"])
    except (KeyError, TypeError, ValueError):
        return None
    return (lat, lng)


def geocode(address: str) -> tuple[float, float] | None:
    """주소 텍스트 → (위도, 경도). 실패하면 None."""
    address = address.strip()
    if not address:
        return None
    if address in _geocode_cache:
        return _geocode_cache[address]

    key = _api_key()
    if not key:
        return None

    result = None
    for endpoint in ("address.json", "keyword.json"):
        try:
            response = httpx.get(
                f"{_LOCAL_SEARCH_BASE}/{endpoint}",
                params={"query": address},
                headers=_auth_headers(key),
                timeout=_TIMEOUT,
            )
            if response.status_code == 200:
                result = _first_coord(response.json())
                if result is not None:
                    break
        except (httpx.HTTPError, ValueError):
            continue

    _geocode_cache[address] = result
    return result


def driving_distance_km(origin: tuple[float, float], destination: tuple[float, float]) -> float | None:
    """실도로 거리(km). Kakao Mobility 길찾기 API. 실패하면 None."""
    key = _api_key()
    if not key:
        return None

    origin_lat, origin_lng = origin
    dest_lat, dest_lng = destination
    try:
        response = httpx.get(
            _MOBILITY_DIRECTIONS_URL,
            params={
                "origin": f"{origin_lng},{origin_lat}",
                "destination": f"{dest_lng},{dest_lat}",
            },
            headers=_auth_headers(key),
            timeout=_TIMEOUT,
        )
        if response.status_code != 200:
            return None
        routes = response.json().get("routes")
        if not isinstance(routes, list) or not routes:
            return None
        summary = routes[0].get("summary") if isinstance(routes[0], dict) else None
        meters = summary.get("distance") if isinstance(summary, dict) else None
        if not isinstance(meters, (int, float)):
            return None
        return round(meters / 1000, 1)
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        return None
