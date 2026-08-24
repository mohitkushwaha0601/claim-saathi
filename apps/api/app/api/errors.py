"""Safe deterministic exception-to-HTTP mapping."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.application.exceptions import (
    ApplicationError,
    DecisionNotCurrentError,
    DecisionNotFoundError,
    DemoEventNotAllowedError,
    DemoPersonaGoalMismatchError,
    InvalidDemoRequestError,
    JourneySessionNotFoundError,
    ResolutionInstanceNotFoundError,
    UnknownDemoPersonaError,
)
from app.journeys.exceptions import (
    JourneyConfigurationError,
    JourneyError,
    ResolutionStartNotAllowedError,
    StaleCitizenStateError,
)
from app.policies.exceptions import (
    PolicyConfigurationError,
    PolicyError,
    UnknownPolicySourceError,
)
from app.prerequisites.exceptions import (
    GraphConfigurationError,
    PrerequisiteGraphError,
)
from app.resolutions.exceptions import (
    ResolutionConfigurationError,
    ResolutionError,
)

from .schemas.common import ErrorDetail, ErrorEnvelope


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    envelope = ErrorEnvelope(error=ErrorDetail(code=code, message=message))
    return JSONResponse(status_code=status_code, content=envelope.model_dump())


def install_exception_handlers(app: FastAPI) -> None:
    """Install consistent envelopes without exposing internal exception text."""

    @app.exception_handler(RequestValidationError)
    def request_validation_handler(
        _request: Request,
        _error: RequestValidationError,
    ) -> JSONResponse:
        return _error_response(
            422,
            "REQUEST_VALIDATION_ERROR",
            "The request did not match the public API contract.",
        )

    @app.exception_handler(StarletteHTTPException)
    def http_exception_handler(
        _request: Request,
        error: StarletteHTTPException,
    ) -> JSONResponse:
        code = "RESOURCE_NOT_FOUND" if error.status_code == 404 else "HTTP_ERROR"
        message = (
            "The requested resource was not found."
            if error.status_code == 404
            else "The request could not be completed."
        )
        return _error_response(error.status_code, code, message)

    @app.exception_handler(Exception)
    def application_exception_handler(
        _request: Request,
        error: Exception,
    ) -> JSONResponse:
        if isinstance(error, UnknownDemoPersonaError):
            return _error_response(404, "DEMO_PERSONA_NOT_FOUND", "Unknown demo persona.")
        if isinstance(
            error,
            (JourneySessionNotFoundError, DecisionNotFoundError),
        ):
            return _error_response(
                404,
                "JOURNEY_RESOURCE_NOT_FOUND",
                "Journey resource not found.",
            )
        if isinstance(error, ResolutionInstanceNotFoundError):
            return _error_response(404, "RESOLUTION_NOT_FOUND", "Resolution not found.")
        if isinstance(
            error,
            (DemoPersonaGoalMismatchError, InvalidDemoRequestError),
        ):
            return _error_response(
                400,
                "INVALID_DEMO_REQUEST",
                "The persona and request do not match the configured demo scenario.",
            )
        if isinstance(error, DemoEventNotAllowedError):
            return _error_response(
                409,
                "DEMO_EVENT_NOT_ALLOWED",
                "This synthetic event is not available for the journey.",
            )
        if isinstance(error, DecisionNotCurrentError):
            return _error_response(
                409,
                "DECISION_NOT_CURRENT",
                "Resolution must start from the latest journey decision.",
            )
        if isinstance(error, StaleCitizenStateError):
            return _error_response(
                409,
                "STALE_CITIZEN_STATE",
                "The trusted citizen snapshot is older than the prior evaluation.",
            )
        if isinstance(error, ResolutionStartNotAllowedError):
            return _error_response(
                409,
                "RESOLUTION_START_NOT_ALLOWED",
                "The requested issue has no approved resolution in that decision.",
            )
        if isinstance(error, UnknownPolicySourceError):
            return _error_response(404, "POLICY_SOURCE_NOT_FOUND", "Policy source not found.")
        if isinstance(
            error,
            (
                JourneyConfigurationError,
                PolicyConfigurationError,
                GraphConfigurationError,
                ResolutionConfigurationError,
            ),
        ):
            return _error_response(
                500,
                "CONFIGURATION_ERROR",
                "Reviewed configuration could not be used safely.",
            )
        if isinstance(error, ResolutionError):
            return _error_response(
                409,
                "INVALID_RESOLUTION_ACTION",
                "The resolution action is not allowed in its current state.",
            )
        if isinstance(error, JourneyError):
            return _error_response(
                409,
                "JOURNEY_OPERATION_ERROR",
                "The journey operation could not be completed safely.",
            )
        return _error_response(
            500,
            "INTERNAL_ERROR",
            "The request could not be completed safely.",
        )

    for expected_exception in (
        ApplicationError,
        JourneyError,
        PolicyError,
        PrerequisiteGraphError,
        ResolutionError,
    ):
        app.add_exception_handler(
            expected_exception,
            application_exception_handler,
        )
