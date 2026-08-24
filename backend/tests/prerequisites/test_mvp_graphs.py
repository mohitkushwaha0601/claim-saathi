"""MVP graph tests using Phase 2 only to prepare upstream RuleResults."""

import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import pytest

from app.domain import (
    CapabilityValue,
    CitizenIntent,
    CitizenState,
    DecisionState,
    PrerequisiteGraphDefinition,
    PrerequisiteGraphEvaluation,
    RuleResult,
)
from app.policies import PolicyEngine, load_policy_registry
from app.prerequisites import evaluate_graph, load_graph

BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent
GRAPH_DIRECTORY = REPOSITORY_ROOT / "journeys" / "epfo"
POLICY_DIRECTORY = REPOSITORY_ROOT / "policies" / "epfo"
DEMO_DIRECTORY = REPOSITORY_ROOT / "fixtures" / "demo"


@pytest.fixture(scope="module")
def policy_engine() -> PolicyEngine:
    return PolicyEngine(load_policy_registry(POLICY_DIRECTORY))


def load_demo(name: str) -> tuple[CitizenIntent, CitizenState]:
    payload: dict[str, Any] = json.loads(
        (DEMO_DIRECTORY / name).read_text(encoding="utf-8")
    )
    return (
        CitizenIntent.model_validate(payload["intent"]),
        CitizenState.model_validate(payload["citizen_state"]),
    )


def replace_section(
    state: CitizenState,
    section: str,
    **updates: object,
) -> CitizenState:
    payload = state.model_dump(mode="json")
    payload[section].update(updates)
    return CitizenState.model_validate(payload)


def with_previous_exit_date(state: CitizenState) -> CitizenState:
    payload = state.model_dump(mode="json")
    for record in payload["employment"]["records"]:
        if record["employment_type"] == "PREVIOUS":
            record["exit_date"] = "2023-01-31"
            record["exit_record_status"] = "RECORDED"
    return CitizenState.model_validate(payload)


def evaluate_rules(
    engine: PolicyEngine,
    graph: PrerequisiteGraphDefinition,
    *,
    policy_id: str,
    policy_version: str,
    state: CitizenState,
    intent: CitizenIntent,
    capabilities: Mapping[str, CapabilityValue] | None = None,
) -> tuple[RuleResult, ...]:
    return tuple(
        engine.evaluate_rule(
            policy_id=policy_id,
            policy_version=policy_version,
            rule_id=node.rule_ids[0],
            citizen_state=state,
            citizen_intent=intent,
            capability_results=capabilities,
        )
        for node in graph.nodes
        if node.rule_ids
    )


def node_states(
    evaluation: PrerequisiteGraphEvaluation,
) -> dict[str, DecisionState]:
    return {result.node_id: result.state for result in evaluation.node_results}


def evaluate_partial(
    engine: PolicyEngine,
    intent: CitizenIntent,
    state: CitizenState,
) -> PrerequisiteGraphEvaluation:
    graph = load_graph(GRAPH_DIRECTORY / "partial_withdrawal.v1.json")
    rule_results = evaluate_rules(
        engine,
        graph,
        policy_id="EPFO-PARTIAL-WITHDRAWAL",
        policy_version="1.0.0",
        state=state,
        intent=intent,
    )
    return evaluate_graph(graph, rule_results)


def evaluate_transfer(
    engine: PolicyEngine,
    intent: CitizenIntent,
    state: CitizenState,
    capability: CapabilityValue,
) -> PrerequisiteGraphEvaluation:
    graph = load_graph(GRAPH_DIRECTORY / "transfer.v1.json")
    rule_results = evaluate_rules(
        engine,
        graph,
        policy_id="EPFO-TRANSFER",
        policy_version="1.0.0",
        state=state,
        intent=intent,
        capabilities={"T13-ROUTE-001": capability},
    )
    return evaluate_graph(graph, rule_results)


def test_ravi_prerequisite_graph_passes(
    policy_engine: PolicyEngine,
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")

    evaluation = evaluate_partial(policy_engine, intent, state)
    states = node_states(evaluation)

    assert all(
        result.state is DecisionState.PASS
        for result in evaluation.node_results
        if result.rule_id is not None
    )
    assert states["ONLINE_ACCESS_READY"] is DecisionState.PASS
    assert evaluation.root_state is DecisionState.PASS
    assert evaluation.non_pass_leaf_node_ids == ()


def test_eight_month_service_makes_graph_not_eligible(
    policy_engine: PolicyEngine,
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")
    state = replace_section(state, "service", total_service_months=8)

    evaluation = evaluate_partial(policy_engine, intent, state)

    assert (
        node_states(evaluation)["SERVICE_REQUIREMENT"]
        is DecisionState.NOT_ELIGIBLE
    )
    assert evaluation.root_state is DecisionState.NOT_ELIGIBLE


def test_definite_not_eligible_precedes_unverifiable_bank_but_preserves_both(
    policy_engine: PolicyEngine,
) -> None:
    intent, state = load_demo("ravi_partial_ready.json")
    state = replace_section(state, "service", total_service_months=8)
    state = replace_section(state, "bank", verification_status="UNAVAILABLE")

    evaluation = evaluate_partial(policy_engine, intent, state)
    states = node_states(evaluation)

    assert states["SERVICE_REQUIREMENT"] is DecisionState.NOT_ELIGIBLE
    assert states["BANK_READY"] is DecisionState.UNABLE_TO_VERIFY
    assert evaluation.root_state is DecisionState.NOT_ELIGIBLE
    assert set(evaluation.non_pass_leaf_node_ids) == {
        "BANK_READY",
        "SERVICE_REQUIREMENT",
    }


def test_priya_missing_exit_date_requires_action(
    policy_engine: PolicyEngine,
) -> None:
    intent, state = load_demo("priya_transfer_missing_exit.json")

    evaluation = evaluate_transfer(
        policy_engine,
        intent,
        state,
        CapabilityValue.AVAILABLE,
    )

    assert (
        node_states(evaluation)["PREVIOUS_EXIT_DATE_PRESENT"]
        is DecisionState.ACTION_REQUIRED
    )
    assert evaluation.root_state is DecisionState.ACTION_REQUIRED
    assert evaluation.non_pass_leaf_node_ids == ("PREVIOUS_EXIT_DATE_PRESENT",)


def test_priya_test_only_exit_date_recheck_passes(
    policy_engine: PolicyEngine,
) -> None:
    intent, state = load_demo("priya_transfer_missing_exit.json")
    updated_state = with_previous_exit_date(state)

    evaluation = evaluate_transfer(
        policy_engine,
        intent,
        updated_state,
        CapabilityValue.AVAILABLE,
    )

    assert evaluation.root_state is DecisionState.PASS
    assert evaluation.non_pass_leaf_node_ids == ()


def test_transfer_without_previous_employment_is_not_applicable(
    policy_engine: PolicyEngine,
) -> None:
    intent, state = load_demo("priya_transfer_missing_exit.json")
    current_records = tuple(
        record
        for record in state.employment.records
        if record.employment_type.value == "CURRENT"
    )
    state = replace_section(state, "employment", records=current_records)

    evaluation = evaluate_transfer(
        policy_engine,
        intent,
        state,
        CapabilityValue.AVAILABLE,
    )

    assert (
        node_states(evaluation)["PREVIOUS_EMPLOYMENT_EXISTS"]
        is DecisionState.NOT_APPLICABLE
    )
    assert evaluation.root_state is DecisionState.NOT_APPLICABLE


def test_unknown_transfer_capability_is_unable_to_verify(
    policy_engine: PolicyEngine,
) -> None:
    intent, state = load_demo("priya_transfer_missing_exit.json")
    state = with_previous_exit_date(state)

    evaluation = evaluate_transfer(
        policy_engine,
        intent,
        state,
        CapabilityValue.UNKNOWN,
    )

    assert (
        node_states(evaluation)["TRANSFER_ROUTE_AVAILABLE"]
        is DecisionState.UNABLE_TO_VERIFY
    )
    assert evaluation.root_state is DecisionState.UNABLE_TO_VERIFY


def test_active_transfer_is_not_applicable(
    policy_engine: PolicyEngine,
) -> None:
    intent, state = load_demo("priya_transfer_missing_exit.json")
    state = with_previous_exit_date(state)
    state = replace_section(state, "claims", active_transfer=True)

    evaluation = evaluate_transfer(
        policy_engine,
        intent,
        state,
        CapabilityValue.AVAILABLE,
    )

    assert (
        node_states(evaluation)["NO_ACTIVE_TRANSFER"]
        is DecisionState.NOT_APPLICABLE
    )
    assert evaluation.root_state is DecisionState.NOT_APPLICABLE


def test_arjun_final_settlement_fails_closed_for_policy_review(
    policy_engine: PolicyEngine,
) -> None:
    intent, state = load_demo("arjun_final_settlement.json")
    graph = load_graph(
        GRAPH_DIRECTORY / "final_settlement.conflict_demo.json"
    )
    rule_results = evaluate_rules(
        policy_engine,
        graph,
        policy_id="EPFO-FINAL-SETTLEMENT-CONFLICT-DEMO",
        policy_version="CONFLICT-DEMO-1",
        state=state,
        intent=intent,
    )

    evaluation = evaluate_graph(graph, rule_results)

    assert (
        node_states(evaluation)["POLICY_VERIFIED"]
        is DecisionState.POLICY_REVIEW_REQUIRED
    )
    assert evaluation.root_state is DecisionState.POLICY_REVIEW_REQUIRED
