"""Typed failures for resolution configuration and navigation."""


class ResolutionError(Exception):
    """Base class for resolution subsystem failures."""


class ResolutionConfigurationError(ResolutionError):
    """Resolution configuration is malformed or inconsistent."""


class DuplicateResolutionIdentifierError(ResolutionConfigurationError):
    """The catalog received a duplicate workflow identifier and version."""


class DuplicateResolutionStepError(ResolutionConfigurationError):
    """A workflow contains the same stable step identifier more than once."""


class DuplicateIssueMappingError(ResolutionConfigurationError):
    """More than one active workflow maps the same issue code."""


class UnknownResolutionSourceError(ResolutionConfigurationError):
    """A workflow references a source absent from reviewed source metadata."""


class InactiveResolutionSourceError(ResolutionConfigurationError):
    """An active workflow references a source that is not active."""


class ResolutionWorkflowMismatchError(ResolutionConfigurationError):
    """A known configuration file does not declare its expected workflow."""


class ResolutionNotAvailableError(ResolutionError):
    """No approved active workflow is available for an issue."""


class UnknownResolutionError(ResolutionError):
    """A referenced workflow identifier and version are absent."""


class InvalidResolutionTransitionError(ResolutionError):
    """A requested resolution state transition is not allowed."""


class ResolutionVerificationRequiredError(InvalidResolutionTransitionError):
    """A terminal transition was attempted without trusted-state verification."""


class ResolutionTimestampError(ResolutionError):
    """A transition timestamp is naive or precedes instance history."""


class ResolutionInstanceMismatchError(ResolutionError):
    """A resolution instance does not match its catalog workflow."""


class UnsupportedSuccessVerifierError(ResolutionConfigurationError):
    """A workflow requests a verifier outside the closed allowlist."""
