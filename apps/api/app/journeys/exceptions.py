"""Typed configuration and invocation failures for journey services."""


class JourneyError(Exception):
    """Base class for journey subsystem failures."""


class JourneyConfigurationError(JourneyError):
    """Journey configuration is malformed or inconsistent across layers."""


class DuplicateJourneyMappingError(JourneyConfigurationError):
    """More than one active journey maps the same citizen goal."""


class JourneyNotAvailableError(JourneyError):
    """No reviewed active journey mapping exists for a citizen goal."""


class JourneyInstanceMismatchError(JourneyError):
    """A journey instance, intent, citizen state, or definition does not match."""


class JourneyVersionMismatchError(JourneyConfigurationError):
    """A selected policy or graph version differs from reviewed configuration."""


class PolicyGraphMismatchError(JourneyConfigurationError):
    """Journey, policy, and prerequisite graph bindings have drifted."""


class StaleCitizenStateError(JourneyError):
    """A re-evaluation attempted to use an older trusted state revision."""


class ResolutionStartNotAllowedError(JourneyError):
    """The current deterministic decision does not authorize that resolution."""
