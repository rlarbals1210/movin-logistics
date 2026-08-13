from fastapi.testclient import TestClient

from app.api_seed import DEMO_CARRIER_CALLS, _REAL_CALLS
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
    assert 720 in minutes
    assert len(minutes) <= 12
    assert body["selectionValid"] is True
    assert isinstance(body["matchedCallCount"], int)
    assert all("callCount" in region for region in body["regions"])
    assert all("callCount" in subregion for region in body["regions"] for subregion in region["subregions"])


def test_shipper_and_carrier_use_camel_case_units() -> None:
    shipper = client.post("/api/v1/matches/shipper", json={})
    assert shipper.status_code == 200
    scenarios = shipper.json()["shipperScenarios"]
    assert len(scenarios) == 18
    assert {(row["tonnage"], row["timeWindowMinutes"]) for row in scenarios} == {
        (tonnage, window)
        for tonnage in (5, 11, 25)
        for window in (40, 120, 240, 480, 720, 1440)
    }
    twelve_hour = {row["tonnage"]: row for row in scenarios if row["timeWindowMinutes"] == 720}
    assert twelve_hour[5]["availableDrivers"] == 1168
    assert twelve_hour[5]["estimatedFareWon"] == 282311
    assert twelve_hour[11]["availableDrivers"] == 467
    assert twelve_hour[11]["estimatedFareWon"] == 499029
    assert twelve_hour[25]["availableDrivers"] == 148
    assert twelve_hour[25]["estimatedFareWon"] == 571820

    scenario = scenarios[0]
    assert isinstance(scenario["estimatedFareWon"], int)
    assert 0 <= scenario["failureProbability"] <= 1

    carrier = client.get(
        "/api/v1/matches/carrier/C-01",
        params=[("tonnage", "5"), ("prioritizeIncome", "true")],
    )
    assert carrier.status_code == 200
    body = carrier.json()
    # currentLocation 미지정 = 오더 게시판 첫 진입. 3건으로 자르지 않고
    # (하드코딩 풀 + predictions.json 실데이터) 전체를 스크롤 목록으로 준다.
    expected_five_ton = len(DEMO_CARRIER_CALLS) + sum(call["tonnage"] == 5 for call in (_REAL_CALLS or []))
    assert body["matchedCallCount"] == expected_five_ton
    assert body["calls"][0]["recommended"] is True
    assert all(call["tonnage"] == 5 for call in body["calls"])
    net_income = [call["estimatedNetIncomeWon"] for call in body["calls"]]
    assert net_income == sorted(net_income, reverse=True)
    for call in body["calls"]:
        assert isinstance(call["fareWon"], int)
        assert isinstance(call["durationMinutes"], int)
        assert 0 <= call["backhaulProbability"] <= 1
        assert call["pickupAt"].endswith("+09:00")


def test_carrier_preferences_and_tonnage_change_results() -> None:
    busan = client.get(
        "/api/v1/matches/carrier/C-01",
        params=[
            ("tonnage", "5"),
            ("region", "영남"),
            ("subregion", "부산"),
            ("timeSlots", "AFTERNOON"),
            ("maxEmptyKm", "30"),
            ("maxDurationHours", "8"),
        ],
    ).json()
    assert busan["calls"]
    assert all(call["tonnage"] == 5 for call in busan["calls"])
    assert all("부산" in call["origin"]["label"] for call in busan["calls"])
    assert all(call["emptyDistanceKm"] <= 30 for call in busan["calls"])
    assert all(call["durationMinutes"] <= 8 * 60 for call in busan["calls"])

    capital = client.get(
        "/api/v1/matches/carrier/C-01",
        params=[("tonnage", "5"), ("region", "수도권"), ("subregion", "경기")],
    ).json()
    assert capital["calls"]
    assert all("경기" in call["origin"]["label"] for call in capital["calls"])
    assert [call["callId"] for call in busan["calls"]] != [call["callId"] for call in capital["calls"]]

    strict_empty = client.get(
        "/api/v1/matches/carrier/C-01",
        params=[("tonnage", "5"), ("maxEmptyKm", "1")],
    ).json()
    assert all(call["emptyDistanceKm"] <= 1 for call in strict_empty["calls"])

    eleven_ton = client.get("/api/v1/matches/carrier/C-01", params={"tonnage": 11}).json()
    twenty_five_ton = client.get("/api/v1/matches/carrier/C-01", params={"tonnage": 25}).json()
    assert {call["tonnage"] for call in eleven_ton["calls"]} <= {11}
    assert {call["tonnage"] for call in twenty_five_ton["calls"]} <= {25}
    assert {call["callId"] for call in eleven_ton["calls"]} != {call["callId"] for call in twenty_five_ton["calls"]}


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
