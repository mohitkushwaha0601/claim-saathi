"""Read-only source provenance endpoint tests."""

import socket

from fastapi.testclient import TestClient


def test_source_endpoint_returns_reviewed_metadata_without_network(
    client: TestClient,
    monkeypatch,
) -> None:
    def fail_network(*_args, **_kwargs):
        raise AssertionError("network access is forbidden")

    monkeypatch.setattr(socket, "create_connection", fail_network)

    response = client.get(
        "/api/v1/policy/sources/SRC-EPFO-TRANSFER-DOE"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["source_id"] == "SRC-EPFO-TRANSFER-DOE"
    assert payload["authority"] == "Employees' Provident Fund Organisation"
    assert payload["reference_url"].startswith("https://")
    assert payload["status"] == "ACTIVE"
    assert payload["demo"]["real_government_action_performed"] is False


def test_unknown_source_is_safe_404(client: TestClient) -> None:
    response = client.get("/api/v1/policy/sources/SRC-UNKNOWN")

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "POLICY_SOURCE_NOT_FOUND",
            "message": "Policy source not found.",
            "request_id": None,
        }
    }
