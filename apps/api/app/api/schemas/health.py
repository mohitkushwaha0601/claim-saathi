"""Health response contract without external dependency checks."""

from .common import ApiModel


class HealthResponse(ApiModel):
    status: str
    service: str
    environment: str
