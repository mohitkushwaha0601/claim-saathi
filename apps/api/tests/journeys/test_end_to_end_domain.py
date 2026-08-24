"""Cross-phase domain flows without transport, persistence, or government I/O."""

import inspect
from datetime import timedelta

import pytest

from app.domain import (
    CapabilityValue,
    DecisionState,
    IssueResolutionLink,
    JourneyEvaluationResult,
    ResolutionState,
)
from app.journeys import JourneyOrchestrator
from app.journeys.exceptions import ResolutionStartNotAllowedError


def _waiting_resolution(harness, initial, instance):
    created = harness.orchestrator.start_resolution_for_issue(
        journey_instance=instance,
        current_evaluation=initial,
        issue_code="EXIT_DATE_MISSING",
        resolution_instance_id="SYNTH-RESOLUTION-PRIYA-001",
        at=initial.decision_record.evaluated_at,
    )
    started = harness.resolution_navigator.start(
        created,
        at=created.created_at + timedelta(minutes=1),
    )
    return harness.resolution_navigator.wait_for_update(
        started,
        at=created.created_at + timedelta(minutes=2),
    )


def test_priya_resolution_then_full_re_evaluation_creates_new_pass_record(
    harness,
) -> None:
    intent, original = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, original, suffix="PRIYA-E2E")
    capabilities = {"T13-ROUTE-001": CapabilityValue.AVAILABLE}
    first = harness.evaluate(
        instance,
        intent,
        original,
        decision_id="DEC-PRIYA-001",
        capabilities=capabilities,
    )
    waiting = _waiting_resolution(harness, first, instance)
    corrected = harness.revised_state(
        original,
        state_version="SYNTH-PRIYA-STATE-V2",
        state_revision=2,
        previous_exit_date="2023-01-31",
    )

    resolution = harness.resolution_navigator.recheck(
        waiting,
        corrected,
        at=waiting.updated_at + timedelta(minutes=1),
    )
    second = harness.evaluate(
        instance,
        intent,
        corrected,
        decision_id="DEC-PRIYA-002",
        capabilities=capabilities,
        previous=first.decision_record,
        evaluated_at=waiting.updated_at + timedelta(minutes=2),
    )

    assert first.journey_decision.state is DecisionState.ACTION_REQUIRED
    assert resolution.state is ResolutionState.RESOLVED
    assert second.journey_decision.state is DecisionState.PASS
    assert first.decision_record.decision_id == "DEC-PRIYA-001"
    assert second.decision_record.decision_id == "DEC-PRIYA-002"
    assert first.decision_record != second.decision_record


def test_resolution_completion_does_not_mutate_prior_decision(harness) -> None:
    intent, original = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, original, suffix="PRIYA-HISTORY")
    first = harness.evaluate(
        instance,
        intent,
        original,
        decision_id="DEC-PRIYA-HISTORY-001",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
    )
    frozen_snapshot = first.model_dump_json()
    waiting = _waiting_resolution(harness, first, instance)
    corrected = harness.revised_state(
        original,
        state_version="SYNTH-PRIYA-STATE-V2",
        state_revision=2,
        previous_exit_date="2023-01-31",
    )

    resolution = harness.resolution_navigator.recheck(
        waiting,
        corrected,
        at=waiting.updated_at + timedelta(minutes=1),
    )

    assert resolution.state is ResolutionState.RESOLVED
    assert first.model_dump_json() == frozen_snapshot
    assert first.journey_decision.state is DecisionState.ACTION_REQUIRED


def test_incremented_version_without_previous_exit_remains_blocked_everywhere(
    harness,
) -> None:
    intent, original = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, original, suffix="PRIYA-FALSE")
    capabilities = {"T13-ROUTE-001": CapabilityValue.AVAILABLE}
    first = harness.evaluate(
        instance,
        intent,
        original,
        decision_id="DEC-PRIYA-FALSE-001",
        capabilities=capabilities,
    )
    waiting = _waiting_resolution(harness, first, instance)
    version_only = harness.revised_state(
        original,
        state_version="SYNTH-PRIYA-STATE-V2-UNCHANGED",
        state_revision=2,
    )

    resolution = harness.resolution_navigator.recheck(
        waiting,
        version_only,
        at=waiting.updated_at + timedelta(minutes=1),
    )
    second = harness.evaluate(
        instance,
        intent,
        version_only,
        decision_id="DEC-PRIYA-FALSE-002",
        capabilities=capabilities,
        previous=first.decision_record,
    )

    assert resolution.state is ResolutionState.STILL_BLOCKED
    assert second.journey_decision.state is DecisionState.ACTION_REQUIRED
    assert second.journey_decision.issue_codes == ("EXIT_DATE_MISSING",)


def test_current_record_only_exit_remains_blocked_everywhere(harness) -> None:
    intent, original = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, original, suffix="PRIYA-WRONG")
    capabilities = {"T13-ROUTE-001": CapabilityValue.AVAILABLE}
    first = harness.evaluate(
        instance,
        intent,
        original,
        decision_id="DEC-PRIYA-WRONG-001",
        capabilities=capabilities,
    )
    waiting = _waiting_resolution(harness, first, instance)
    wrong_record = harness.revised_state(
        original,
        state_version="SYNTH-PRIYA-STATE-V2-WRONG-RECORD",
        state_revision=2,
        current_exit_date="2026-08-01",
    )

    resolution = harness.resolution_navigator.recheck(
        waiting,
        wrong_record,
        at=waiting.updated_at + timedelta(minutes=1),
    )
    second = harness.evaluate(
        instance,
        intent,
        wrong_record,
        decision_id="DEC-PRIYA-WRONG-002",
        capabilities=capabilities,
        previous=first.decision_record,
    )

    assert resolution.state is ResolutionState.STILL_BLOCKED
    assert second.journey_decision.state is DecisionState.ACTION_REQUIRED


def test_resolution_starts_only_for_issue_attached_to_current_decision(
    harness,
) -> None:
    intent, state = harness.load_demo("ravi_partial_ready.json")
    instance = harness.create_instance(intent, state, suffix="RAVI-NO-ISSUE")
    current = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-RAVI-NO-ISSUE",
    )

    with pytest.raises(ResolutionStartNotAllowedError):
        harness.orchestrator.start_resolution_for_issue(
            journey_instance=instance,
            current_evaluation=current,
            issue_code="EXIT_DATE_MISSING",
            resolution_instance_id="SYNTH-RESOLUTION-DENIED",
            at=current.decision_record.evaluated_at,
        )


def test_client_cannot_supply_an_arbitrary_resolution_identifier() -> None:
    parameters = inspect.signature(
        JourneyOrchestrator.start_resolution_for_issue
    ).parameters

    assert "resolution_id" not in parameters


def test_tampered_resolution_link_is_rejected_by_approved_catalog(harness) -> None:
    intent, state = harness.load_demo("priya_transfer_missing_exit.json")
    instance = harness.create_instance(intent, state, suffix="PRIYA-TAMPER")
    current = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-PRIYA-TAMPER",
        capabilities={"T13-ROUTE-001": CapabilityValue.AVAILABLE},
    )
    altered_decision = current.journey_decision.model_copy(
        update={
            "resolution_ids": ("RES_UNAPPROVED",),
            "issue_resolution_links": (
                IssueResolutionLink(
                    issue_code="EXIT_DATE_MISSING",
                    resolution_id="RES_UNAPPROVED",
                ),
            ),
        }
    )
    altered = JourneyEvaluationResult(
        graph_evaluation=current.graph_evaluation,
        journey_decision=altered_decision,
        decision_record=current.decision_record,
    )

    with pytest.raises(ResolutionStartNotAllowedError):
        harness.orchestrator.start_resolution_for_issue(
            journey_instance=instance,
            current_evaluation=altered,
            issue_code="EXIT_DATE_MISSING",
            resolution_instance_id="SYNTH-RESOLUTION-TAMPERED",
            at=current.decision_record.evaluated_at,
        )


def test_arjun_policy_review_output_contains_no_selected_wait_value(
    harness,
) -> None:
    intent, state = harness.load_demo("arjun_final_settlement.json")
    instance = harness.create_instance(intent, state, suffix="ARJUN-SAFETY")

    result = harness.evaluate(
        instance,
        intent,
        state,
        decision_id="DEC-ARJUN-SAFETY",
    )

    assert result.journey_decision.state is (
        DecisionState.POLICY_REVIEW_REQUIRED
    )
    assert all(item.observed_value is None for item in result.decision_record.rule_results)
    assert result.decision_record.ai_used_for_decision is False

