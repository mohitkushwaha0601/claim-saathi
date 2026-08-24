"""Typed application-layer failures mapped safely by the HTTP adapter."""


class ApplicationError(Exception):
    """Base class for expected application-service failures."""


class UnknownDemoPersonaError(ApplicationError):
    """A persona identifier is absent from the closed demo allowlist."""


class DemoPersonaGoalMismatchError(ApplicationError):
    """A persona was paired with a different demo scenario goal."""


class InvalidDemoRequestError(ApplicationError):
    """A request conflicts with the constrained demo scenario contract."""


class JourneySessionNotFoundError(ApplicationError):
    """A process-local journey session does not exist."""


class DecisionNotFoundError(ApplicationError):
    """A decision ID is absent from the specified journey history."""


class DecisionNotCurrentError(ApplicationError):
    """A resolution start referenced a historical, non-current decision."""


class ResolutionInstanceNotFoundError(ApplicationError):
    """A resolution instance is absent from the specified journey."""


class DemoEventNotAllowedError(ApplicationError):
    """A requested synthetic event is not allowlisted for this scenario."""
