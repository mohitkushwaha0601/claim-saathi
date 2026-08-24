"""Explicit failure types for policy configuration and evaluation."""


class PolicyError(Exception):
    """Base class for policy subsystem failures."""


class PolicyConfigurationError(PolicyError):
    """Policy configuration is invalid or internally inconsistent."""


class DuplicatePolicyIdentifierError(PolicyConfigurationError):
    """A registry received a duplicate stable identifier."""


class UnknownPolicySourceError(PolicyConfigurationError):
    """A source identifier is absent from the reviewed source registry."""


class InactivePolicySourceError(PolicyConfigurationError):
    """An inactive or superseded source backs a new active rule."""


class UnknownPolicyVersionError(PolicyConfigurationError):
    """A requested policy identifier/version pair is not registered."""


class InactivePolicyVersionError(PolicyConfigurationError):
    """A requested policy version is not active."""


class UnknownPolicyRuleError(PolicyConfigurationError):
    """A requested rule identifier is absent from a policy version."""


class InactivePolicyRuleError(PolicyConfigurationError):
    """A requested rule is not active and cannot be evaluated normally."""


class InputPathResolutionError(PolicyConfigurationError):
    """A configured citizen-state path is not explicitly allowed."""


class InvalidOperatorOperands(PolicyConfigurationError):
    """An operator received incompatible or unsafe operand types."""


class MissingTrustedDataError(PolicyError):
    """Required trusted citizen or capability data is unavailable."""
