from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import uuid4

from fastapi import Body, FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.api_seed import PREDICTION_SOURCES, carrier_matches, catalog_options
from app.fixtures import MODEL_VERSION, RESPONSE, SOURCES

app = FastAPI(title="MOVIN API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):  # type: ignore[no-untyped-def]
    request_id = request.headers.get("X-Request-Id") or str(uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response


def error_response(request: Request, status_code: int, code: str, message: str, details: Any = None) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "requestId": getattr(request.state, "request_id", str(uuid4())),
                "details": details,
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    return error_response(request, 422, "VALIDATION_ERROR", "요청 값을 확인해 주세요.", exc.errors())


@app.exception_handler(HTTPException)
async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
    return error_response(request, exc.status_code, "HTTP_ERROR", str(exc.detail))


@app.exception_handler(Exception)
async def unexpected_error(request: Request, _exc: Exception) -> JSONResponse:
    return error_response(request, 500, "INTERNAL_ERROR", "일시적인 오류가 발생했습니다. 다시 시도해 주세요.")


class ShipperMatchRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    tonnage: int | None = None
    timeWindowMinutes: list[int] | None = None
    톤급: int | None = None
    시간창_분_목록: list[int] | None = None


class CarrierDecision(BaseModel):
    model_config = ConfigDict(extra="allow")

    콜ID: str | None = None
    action: str | None = None
    feedback: str | None = None
    선택여부: bool | None = None
    사유: str | None = None


class FeedbackRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    feedbackId: str | None = None
    journeyId: str | None = None
    carrierId: str
    callId: str
    action: Literal["ACCEPT", "REJECT"]
    occurredAt: datetime


class InsightRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    audience: Literal["SHIPPER", "CARRIER"]
    facts: dict[str, Any] = Field(default_factory=dict)


_DECISIONS: list[dict[str, Any]] = []
_FEEDBACKS: dict[str, dict[str, Any]] = {}


def camel_shipper_scenarios() -> list[dict[str, int | float]]:
    return [
        {
            "tonnage": row["톤급"],
            "timeWindowMinutes": row["시간창_분"],
            "availableDrivers": row["수락가능차주"],
            "estimatedFareWon": row["예측_운임"],
            "estimatedDispatchMinutes": row["예측_배차분"],
            "failureProbability": row["유찰확률"],
        }
        for row in RESPONSE["화주_시나리오"]
    ]


@app.get("/api/health")
def api_health() -> dict[str, Any]:
    return {
        "status": "ok",
        "mode": "model" if MODEL_VERSION else "deterministicDemo",
        "checkedAt": datetime.now().astimezone().isoformat(),
        "predictionSources": PREDICTION_SOURCES,
    }


@app.get("/api/v1/catalog/options")
def api_catalog_options(
    region: str | None = None,
    subregion: str | None = None,
    timeWindowMinutes: list[int] = Query(default=[]),
) -> dict[str, Any]:
    return catalog_options(region, subregion, timeWindowMinutes)


@app.post("/api/v1/matches/shipper")
def api_match_shipper(
    req: ShipperMatchRequest = Body(default_factory=ShipperMatchRequest),
) -> dict[str, Any]:
    requested_windows = req.timeWindowMinutes or req.시간창_분_목록 or []
    scenarios = camel_shipper_scenarios()
    if requested_windows:
        scenarios = [row for row in scenarios if row["timeWindowMinutes"] in requested_windows]
    if req.tonnage or req.톤급:
        selected_tonnage = req.tonnage or req.톤급
        scenarios = [row for row in scenarios if row["tonnage"] == selected_tonnage]
    metrics = RESPONSE["모델지표"]
    return {
        "shipperScenarios": scenarios,
        "modelMetrics": {
            "acceptanceAuc": metrics["수락예측_AUC"],
            "failureAuc": metrics["유찰예측_AUC"],
            "trainingRows": metrics["학습행수"],
        },
        "modelVersion": MODEL_VERSION,
        "predictionSources": {
            "model": MODEL_VERSION,
            "supplyPool": SOURCES.get("화주_시나리오"),
            "calculations": "deterministicRules:shipper-v1",
        },
    }


@app.get("/api/v1/matches/carrier/{carrier_id}")
def api_match_carrier(
    carrier_id: str,
    region: str | None = None,
    subregion: str | None = None,
    timeSlots: list[str] = Query(default=[]),
    maxEmptyKm: int | None = None,
    maxDurationHours: int | None = None,
    prioritizeIncome: bool | None = None,
    prioritizeBackhaul: bool | None = None,
    currentLocation: str | None = None,
    excludeCallIds: list[str] = Query(default=[]),
    excludeRouteKeys: list[str] = Query(default=[]),
) -> dict[str, Any]:
    calls = carrier_matches(
        current_location=currentLocation,
        exclude_call_ids=set(excludeCallIds),
        exclude_route_keys=set(excludeRouteKeys),
        # 아직 운행 전이라 현재 위치가 없으면(첫 진입) 선호 권역을 공차거리 계산
        # 기준점으로 대신 쓴다. 세부지역이 더 구체적이라 있으면 그쪽을 우선한다.
        reference_location=currentLocation or subregion or region,
    )
    return {
        "carrierId": carrier_id,
        "appliedConditions": {
            "region": region,
            "subregion": subregion,
            "timeSlots": timeSlots,
            "maxEmptyKm": maxEmptyKm,
            "maxDurationHours": maxDurationHours,
            "prioritizeIncome": prioritizeIncome,
            "prioritizeBackhaul": prioritizeBackhaul,
            "currentLocation": currentLocation,
            "excludeCallIds": excludeCallIds,
            "excludeRouteKeys": excludeRouteKeys,
        },
        "calls": calls,
        "selectionValid": len(calls) > 0,
        "matchedCallCount": len(calls),
        "generatedAt": datetime.now().astimezone().isoformat(),
        "predictionSources": PREDICTION_SOURCES,
    }


@app.post("/api/v1/matches/feedback")
def api_match_feedback(req: FeedbackRequest) -> dict[str, Any]:
    feedback_id = req.feedbackId or f"{req.journeyId or 'journey'}:{req.carrierId}:{req.callId}:{req.action}"
    duplicate = feedback_id in _FEEDBACKS
    if not duplicate:
        _FEEDBACKS[feedback_id] = req.model_dump(mode="json")
    return {"recorded": True, "duplicate": duplicate, "feedbackId": feedback_id}


@app.post("/api/insights")
def api_insights(_req: InsightRequest) -> dict[str, Any]:
    # 수치 계산은 이 엔드포인트가 하지 않는다. AI 키가 없는 로컬/백엔드 환경에서는
    # 빈 문장을 돌려 프론트가 동일 facts 기반 규칙 문장을 사용하게 한다.
    return {"text": "", "source": "unavailable", "predictionSources": PREDICTION_SOURCES}


# 기존 화면/배포 계약을 보존한다. 새 화면은 위 camelCase /api 계약만 사용한다.
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/carrier/decisions")
def record_decision(req: CarrierDecision = Body(default_factory=CarrierDecision)) -> dict[str, Any]:
    _DECISIONS.append(req.model_dump())
    return {"기록됨": True, "누적": len(_DECISIONS)}


@app.get("/v1/carrier/decisions")
def list_decisions() -> dict[str, Any]:
    return {"목록": _DECISIONS, "누적": len(_DECISIONS)}


@app.post("/v1/matches/shipper")
def match_shipper(req: ShipperMatchRequest = Body(default_factory=ShipperMatchRequest)) -> dict[str, Any]:
    return {
        "화주_시나리오": RESPONSE["화주_시나리오"],
        "모델지표": RESPONSE["모델지표"],
        "모델버전": MODEL_VERSION,
        "출처": SOURCES,
    }


@app.get("/v1/matches/carrier/{carrier_id}")
def match_carrier(
    carrier_id: str,
    region: str | None = None,
    subregion: str | None = None,
    timeSlots: list[str] = Query(default=[]),
    maxEmptyKm: int | None = None,
    maxDurationHours: int | None = None,
    prioritizeIncome: bool | None = None,
    prioritizeBackhaul: bool | None = None,
) -> dict[str, Any]:
    return {
        "운송인ID": carrier_id,
        "적용조건": {
            "region": region,
            "subregion": subregion,
            "timeSlots": timeSlots,
            "maxEmptyKm": maxEmptyKm,
            "maxDurationHours": maxDurationHours,
            "prioritizeIncome": prioritizeIncome,
            "prioritizeBackhaul": prioritizeBackhaul,
        },
        "운송인_추천콜": RESPONSE["운송인_추천콜"],
        "모델지표": RESPONSE["모델지표"],
        "모델버전": MODEL_VERSION,
        "출처": SOURCES,
    }
