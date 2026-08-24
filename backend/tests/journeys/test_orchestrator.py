"""Journey orchestration states, ordered metadata, and safety boundaries."""

import ast
from pathlib import Path

from app.domain import CapabilityValue, DecisionState

BACKEND_ROOT = Path(__file__).resolve().parents[2]
JOURNEY_PACKAGE = BACKEND_ROOT / "app" / "journeys"


def test_ravi_configured_prerequisites_pass(harness) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="RAVI-001")

    result = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-RAVI-001",
    )

    assert result.journey_decision.state is DecisionState.PASS
    assert result.graph_evaluation.root_state is DecisionState.PASS


def test_ravi_has_no_issues_or_resolutions(harness) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="RAVI-002")

    decision = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-RAVI-002",
    ).journey_decision

    assert decision.issue_codes == ()
    assert decision.resolution_ids == ()
    assert decision.blocking_node_ids == ()


def test_eight_month_partial_case_is_not_eligible_without_resolution(
    harness,
) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    state = harness.replace_section(state, "service", total_service_months=8)
    instance = harness.create_instance(intent, state, suffix="RAVI-8-MONTH")

    decision = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-RAVI-8-MONTH",
    ).journey_decision

    assert decision.state is DecisionState.NOT_ELIGIBLE
    assert decision.issue_codes == ("SERVICE_PERIOD_NOT_MET",)
    assert decision.resolution_ids == ()


def test_priya_initial_state_requires_exit_date_action(harness) -> None:
    intent, state = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, state, suffix="PRIYA-INITIAL")

    decision = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-PRIYA-001",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
    ).journey_decision

    assert decision.state is DecisionState.ACTION_REQUIRED
    assert decision.issue_codes == ("EXIT_DATE_MISSING",)
    assert decision.resolution_ids == ("RES_EXIT",)
    assert decision.blocking_node_ids == ("PREVIOUS_EXIT_DATE_PRESENT",)


def test_corrected_priya_full_re_evaluation_passes(harness) -> None:
    intent, original = harness.load_demo("priya_transfer_missing_exit.json")
    corrected = harness.revised_state(
        original,
        state_version="SYNTH-PRIYA-STATE-V2",
        state_revision=2,
        previous_exit_date="2023-01-31",
    )
    instance = harness.create_instance(intent, original, suffix="PRIYA-CORRECTED")

    decision = harness.evaluate(
        instance,
        intent,
        corrected,
        decision_id="DEC-PRIYA-CORRECTED",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
    ).journey_decision

    assert decision.state is DecisionState.PASS
    assert decision.issue_codes == ()


def test_missing_transfer_capability_is_unable_to_verify(harness) -> None:
    intent, original = harness.load_demo("priya_transfer_missing_exit.json")
    corrected = harness.revised_state(
        original,
        state_version="SYNTH-PRIYA-STATE-V2",
        state_revision=2,
        previous_exit_date="2023-01-31",
    )
    instance = harness.create_instance(intent, original, suffix="PRIYA-NO-ROUTE")

    decision = harness.evaluate(
        instance,
        intent,
        corrected,
        decision_id="DEC-PRIYA-NO-ROUTE",
    ).journey_decision

    assert decision.state is DecisionState.UNABLE_TO_VERIFY
    assert decision.blocking_node_ids == ("TRANSFER_ROUTE_AVAILABLE",)
    assert decision.issue_codes == ()


def test_active_transfer_is_not_applicable(harness) -> None:
    intent, original = harness.load_demo("priya_transfer_missing_exit.json")
    corrected = harness.revised_state(
        original,
        state_version="SYNTH-PRIYA-STATE-V2",
        state_revision=2,
        previous_exit_date="2023-01-31",
    )
    corrected = harness.replace_section(
        corrected,
        "claims",
        active_transfer=True,
    )
    instance = harness.create_instance(intent, original, suffix="PRIYA-ACTIVE")

    decision = harness.evaluate(
        instance,
        intent,
        corrected,
        decision_id="DEC-PRIYA-ACTIVE",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
    ).journey_decision

    assert decision.state is DecisionState.NOT_APPLICABLE
    assert decision.issue_codes == ("TRANSFER_ALREADY_ACTIVE",)


def test_arjun_fails_closed_for_policy_review(harness) -> None:
    intent, state = harness.load_demo("arjun_final_settlement.json")
    instance = harness.create_instance(intent, state, suffix="ARJUN-001")

    result = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-ARJUN-001",
    )

    assert result.journey_decision.state is (
        DecisionState.POLICY_REVIEW_REQUIRED
    )
    assert result.decision_record.ai_used_for_decision is False


def test_identical_inputs_and_context_produce_equal_outputs(harness) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="RAVI-REPLAY")

    first = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-RAVI-REPLAY",
    )
    second = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-RAVI-REPLAY",
    )

    assert first == second
    assert first.journey_decision == second.journey_decision
    assert first.decision_record == second.decision_record


def test_journey_package_has_no_forbidden_runtime_dependencies_or_calls() -> None:
    forbidden_import_roots = {
        "fastapi",
        "httpx",
        "openai",
        "requests",
        "socket",
        "sqlalchemy",
        "sqlite3",
        "urllib",
    }
    forbidden_calls = {"eval", "exec"}

    for path in JOURNEY_PACKAGE.glob("*.py"):
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        imports = {
            alias.name.split(".")[0]
            for node in ast.walk(tree)
            if isinstance(node, (ast.Import, ast.ImportFrom))
            for alias in node.names
        }
        assert imports.isdisjoint(forbidden_import_roots)
        assert not any(
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id in forbidden_calls
            for node in ast.walk(tree)
        )
