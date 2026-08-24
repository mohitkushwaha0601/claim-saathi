"""Typed failures for prerequisite configuration and invocation errors."""


class PrerequisiteGraphError(Exception):
    """Base class for prerequisite-graph failures."""


class GraphConfigurationError(PrerequisiteGraphError):
    """A graph definition is malformed or internally inconsistent."""


class DuplicateNodeIdError(GraphConfigurationError):
    """A graph contains the same stable node identifier more than once."""


class MissingRootNodeError(GraphConfigurationError):
    """The configured root identifier does not resolve to a graph node."""


class UnknownChildNodeError(GraphConfigurationError):
    """A group references a child absent from the graph."""


class GraphCycleError(GraphConfigurationError):
    """A graph contains a direct or indirect cycle."""


class DisconnectedNodeError(GraphConfigurationError):
    """A graph contains a node unreachable from its root."""


class InvalidNodeShapeError(GraphConfigurationError):
    """A node is neither an unambiguous leaf nor an ALL_OF group."""


class DuplicateRuleBindingError(GraphConfigurationError):
    """One rule identifier is bound to more than one leaf in a graph."""


class JourneyGraphMismatchError(GraphConfigurationError):
    """A known graph filename does not match its declared journey."""


class GraphInvocationError(PrerequisiteGraphError):
    """The caller supplied an invalid set of rule results."""


class MissingRuleResultError(GraphInvocationError):
    """A configured leaf has no corresponding deterministic RuleResult."""


class DuplicateRuleResultError(GraphInvocationError):
    """The caller supplied more than one result for the same rule."""
