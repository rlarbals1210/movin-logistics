from typing import Any

from fastapi import Body, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict

from app.fixtures import FIXED_RESPONSE

app = FastAPI(title="MOVIN API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ShipperMatchRequest(BaseModel):
    """
    화주 요청. 검증을 일부러 느슨하게 둔다.

    데모 중에 422 를 내는 것보다 대충 받아서 200 을 주는 쪽이 낫다.
    - extra="allow" — 모르는 필드가 와도 통과
    - 전부 optional — 빈 body({}) 도 통과
    - 톤급·시간창을 Literal 로 좁히지 않는다
    """

    model_config = ConfigDict(extra="allow")

    톤급: int | None = None
    시간창_분_목록: list[int] | None = None


class CarrierDecision(BaseModel):
    """
    운송인의 콜 선택·미선택 기록.

    다른 엔드포인트와 같은 방침이다 — 검증을 느슨하게 두고 422 를 내지 않는다.
    """

    model_config = ConfigDict(extra="allow")

    콜ID: str | None = None
    선택여부: bool | None = None
    사유: str | None = None


# 프로세스 메모리에만 쌓는다. 재시작하면 사라진다 — 해커톤 범위에서는 충분하다.
_DECISIONS: list[dict[str, Any]] = []


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/carrier/decisions")
def record_decision(
    req: CarrierDecision = Body(default_factory=CarrierDecision),
) -> dict[str, Any]:
    """
    선택하지 않은 이유까지 받는다.

    기획 기준에서 "선택하지 않는 것도 정당한 의사결정"이므로 미선택도 같은
    엔드포인트로 기록한다. 자동 수락은 없다 — 이 API 는 사용자가 누른 뒤에만 불린다.
    """
    _DECISIONS.append(req.model_dump())
    return {"기록됨": True, "누적": len(_DECISIONS)}


@app.get("/v1/carrier/decisions")
def list_decisions() -> dict[str, Any]:
    """데모 중에 로그가 실제로 쌓였는지 눈으로 보려고 둔다"""
    return {"목록": _DECISIONS, "누적": len(_DECISIONS)}


@app.post("/v1/matches/shipper")
def match_shipper(req: ShipperMatchRequest = Body(default_factory=ShipperMatchRequest)) -> dict[str, Any]:
    """
    시간창 배열을 받아 시나리오 배열을 반환한다.

    지금은 요청값을 보지 않고 15개 조합을 통째로 준다 — 화주 화면이
    톤급 x 시간창 격자를 통으로 그리기 때문에 이 편이 오히려 맞다.
    점심에 모델을 붙이면 여기서 req 를 실제로 쓴다.
    """
    return {
        "화주_시나리오": FIXED_RESPONSE["화주_시나리오"],
        "모델지표": FIXED_RESPONSE["모델지표"],
        # 아직 모델이 없다. 0 이 아니라 null 이다.
        "모델버전": None,
    }


@app.get("/v1/matches/carrier/{carrier_id}")
def match_carrier(carrier_id: str) -> dict[str, Any]:
    """
    추천 콜 3건을 반환한다.

    carrier_id 는 문자열로 받는다. 숫자로 좁히면 데모에서 'C-01' 같은 걸
    넣었을 때 422 가 난다.
    """
    return {
        "운송인ID": carrier_id,
        "운송인_추천콜": FIXED_RESPONSE["운송인_추천콜"],
        "모델지표": FIXED_RESPONSE["모델지표"],
        "모델버전": None,
    }
