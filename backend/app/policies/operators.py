"""Strict deterministic policy operators without implicit coercion."""

from enum import Enum

from app.domain import PolicyOperator

from .exceptions import InvalidOperatorOperands

_COMPARABLE_TYPES = (bool, int, str)


def _normalize_enum(value: object) -> object:
    if isinstance(value, Enum):
        return value.value
    return value


def _require_same_scalar_type(observed: object, expected: object) -> None:
    if type(observed) is not type(expected):
        raise InvalidOperatorOperands(
            "operator operands must have exactly the same type"
        )
    if not isinstance(observed, _COMPARABLE_TYPES):
        raise InvalidOperatorOperands("operator operands must be scalar values")


def apply_operator(
    operator: PolicyOperator,
    observed: object,
    expected: object = None,
) -> bool:
    """Apply one closed operator with exact types and no fuzzy behavior."""

    observed = _normalize_enum(observed)
    expected = _normalize_enum(expected)

    if operator is PolicyOperator.EXISTS:
        if expected is not None:
            raise InvalidOperatorOperands("exists does not accept expected data")
        return observed is not None

    if operator in (PolicyOperator.IN, PolicyOperator.NOT_IN):
        if not isinstance(expected, tuple):
            raise InvalidOperatorOperands("in operators require an immutable tuple")
        if type(observed) not in _COMPARABLE_TYPES:
            raise InvalidOperatorOperands("in operators require a scalar value")
        normalized_options = tuple(_normalize_enum(value) for value in expected)
        for option in normalized_options:
            _require_same_scalar_type(observed, option)
        contained = observed in normalized_options
        return contained if operator is PolicyOperator.IN else not contained

    _require_same_scalar_type(observed, expected)

    if operator is PolicyOperator.EQUALS:
        return observed == expected
    if operator is PolicyOperator.NOT_EQUALS:
        return observed != expected
    if operator in (PolicyOperator.GTE, PolicyOperator.LTE):
        if type(observed) is not int:
            raise InvalidOperatorOperands("ordered comparisons require integers")
        if operator is PolicyOperator.GTE:
            return observed >= expected
        return observed <= expected

    raise InvalidOperatorOperands(f"unsupported operator: {operator.value}")
