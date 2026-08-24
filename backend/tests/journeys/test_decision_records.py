"""Immutable audit provenance and stale trusted-state safety tests."""

from datetime import timedelta

import pytest
from pydantic import ValidationError

from app.domain import CapabilityValue, DecisionRecord, DecisionState
from app.journeys.exceptions import (
    JourneyVersionMismatchError,
    StaleCitizenStateError,
)


def test_decision_record_captures_all_reproducibility_versions(harness) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="AUDIT-RAVI")

    record = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-AUDIT-RAVI",
    ).decision_record

    assert record.citizen_state_version == "SYNTH-RAVI-STATE-V1"
    assert record.citizen_state_revision == 1
    assert record.policy_version == "1.0.0"
    assert record.graph_version == "1.0.0"
    assert record.journey_definition_version == 1


def test_decision_record_preserves_all_rule_results_in_graph_order(
    harness,
) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="AUDIT-RULES")

    record = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-AUDIT-RULES",
    ).decision_record

    assert tuple(result.rule_id for result in record.rule_results) == (
        "P31-UAN-001",
        "P31-AADHAAR-001",
        "P31-BANK-001",
        "P31-SERVICE-001",
        "P31-AMOUNT-001",
    )


def test_source_ids_include_only_sources_used_and_preserve_order(harness) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="AUDIT-SOURCES")

    record = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-AUDIT-SOURCES",
    ).decision_record

    assert record.source_ids == ("SRC-EPFO-PARTIAL-2026",)
    assert "SRC-EPFO-FORMS" not in record.source_ids
    assert "SRC-EPFO-EXIT-RESOLUTION" not in record.source_ids


def test_transfer_record_contains_only_date_of_exit_rule_source(harness) -> None:
    intent, state = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, state, suffix="AUDIT-PRIYA")

    record = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-AUDIT-PRIYA",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
    ).decision_record

    assert record.source_ids == ("SRC-EPFO-TRANSFER-DOE",)
    assert record.issue_codes == ("EXIT_DATE_MISSING",)


def test_ai_used_for_decision_is_false(harness) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="AUDIT-NO-AI")

    record = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-AUDIT-NO-AI",
    ).decision_record

    assert record.ai_used_for_decision is False


def test_ai_used_for_decision_cannot_be_true(harness) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="AUDIT-AI-GUARD")
    record = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-AUDIT-AI-GUARD",
    ).decision_record
    payload = record.model_dump(mode="json")
    payload["ai_used_for_decision"] = True

    with pytest.raises(ValidationError):
        DecisionRecord.model_validate(payload)


def test_decision_record_is_immutable(harness) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="AUDIT-FROZEN")
    record = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-AUDIT-FROZEN",
    ).decision_record

    with pytest.raises(ValidationError):
        record.journey_state = DecisionState.ACTION_REQUIRED  # type: ignore[misc]


def test_lower_state_revision_recheck_is_rejected(harness) -> None:
    intent, state = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, state, suffix="STALE-LOWER")
    previous = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-STALE-BASE",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
    ).decision_record
    older = state.model_copy(
        update={"state_version": "SYNTH-PRIYA-STATE-OLDER", "state_revision": 0}
    )

    with pytest.raises(StaleCitizenStateError):
        harness.evaluate(
            instance,
            intent,
            older,
            decision_id="DEC-STALE-OLDER",
            capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
            previous=previous,
        )


def test_equal_state_revision_recheck_is_allowed_and_reproduces_state(
    harness,
) -> None:
    intent, state = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, state, suffix="STALE-EQUAL")
    first = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-EQUAL-001",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
    )

    second = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-EQUAL-002",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
        previous=first.decision_record,
        evaluated_at=first.decision_record.evaluated_at + timedelta(minutes=1),
    )

    assert second.journey_decision.state is first.journey_decision.state
    assert second.decision_record.citizen_state_revision == 1


def test_higher_state_revision_recheck_is_allowed(harness) -> None:
    intent, state = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, state, suffix="STALE-HIGHER")
    first = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-HIGHER-001",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
    )
    newer = harness.revised_state(
        state,
        state_version="SYNTH-PRIYA-STATE-V2",
        state_revision=2,
        previous_exit_date="2023-01-31",
    )

    second = harness.evaluate(
        instance,
        intent,
        newer,
        decision_id="DEC-HIGHER-002",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
        previous=first.decision_record,
    )

    assert second.journey_decision.state is DecisionState.PASS
    assert second.decision_record.citizen_state_revision == 2


@pytest.mark.parametrize(
    ("version_kind", "wrong_version"),
    [("policy", "WRONG-POLICY"), ("graph", "WRONG-GRAPH")],
)
def test_selected_config_version_must_match_reviewed_definition(
    harness,
    version_kind: str,
    wrong_version: str,
) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="VERSION-MISMATCH")
    definition = harness.catalog.get_by_journey(instance.journey_id)
    arguments = {
        "journey_instance": instance,
        "citizen_intent": intent,
        "citizen_state": state,
        "policy_version": definition.policy_version,
        "graph_version": definition.prerequisite_graph_version,
        "evaluation_context": {
            "decision_id": "DEC-VERSION-MISMATCH",
            "evaluated_at": "2026-08-24T12:00:00Z",
        },
    }
    arguments[f"{version_kind}_version"] = wrong_version

    with pytest.raises(JourneyVersionMismatchError):
        harness.orchestrator.evaluate(**arguments)

