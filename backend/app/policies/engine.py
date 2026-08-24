"""Deterministic one-rule policy engine with fail-closed uncertainty."""

from collections.abc import Mapping
from enum import Enum
from typing import Any

from pydantic import BaseModel

from app.domain import (
    CapabilityValue,
    CitizenIntent,
    CitizenState,
    DecisionState,
    EmploymentRecordType,
    IntegerRatio,
    PolicyEvaluatorId,
    PolicyRule,
    PolicyRuleDisposition,
    PolicyRuleType,
    PolicySourceStatus,
    RuleResult,
    VerificationStatus,
)

from .exceptions import (
    InputPathResolutionError,
    InvalidOperatorOperands,
    MissingTrustedDataError,
)
from .operators import apply_operator
from .registry import PolicyRegistry

_SAFE_INPUT_PATHS = frozenset(
    {
        "access.uan_status",
        "identity.aadhaar_status",
        "bank.verification_status",
        "employment.currently_employed",
        "employment.records",
        "service.total_service_months",
        "service.status",
        "pf.available_balance_rupees",
        "pf.status",
        "claims.active_transfer",
        "claims.transfer_already_completed",
    }
)
_SENSITIVE_RESULT_PATHS = frozenset({"pf.available_balance_rupees"})


def resolve_citizen_state_path(citizen_state: CitizenState, path: str) -> Any:
    """Resolve one allowlisted typed field path without expression execution."""

    if path not in _SAFE_INPUT_PATHS:
        raise InputPathResolutionError(path)

    current: Any = citizen_state
    for segment in path.split("."):
        if not isinstance(current, BaseModel):
            raise InputPathResolutionError(path)
        if segment not in type(current).model_fields:
            raise InputPathResolutionError(path)
        current = getattr(current, segment)
    return current


def _is_unavailable(value: Any) -> bool:
    return value is None or value in (
        VerificationStatus.UNAVAILABLE,
        VerificationStatus.INCONSISTENT,
    )


def _sanitize_observed_value(path: str | None, value: Any) -> bool | int | str | None:
    if path in _SENSITIVE_RESULT_PATHS:
        return None
    if isinstance(value, Enum):
        return str(value.value)
    if type(value) in (bool, int):
        return value
    return None


class PolicyEngine:
    """Evaluate one registered rule without aggregating journey decisions."""

    def __init__(self, registry: PolicyRegistry) -> None:
        self._registry = registry

    def evaluate_rule(
        self,
        *,
        policy_id: str,
        policy_version: str,
        rule_id: str,
        citizen_state: CitizenState,
        citizen_intent: CitizenIntent | None = None,
        capability_results: Mapping[str, CapabilityValue] | None = None,
    ) -> RuleResult:
        """Return the canonical deterministic result for exactly one rule."""

        version, rule = self._registry.get_active_rule(
            policy_id,
            policy_version,
            rule_id,
        )

        if (
            rule.disposition is PolicyRuleDisposition.POLICY_REVIEW_REQUIRED
            or self._registry.has_conflict(version, rule)
        ):
            return self._result(
                rule,
                version.version,
                DecisionState.POLICY_REVIEW_REQUIRED,
            )

        if rule.source_id is not None:
            source = self._registry.source_registry.get(rule.source_id)
            if source.status is PolicySourceStatus.REVIEW_REQUIRED:
                return self._result(
                    rule,
                    version.version,
                    DecisionState.POLICY_REVIEW_REQUIRED,
                )

        try:
            if rule.rule_type is PolicyRuleType.AUTHORITATIVE_CAPABILITY:
                passed, observed = self._evaluate_capability(
                    rule,
                    capability_results,
                )
            elif rule.evaluator_id is not None:
                passed, observed = self._evaluate_named(
                    rule,
                    citizen_state,
                    citizen_intent,
                )
            else:
                passed, observed = self._evaluate_operator(rule, citizen_state)
        except MissingTrustedDataError:
            return self._result(
                rule,
                version.version,
                DecisionState.UNABLE_TO_VERIFY,
            )
        except (InputPathResolutionError, InvalidOperatorOperands):
            return self._result(
                rule,
                version.version,
                DecisionState.POLICY_REVIEW_REQUIRED,
            )

        state = rule.pass_state if passed else rule.failure_state
        if state is None:
            return self._result(
                rule,
                version.version,
                DecisionState.POLICY_REVIEW_REQUIRED,
            )
        return self._result(
            rule,
            version.version,
            state,
            observed_value=observed,
            include_failure_metadata=not passed,
        )

    @staticmethod
    def _evaluate_operator(
        rule: PolicyRule,
        citizen_state: CitizenState,
    ) -> tuple[bool, bool | int | str | None]:
        if rule.input_path is None or rule.operator is None:
            raise InvalidOperatorOperands("operator rule is incomplete")

        if rule.trust_status_path is not None:
            trust_status = resolve_citizen_state_path(
                citizen_state,
                rule.trust_status_path,
            )
            if trust_status is not VerificationStatus.VERIFIED:
                raise MissingTrustedDataError(rule.trust_status_path)

        observed = resolve_citizen_state_path(citizen_state, rule.input_path)
        if _is_unavailable(observed):
            raise MissingTrustedDataError(rule.input_path)
        passed = apply_operator(rule.operator, observed, rule.expected)
        return passed, _sanitize_observed_value(rule.input_path, observed)

    @staticmethod
    def _evaluate_capability(
        rule: PolicyRule,
        capability_results: Mapping[str, CapabilityValue] | None,
    ) -> tuple[bool, str | None]:
        if capability_results is None or rule.rule_id not in capability_results:
            raise MissingTrustedDataError(rule.rule_id)
        capability = capability_results[rule.rule_id]
        if not isinstance(capability, CapabilityValue):
            raise MissingTrustedDataError(rule.rule_id)
        if capability is CapabilityValue.UNKNOWN:
            raise MissingTrustedDataError(rule.rule_id)
        return capability is CapabilityValue.AVAILABLE, capability.value

    @staticmethod
    def _evaluate_named(
        rule: PolicyRule,
        citizen_state: CitizenState,
        citizen_intent: CitizenIntent | None,
    ) -> tuple[bool, bool | None]:
        if (
            rule.evaluator_id
            is PolicyEvaluatorId.PARTIAL_WITHDRAWAL_75_PERCENT_LIMIT
        ):
            if citizen_intent is None or citizen_intent.requested_amount_rupees is None:
                raise MissingTrustedDataError("intent.requested_amount_rupees")
            if citizen_state.pf.status is not VerificationStatus.VERIFIED:
                raise MissingTrustedDataError("pf.available_balance_rupees")
            if not isinstance(rule.expected, IntegerRatio):
                raise InvalidOperatorOperands("amount evaluator ratio is missing")
            limit_rupees = (
                citizen_state.pf.available_balance_rupees
                * rule.expected.numerator
                // rule.expected.denominator
            )
            return citizen_intent.requested_amount_rupees <= limit_rupees, None

        previous_records = tuple(
            record
            for record in citizen_state.employment.records
            if record.employment_type is EmploymentRecordType.PREVIOUS
        )
        if rule.evaluator_id is PolicyEvaluatorId.PREVIOUS_EMPLOYMENT_EXISTS:
            exists = bool(previous_records)
            return exists, exists

        if (
            rule.evaluator_id
            is PolicyEvaluatorId.PREVIOUS_EMPLOYMENT_EXIT_DATE_EXISTS
        ):
            if len(previous_records) != 1:
                raise MissingTrustedDataError("employment.previous_record")
            has_exit_date = previous_records[0].exit_date is not None
            return has_exit_date, has_exit_date

        raise InvalidOperatorOperands("named evaluator is not allowlisted")

    @staticmethod
    def _result(
        rule: PolicyRule,
        policy_version: str,
        state: DecisionState,
        *,
        observed_value: bool | int | str | None = None,
        include_failure_metadata: bool = False,
    ) -> RuleResult:
        return RuleResult(
            rule_id=rule.rule_id,
            state=state,
            observed_value=observed_value,
            issue_code=rule.issue_code if include_failure_metadata else None,
            resolution_id=(
                rule.resolution_id if include_failure_metadata else None
            ),
            source_id=rule.source_id,
            policy_version=policy_version,
        )
