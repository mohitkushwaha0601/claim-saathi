"""Health, OpenAPI, and CORS transport tests."""

from fastapi.testclient import TestClient


def test_health_is_local_and_small(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "claimsaathi-api",
        "environment": "test",
    }


def test_openapi_is_enabled_and_identifies_demo_api(client: TestClient) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    document = response.json()
    assert document["info"]["title"] == "ClaimSaathi API"
    assert "/api/v1/journeys" in document["paths"]
    assert "/api/v1/demo/personas" in document["paths"]


def test_docs_endpoint_is_available(client: TestClient) -> None:
    response = client.get("/docs")

    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower()


def test_cors_allows_configured_frontend_without_credentials(
    client: TestClient,
) -> None:
    response = client.options(
        "/api/v1/demo/personas",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == (
        "http://localhost:3000"
    )
    assert "access-control-allow-credentials" not in response.headers
