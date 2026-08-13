from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_and_catalog_contract() -> None:
    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"
    assert "+" in health.json()["checkedAt"]

    response = client.get(
        "/api/v1/catalog/options",
        params=[
            ("region", "CAPITAL"),
            ("subregion", "경기"),
            ("timeWindowMinutes", "120"),
            ("timeWindowMinutes", "120"),
            ("timeWindowMinutes", "60"),
        ],
    )
    assert response.status_code == 200
    body = response.json()
    minutes = [option["minutes"] for option in body["timeWindows"]]
    assert minutes == sorted(set(minutes))
    assert len(minutes) <= 12
    assert body["selectionValid"] is True
    assert isinstance(body["matchedCallCount"], int)
    assert all("callCount" in region for region in body["regions"])
    assert all("callCount" in subregion for region in body["regions"] for subregion in region["subregions"])


def test_shipper_and_carrier_use_camel_case_units() -> None:
    shipper = client.post("/api/v1/matches/shipper", json={})
    assert shipper.status_code == 200
    scenario = shipper.json()["shipperScenarios"][0]
    assert isinstance(scenario["estimatedFareWon"], int)
    assert 0 <= scenario["failureProbability"] <= 1

    carrier = client.get(
        "/api/v1/matches/carrier/C-01",
        params=[("timeSlots", "AFTERNOON"), ("maxEmptyKm", "30"), ("prioritizeIncome", "true")],
    )
    assert carrier.status_code == 200
    body = carrier.json()
    assert body["matchedCallCount"] == 3
    assert body["calls"][0]["recommended"] is True
    for call in body["calls"]:
        assert isinstance(call["fareWon"], int)
        assert isinstance(call["durationMinutes"], int)
        assert 0 <= call["backhaulProbability"] <= 1
        assert call["pickupAt"].endswith("+09:00")


def test_follow_up_excludes_call_id_and_route() -> None:
    response = client.get(
        "/api/v1/matches/carrier/C-01",
        params=[
            ("currentLocation", "충북 청주시 흥덕구"),
            ("excludeCallIds", "CALL-1042"),
            ("excludeRouteKeys", "충북 진천군 이월면->인천 서구 오류동"),
        ],
    )
    assert response.status_code == 200
    calls = response.json()["calls"]
    assert all(call["callId"] != "CALL-1042" for call in calls)
    assert all(f'{call["origin"]["label"]}->{call["destination"]["label"]}' != "충북 진천군 이월면->인천 서구 오류동" for call in calls)


def test_feedback_is_idempotent() -> None:
    request = {
        "feedbackId": "journey-test:CALL-1042:ACCEPT",
        "journeyId": "journey-test",
        "carrierId": "C-01",
        "callId": "CALL-1042",
        "action": "ACCEPT",
        "occurredAt": "2026-08-13T13:00:00+09:00",
    }
    first = client.post("/api/v1/matches/feedback", json=request)
    duplicate = client.post("/api/v1/matches/feedback", json=request)
    assert first.json()["duplicate"] is False
    assert duplicate.json()["duplicate"] is True


def test_error_shape_and_insight_fallback() -> None:
    invalid = client.post("/api/v1/matches/feedback", json={})
    assert invalid.status_code == 422
    error = invalid.json()["error"]
    assert set(error) == {"code", "message", "requestId", "details"}
    assert error["message"] == "요청 값을 확인해 주세요."

    insight = client.post("/api/insights", json={"audience": "CARRIER", "facts": {"netIncomeWon": 1}})
    assert insight.status_code == 200
    assert insight.json()["text"] == ""
