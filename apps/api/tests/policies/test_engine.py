"""Behavioral and safety tests for deterministic one-rule evaluation."""

import ast
import socket
from collections.abc import Callable
from pathlib import Path

import pytest

from app.domain import (
    CapabilityValue,
    CitizenIntent,
    CitizenState,
    DecisionState,
    IntentGoal,
    JourneyId,
    PolicyLifecycleStatus,
    PolicyOperator,
    PolicyRule,
    PolicyRuleType,
    PolicySource,
    PolicySourceStatus,
    PolicyVersion,
    VerificationStatus,
)
from app.policies import PolicyEngine, PolicyRegistry, PolicySourceRegistry
from app.policies.exceptions import InvalidOperatorOperands
from app.policies.operators import apply_operator

PARTIAL_POLICY_ID = "EPFO-PARTIAL-WITHDRAWAL"
TRANSFER_POLICY_ID = "EPFO-TRANSFER"
ACTIVE_VERSION = "1.0.0"


def replace_nested(
    citizen_state: CitizenState,
    section: str,
    **updates: object,
) -> CitizenState:
    payload = citizen_state.model_dump(mode="json")
    payload[section].update(updates)
    return CitizenState.model_validate(payload)


def replace_claims(
    citizen_state: CitizenState,
    **updates: bool,
) -> CitizenState:
    return replace_nested(citizen_state, "claims", **updates)


@pytest.mark.parametrize(
    ("observed", "expected", "expected_result"),
    [(0, None, True), (None, None, False)],
)
def test_exists_operator(
    observed: object,
    expected: object,
    expected_result: bool,
) -> None:
    assert apply_operator(PolicyOperator.EXISTS, observed, expected) is expected_result


@pytest.mark.parametrize(
    ("operator", "observed", "expected", "expected_result"),
    [
        (PolicyOperator.EQUALS, "VERIFIED", "VERIFIED", True),
        (PolicyOperator.NOT_EQUALS, "PENDING", "VERIFIED", True),
        (PolicyOperator.GTE, 12, 12, True),
        (PolicyOperator.LTE, 12, 12, True),
        (PolicyOperator.IN, "VERIFIED", ("VERIFIED", "PENDING"), True),
        (PolicyOperator.NOT_IN, "UNAVAILABLE", ("VERIFIED", "PENDING"), True),
    ],
)
def test_deterministic_operators(
    operator: PolicyOperator,
    observed: object,
    expected: object,
    expected_result: bool,
) -> None:
    assert apply_operator(operator, observed, expected) is expected_result


@pytest.mark.parametrize(
    ("operator", "observed", "expected"),
    [
        (PolicyOperator.GTE, "12", 12),
        (PolicyOperator.EQUALS, True, 1),
        (PolicyOperator.IN, "VERIFIED", ["VERIFIED"]),
    ],
)
def test_invalid_operator_types_fail_safely(
    operator: PolicyOperator,
    observed: object,
    expected: object,
) -> None:
    with pytest.raises(InvalidOperatorOperands):
        apply_operator(operator, observed, expected)


def test_ravi_service_duration_passes(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")

    result = policy_engine.evaluate_rule(
        policy_id=PARTIAL_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="P31-SERVICE-001",
        citizen_state=state,
        citizen_intent=intent,
    )

    assert result.state is DecisionState.PASS
    assert result.observed_value == 144


def test_eight_month_service_is_not_eligible(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")
    state = replace_nested(state, "service", total_service_months=8)

    result = policy_engine.evaluate_rule(
        policy_id=PARTIAL_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="P31-SERVICE-001",
        citizen_state=state,
        citizen_intent=intent,
    )

    assert result.state is DecisionState.NOT_ELIGIBLE
    assert result.issue_code == "SERVICE_PERIOD_NOT_MET"


def test_exactly_twelve_months_passes(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")
    state = replace_nested(state, "service", total_service_months=12)

    result = policy_engine.evaluate_rule(
        policy_id=PARTIAL_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="P31-SERVICE-001",
        citizen_state=state,
        citizen_intent=intent,
    )

    assert result.state is DecisionState.PASS


def test_unavailable_service_fact_is_not_treated_as_ineligible(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")
    state = replace_nested(state, "service", status=VerificationStatus.UNAVAILABLE)

    result = policy_engine.evaluate_rule(
        policy_id=PARTIAL_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="P31-SERVICE-001",
        citizen_state=state,
        citizen_intent=intent,
    )

    assert result.state is DecisionState.UNABLE_TO_VERIFY
    assert result.issue_code is None


@pytest.mark.parametrize(
    ("requested_amount", "expected_state"),
    [(75, DecisionState.PASS), (76, DecisionState.NOT_ELIGIBLE)],
)
def test_partial_amount_uses_integer_floor_limit(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
    requested_amount: int,
    expected_state: DecisionState,
) -> None:
    _, state = load_demo("ravi_partial_ready.json")
    state = replace_nested(state, "pf", available_balance_rupees=101)
    intent = CitizenIntent(
        goal=IntentGoal.ACCESS_SOME_PF_FUNDS,
        currently_employed=True,
        requested_amount_rupees=requested_amount,
    )

    result = policy_engine.evaluate_rule(
        policy_id=PARTIAL_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="P31-AMOUNT-001",
        citizen_state=state,
        citizen_intent=intent,
    )

    assert result.state is expected_state
    assert result.observed_value is None
    if expected_state is DecisionState.NOT_ELIGIBLE:
        assert result.issue_code == "REQUEST_AMOUNT_EXCEEDS_POLICY_LIMIT"


def test_amount_evaluator_contains_no_floating_point_arithmetic() -> None:
    engine_path = Path(__file__).resolve().parents[2] / "app" / "policies" / "engine.py"
    syntax_tree = ast.parse(engine_path.read_text(encoding="utf-8"))

    assert not any(
        isinstance(node, ast.Constant) and isinstance(node.value, float)
        for node in ast.walk(syntax_tree)
    )
    assert not any(
        isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div)
        for node in ast.walk(syntax_tree)
    )
    assert any(
        isinstance(node, ast.BinOp) and isinstance(node.op, ast.FloorDiv)
        for node in ast.walk(syntax_tree)
    )


def test_unavailable_balance_is_unable_to_verify(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")
    state = replace_nested(state, "pf", status=VerificationStatus.UNAVAILABLE)

    result = policy_engine.evaluate_rule(
        policy_id=PARTIAL_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="P31-AMOUNT-001",
        citizen_state=state,
        citizen_intent=intent,
    )

    assert result.state is DecisionState.UNABLE_TO_VERIFY
    assert result.issue_code is None


def test_missing_requested_amount_is_unable_to_verify(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    _, state = load_demo("ravi_partial_ready.json")
    intent = CitizenIntent(goal=IntentGoal.ACCESS_SOME_PF_FUNDS)

    result = policy_engine.evaluate_rule(
        policy_id=PARTIAL_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="P31-AMOUNT-001",
        citizen_state=state,
        citizen_intent=intent,
    )

    assert result.state is DecisionState.UNABLE_TO_VERIFY


@pytest.mark.parametrize(
    ("bank_status", "expected_state", "expected_issue"),
    [
        (
            VerificationStatus.NOT_VERIFIED,
            DecisionState.ACTION_REQUIRED,
            "BANK_NOT_READY",
        ),
        (VerificationStatus.UNAVAILABLE, DecisionState.UNABLE_TO_VERIFY, None),
        (VerificationStatus.INCONSISTENT, DecisionState.UNABLE_TO_VERIFY, None),
    ],
)
def test_bank_readiness_distinguishes_failure_from_unknown(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
    bank_status: VerificationStatus,
    expected_state: DecisionState,
    expected_issue: str | None,
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")
    state = replace_nested(state, "bank", verification_status=bank_status)

    result = policy_engine.evaluate_rule(
        policy_id=PARTIAL_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="P31-BANK-001",
        citizen_state=state,
        citizen_intent=intent,
    )

    assert result.state is expected_state
    assert result.issue_code == expected_issue


def test_priya_missing_exit_date_requires_action(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    _, state = load_demo("priya_transfer_missing_exit.json")

    result = policy_engine.evaluate_rule(
        policy_id=TRANSFER_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="T13-DOE-001",
        citizen_state=state,
    )

    assert result.state is DecisionState.ACTION_REQUIRED
    assert result.issue_code == "EXIT_DATE_MISSING"
    assert result.resolution_id == "RES_EXIT"


def test_missing_previous_employment_is_not_applicable(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    _, state = load_demo("ravi_partial_ready.json")

    result = policy_engine.evaluate_rule(
        policy_id=TRANSFER_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="T13-PREVIOUS-EMPLOYMENT-001",
        citizen_state=state,
    )

    assert result.state is DecisionState.NOT_APPLICABLE
    assert result.issue_code == "NO_PREVIOUS_EMPLOYMENT"


def test_active_transfer_is_not_applicable(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    _, state = load_demo("priya_transfer_missing_exit.json")
    state = replace_claims(state, active_transfer=True)

    result = policy_engine.evaluate_rule(
        policy_id=TRANSFER_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="T13-ACTIVE-TRANSFER-001",
        citizen_state=state,
    )

    assert result.state is DecisionState.NOT_APPLICABLE
    assert result.issue_code == "TRANSFER_ALREADY_ACTIVE"


def test_completed_transfer_is_not_applicable(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    _, state = load_demo("priya_transfer_missing_exit.json")
    state = replace_claims(state, transfer_already_completed=True)

    result = policy_engine.evaluate_rule(
        policy_id=TRANSFER_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="T13-ALREADY-COMPLETE-001",
        citizen_state=state,
    )

    assert result.state is DecisionState.NOT_APPLICABLE
    assert result.issue_code == "TRANSFER_ALREADY_COMPLETED"


@pytest.mark.parametrize(
    ("capabilities", "expected_state"),
    [
        (None, DecisionState.UNABLE_TO_VERIFY),
        ({"T13-ROUTE-001": CapabilityValue.AVAILABLE}, DecisionState.PASS),
        ({"T13-ROUTE-001": CapabilityValue.UNAVAILABLE}, DecisionState.NOT_APPLICABLE),
        ({"T13-ROUTE-001": CapabilityValue.UNKNOWN}, DecisionState.UNABLE_TO_VERIFY),
    ],
)
def test_authoritative_transfer_capability_mapping(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
    capabilities: dict[str, CapabilityValue] | None,
    expected_state: DecisionState,
) -> None:
    _, state = load_demo("priya_transfer_missing_exit.json")

    result = policy_engine.evaluate_rule(
        policy_id=TRANSFER_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="T13-ROUTE-001",
        citizen_state=state,
        capability_results=capabilities,
    )

    assert result.state is expected_state


def test_untyped_capability_value_fails_closed(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    _, state = load_demo("priya_transfer_missing_exit.json")

    result = policy_engine.evaluate_rule(
        policy_id=TRANSFER_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="T13-ROUTE-001",
        citizen_state=state,
        capability_results={"T13-ROUTE-001": "AVAILABLE"},  # type: ignore[dict-item]
    )

    assert result.state is DecisionState.UNABLE_TO_VERIFY


def test_final_settlement_conflict_demo_requires_policy_review(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    _, state = load_demo("arjun_final_settlement.json")

    result = policy_engine.evaluate_rule(
        policy_id="EPFO-FINAL-SETTLEMENT-CONFLICT-DEMO",
        policy_version="CONFLICT-DEMO-1",
        rule_id="FINAL_SETTLEMENT_WAIT_PERIOD",
        citizen_state=state,
    )

    assert result.state is DecisionState.POLICY_REVIEW_REQUIRED
    assert result.observed_value is None


def test_conflicting_active_rules_never_select_one(
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    source = PolicySource(
        source_id="SYNTH-CONFLICT-SOURCE",
        authority="Synthetic Test Authority — Not Government",
        title="Synthetic Conflict Source",
        document_type="SYNTHETIC_TEST_DOCUMENT",
        status=PolicySourceStatus.ACTIVE,
    )
    common = {
        "version": "SYNTH-CONFLICT-V1",
        "requirement_id": "SYNTH-CONFLICT-REQUIREMENT",
        "journeys": (JourneyId.PF_PARTIAL_WITHDRAWAL,),
        "rule_type": PolicyRuleType.POLICY_RULE,
        "input_path": "service.total_service_months",
        "operator": PolicyOperator.GTE,
        "pass_state": DecisionState.PASS,
        "failure_state": DecisionState.NOT_ELIGIBLE,
        "source_id": source.source_id,
        "status": PolicyLifecycleStatus.ACTIVE,
    }
    first = PolicyRule(rule_id="SYNTH-CONFLICT-A", expected=1, **common)
    second = PolicyRule(rule_id="SYNTH-CONFLICT-B", expected=2, **common)
    policy = PolicyVersion(
        policy_id="SYNTH-CONFLICT-POLICY",
        version="SYNTH-CONFLICT-V1",
        journey_id=JourneyId.PF_PARTIAL_WITHDRAWAL,
        status=PolicyLifecycleStatus.ACTIVE,
        rules=(first, second),
    )
    registry = PolicyRegistry(PolicySourceRegistry((source,)), (policy,))
    engine = PolicyEngine(registry)
    _, state = load_demo("ravi_partial_ready.json")

    result = engine.evaluate_rule(
        policy_id=policy.policy_id,
        policy_version=policy.version,
        rule_id=first.rule_id,
        citizen_state=state,
    )

    assert result.state is DecisionState.POLICY_REVIEW_REQUIRED


def test_rule_with_unresolved_source_requires_policy_review(
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    source = PolicySource(
        source_id="SYNTH-REVIEW-SOURCE",
        authority="Synthetic Test Authority — Not Government",
        title="Synthetic Review Source",
        document_type="SYNTHETIC_TEST_DOCUMENT",
        status=PolicySourceStatus.REVIEW_REQUIRED,
    )
    rule = PolicyRule(
        rule_id="SYNTH-REVIEW-RULE",
        version="SYNTH-REVIEW-V1",
        requirement_id="SYNTH-REVIEW-REQUIREMENT",
        journeys=(JourneyId.PF_PARTIAL_WITHDRAWAL,),
        rule_type=PolicyRuleType.POLICY_RULE,
        input_path="service.total_service_months",
        operator=PolicyOperator.GTE,
        expected=1,
        pass_state=DecisionState.PASS,
        failure_state=DecisionState.NOT_ELIGIBLE,
        source_id=source.source_id,
        status=PolicyLifecycleStatus.ACTIVE,
    )
    policy = PolicyVersion(
        policy_id="SYNTH-REVIEW-POLICY",
        version="SYNTH-REVIEW-V1",
        journey_id=JourneyId.PF_PARTIAL_WITHDRAWAL,
        status=PolicyLifecycleStatus.ACTIVE,
        rules=(rule,),
    )
    engine = PolicyEngine(
        PolicyRegistry(PolicySourceRegistry((source,)), (policy,))
    )
    _, state = load_demo("ravi_partial_ready.json")

    result = engine.evaluate_rule(
        policy_id=policy.policy_id,
        policy_version=policy.version,
        rule_id=rule.rule_id,
        citizen_state=state,
    )

    assert result.state is DecisionState.POLICY_REVIEW_REQUIRED


def test_unknown_citizen_state_path_fails_closed_for_policy_review(
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    rule = PolicyRule(
        rule_id="SYNTH-UNKNOWN-PATH-RULE",
        version="SYNTH-UNKNOWN-PATH-V1",
        requirement_id="SYNTH-UNKNOWN-PATH-REQUIREMENT",
        journeys=(JourneyId.PF_TRANSFER,),
        rule_type=PolicyRuleType.DATA_CHECK,
        input_path="citizen_id",
        operator=PolicyOperator.EXISTS,
        pass_state=DecisionState.PASS,
        failure_state=DecisionState.UNABLE_TO_VERIFY,
        status=PolicyLifecycleStatus.ACTIVE,
    )
    policy = PolicyVersion(
        policy_id="SYNTH-UNKNOWN-PATH-POLICY",
        version="SYNTH-UNKNOWN-PATH-V1",
        journey_id=JourneyId.PF_TRANSFER,
        status=PolicyLifecycleStatus.ACTIVE,
        rules=(rule,),
    )
    engine = PolicyEngine(PolicyRegistry(PolicySourceRegistry(()), (policy,)))
    _, state = load_demo("priya_transfer_missing_exit.json")

    result = engine.evaluate_rule(
        policy_id=policy.policy_id,
        policy_version=policy.version,
        rule_id=rule.rule_id,
        citizen_state=state,
    )

    assert result.state is DecisionState.POLICY_REVIEW_REQUIRED


def test_same_inputs_and_version_produce_identical_rule_result(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")
    arguments = {
        "policy_id": PARTIAL_POLICY_ID,
        "policy_version": ACTIVE_VERSION,
        "rule_id": "P31-SERVICE-001",
        "citizen_state": state,
        "citizen_intent": intent,
    }

    first = policy_engine.evaluate_rule(**arguments)
    second = policy_engine.evaluate_rule(**arguments)

    assert first == second
    assert first.model_dump_json() == second.model_dump_json()


def test_evaluation_performs_no_network_access(
    policy_engine: PolicyEngine,
    load_demo: Callable[[str], tuple[CitizenIntent, CitizenState]],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")

    def reject_network(*args: object, **kwargs: object) -> None:
        raise AssertionError("network access attempted during policy evaluation")

    monkeypatch.setattr(socket, "create_connection", reject_network)

    result = policy_engine.evaluate_rule(
        policy_id=PARTIAL_POLICY_ID,
        policy_version=ACTIVE_VERSION,
        rule_id="P31-SERVICE-001",
        citizen_state=state,
        citizen_intent=intent,
    )

    assert result.state is DecisionState.PASS
