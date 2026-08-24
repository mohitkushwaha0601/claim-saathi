"""Fresh process-local FastAPI application for every API test."""

from collections.abc import Callable
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import ApiSettings
from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    application = create_app(
        settings=ApiSettings(
            environment="test",
            allowed_origins=("http://localhost:3000",),
        )
    )
    with TestClient(application) as test_client:
        yield test_client


@pytest.fixture
def create_journey(
    client: TestClient,
) -> Callable[..., dict[str, Any]]:
    def _create(
        persona_id: str,
        goal: str,
        requested_amount_rupees: int | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {"persona_id": persona_id, "goal": goal}
        if requested_amount_rupees is not None:
            body["requested_amount_rupees"] = requested_amount_rupees
        response = client.post("/api/v1/journeys", json=body)
        assert response.status_code == 201, response.text
        return response.json()

    return _create
