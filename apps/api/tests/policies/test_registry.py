"""Tests for immutable source and versioned policy registries."""

import pytest
from pydantic import ValidationError

from app.domain import (
    DecisionState,
    JourneyId,
    PolicyLifecycleStatus,
    PolicyOperator,
    PolicyRule,
    PolicyRuleType,
    PolicySource,
    PolicySourceStatus,
    PolicyVersion,
)
from app.policies import PolicyRegistry, PolicySourceRegistry
from app.policies.exceptions import (
    InactivePolicyRuleError,
    InactivePolicySourceError,
    UnknownPolicySourceError,
    UnknownPolicyVersionError,
)


def synthetic_source(
    status: PolicySourceStatus = PolicySourceStatus.ACTIVE,
) -> PolicySource:
    return PolicySource(
        source_id="SYNTH-SOURCE-REGISTRY-001",
        authority="Synthetic Test Authority — Not Government",
        title="Synthetic Registry Source",
        document_type="SYNTHETIC_TEST_DOCUMENT",
        status=status,
    )


def synthetic_rule(
    *,
    status: PolicyLifecycleStatus = PolicyLifecycleStatus.ACTIVE,
    source_id: str = "SYNTH-SOURCE-REGISTRY-001",
) -> PolicyRule:
    return PolicyRule(
        rule_id="SYNTH-RULE-REGISTRY-001",
        version="SYNTH-V1",
        requirement_id="SYNTH-REGISTRY-REQUIREMENT",
        journeys=(JourneyId.PF_PARTIAL_WITHDRAWAL,),
        rule_type=PolicyRuleType.POLICY_RULE,
        input_path="service.total_service_months",
        operator=PolicyOperator.GTE,
        expected=1,
        pass_state=DecisionState.PASS,
        failure_state=DecisionState.NOT_ELIGIBLE,
        issue_code="SYNTH-REGISTRY-ISSUE",
        source_id=source_id,
        status=status,
    )


def synthetic_version(rule: PolicyRule) -> PolicyVersion:
    return PolicyVersion(
        policy_id="SYNTH-POLICY-REGISTRY",
        version="SYNTH-V1",
        journey_id=JourneyId.PF_PARTIAL_WITHDRAWAL,
        status=PolicyLifecycleStatus.ACTIVE,
        rules=(rule,),
    )


def test_unknown_source_is_rejected() -> None:
    registry = PolicySourceRegistry(())

    with pytest.raises(UnknownPolicySourceError):
        registry.get("UNKNOWN-SOURCE")


def test_active_rule_with_unknown_source_is_rejected() -> None:
    sources = PolicySourceRegistry(())

    with pytest.raises(UnknownPolicySourceError):
        PolicyRegistry(sources, (synthetic_version(synthetic_rule()),))


@pytest.mark.parametrize(
    "source_status",
    [PolicySourceStatus.INACTIVE, PolicySourceStatus.SUPERSEDED],
)
def test_inactive_source_cannot_back_normal_active_rule(
    source_status: PolicySourceStatus,
) -> None:
    source = synthetic_source(source_status)
    sources = PolicySourceRegistry((source,))

    with pytest.raises(InactivePolicySourceError):
        PolicyRegistry(sources, (synthetic_version(synthetic_rule()),))


def test_unknown_policy_version_is_rejected(
    policy_registry: PolicyRegistry,
) -> None:
    with pytest.raises(UnknownPolicyVersionError):
        policy_registry.get_policy("EPFO-TRANSFER", "UNKNOWN-VERSION")


def test_superseded_rule_is_excluded_from_active_evaluation() -> None:
    source = synthetic_source()
    rule = synthetic_rule(status=PolicyLifecycleStatus.SUPERSEDED)
    registry = PolicyRegistry(
        PolicySourceRegistry((source,)),
        (synthetic_version(rule),),
    )

    assert registry.active_rules("SYNTH-POLICY-REGISTRY", "SYNTH-V1") == ()
    with pytest.raises(InactivePolicyRuleError):
        registry.get_active_rule(
            "SYNTH-POLICY-REGISTRY",
            "SYNTH-V1",
            rule.rule_id,
        )


def test_loaded_policy_configuration_is_immutable(
    policy_registry: PolicyRegistry,
) -> None:
    policy = policy_registry.get_policy("EPFO-PARTIAL-WITHDRAWAL", "1.0.0")
    rule = policy.rules[0]

    with pytest.raises(ValidationError):
        policy.version = "MUTATED"  # type: ignore[misc]
    with pytest.raises(ValidationError):
        rule.expected = 999  # type: ignore[misc]


def test_source_registry_exposes_reviewed_metadata(
    policy_registry: PolicyRegistry,
) -> None:
    source = policy_registry.source_registry.get("SRC-EPFO-TRANSFER-DOE")

    assert source.status is PolicySourceStatus.ACTIVE
    assert source.authority == "Employees' Provident Fund Organisation"
    assert source.document_type == "EPFO_TRANSFER_FAQ_PDF"
    assert source.verified_at is not None
    assert source.reference_url is not None
    assert source.scope is not None
