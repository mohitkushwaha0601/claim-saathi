"""Behavioral tests for Phase 1 domain contracts."""

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest
from pydantic import BaseModel, ValidationError

from app.domain import (
    CitizenIntent,
    CitizenState,
    DecisionRecord,
    DecisionState,
    IntentGoal,
    JourneyDecision,
    JourneyDefinition,
    JourneyId,
    PolicyLifecycleStatus,
    PolicyOperator,
    PolicyRule,
    PolicyRuleType,
    PolicySource,
    PrerequisiteNode,
    ResolutionActor,
    ResolutionState,
    ResolutionWorkflow,
    RuleResult,
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
DEMO_FIXTURE_DIRECTORY = REPOSITORY_ROOT / "fixtures" / "demo"
DEMO_FIXTURE_NAMES = (
    "ravi_partial_ready.json",
    "priya_transfer_missing_exit.json",
    "arjun_final_settlement.json",
)


def load_demo_payload(fixture_name: str) -> dict[str, Any]:
    """Load a synthetic persona payload from the repository fixture set."""

    fixture_path = DEMO_FIXTURE_DIRECTORY / fixture_name
    return json.loads(fixture_path.read_text(encoding="utf-8"))


def parse_demo_payload(
    payload: dict[str, Any],
) -> tuple[CitizenIntent, CitizenState]:
    """Validate both typed contracts carried by a demo persona fixture."""

    intent = CitizenIntent.model_validate(payload["intent"])
    citizen_state = CitizenState.model_validate(payload["citizen_state"])
    return intent, citizen_state


def build_decision_record() -> DecisionRecord:
    """Build a synthetic audit contract without encoding a policy rule."""

    rule_result = RuleResult(
        rule_id="SYNTH-RULE-CONTRACT-001",
        state=DecisionState.UNABLE_TO_VERIFY,
        source_id="SYNTH-SOURCE-CONTRACT-001",
        policy_version="SYNTH-POLICY-V0",
    )
    return DecisionRecord(
        decision_id="SYNTH-DECISION-001",
        journey_instance_id="SYNTH-JOURNEY-INSTANCE-001",
        citizen_state_version="SYNTH-STATE-V1",
        policy_version="SYNTH-POLICY-V0",
        evaluated_at=datetime(2026, 8, 24, 12, 0, tzinfo=UTC),
        journey_id=JourneyId.PF_TRANSFER,
        journey_state=DecisionState.UNABLE_TO_VERIFY,
        rule_results=(rule_result,),
        source_ids=("SYNTH-SOURCE-CONTRACT-001",),
        ai_used_for_decision=False,
    )


def build_configuration_contracts() -> tuple[BaseModel, ...]:
    """Build synthetic schema examples, never executable government policy."""

    source = PolicySource(
        source_id="SYNTH-SOURCE-CONTRACT-001",
        authority="Synthetic Test Authority — Not Government",
        title="Synthetic Contract Source",
        document_type="SYNTHETIC_TEST_DOCUMENT",
        status=PolicyLifecycleStatus.DRAFT,
    )
    rule = PolicyRule(
        rule_id="SYNTH-RULE-CONTRACT-001",
        version="SYNTH-RULE-V0",
        journeys=(JourneyId.PF_TRANSFER,),
        rule_type=PolicyRuleType.PREREQUISITE,
        input_path="synthetic_fact.status",
        operator=PolicyOperator.EQUALS,
        expected="SYNTHETIC_EXPECTED_VALUE",
        pass_state=DecisionState.PASS,
        failure_state=DecisionState.UNABLE_TO_VERIFY,
        issue_code="SYNTH-CONTRACT-ISSUE",
        source_id=source.source_id,
        status=PolicyLifecycleStatus.DRAFT,
    )
    node = PrerequisiteNode(
        node_id="SYNTH-NODE-ROOT",
        label="Synthetic Contract Node",
        rule_ids=(rule.rule_id,),
    )
    resolution = ResolutionWorkflow(
        resolution_id="SYNTH-RESOLUTION-CONTRACT-001",
        issue_code=rule.issue_code,
        title="Synthetic Contract Resolution",
        actor=ResolutionActor.CITIZEN,
        approved_steps=("Synthetic approved step placeholder.",),
        official_source_ids=(source.source_id,),
        success_condition="Synthetic contract condition.",
    )
    journey = JourneyDefinition(
        journey_id=JourneyId.PF_TRANSFER,
        display_name="Synthetic Transfer Contract",
        citizen_goal=IntentGoal.TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE,
        prerequisite_root=node.node_id,
        policy_rule_ids=(rule.rule_id,),
        resolution_ids=(resolution.resolution_id,),
    )
    return source, rule, node, resolution, journey


@pytest.mark.parametrize("fixture_name", DEMO_FIXTURE_NAMES)
def test_demo_fixture_deserializes_into_typed_models(fixture_name: str) -> None:
    payload = load_demo_payload(fixture_name)

    intent, citizen_state = parse_demo_payload(payload)

    assert intent.goal in IntentGoal
    assert citizen_state.is_synthetic is True
    assert citizen_state.citizen_id.startswith("SYNTH-")


def test_demo_fixture_set_contains_exactly_three_personas() -> None:
    fixture_names = {path.name for path in DEMO_FIXTURE_DIRECTORY.glob("*.json")}

    assert fixture_names == set(DEMO_FIXTURE_NAMES)


def test_closed_domain_enums_contain_only_approved_values() -> None:
    assert {state.value for state in DecisionState} == {
        "PASS",
        "ACTION_REQUIRED",
        "NOT_ELIGIBLE",
        "UNABLE_TO_VERIFY",
        "NOT_APPLICABLE",
        "POLICY_REVIEW_REQUIRED",
    }
    assert {journey_id.value for journey_id in JourneyId} == {
        "PF_PARTIAL_WITHDRAWAL",
        "PF_TRANSFER",
        "PF_FINAL_SETTLEMENT",
    }
    assert {state.value for state in ResolutionState} == {
        "CREATED",
        "CITIZEN_ACTION_REQUIRED",
        "EXTERNAL_ACTION_REQUIRED",
        "WAITING_FOR_UPDATE",
        "RECHECKING",
        "RESOLVED",
        "STILL_BLOCKED",
    }


def test_negative_requested_amount_is_rejected() -> None:
    with pytest.raises(ValidationError):
        CitizenIntent(
            goal=IntentGoal.ACCESS_SOME_PF_FUNDS,
            requested_amount_rupees=-1,
        )


def test_requested_amount_must_be_integer_rupees() -> None:
    with pytest.raises(ValidationError):
        CitizenIntent(
            goal=IntentGoal.ACCESS_SOME_PF_FUNDS,
            requested_amount_rupees=1.5,
        )


def test_negative_pf_balance_is_rejected() -> None:
    payload = load_demo_payload("ravi_partial_ready.json")["citizen_state"]
    payload["pf"]["available_balance_rupees"] = -1

    with pytest.raises(ValidationError):
        CitizenState.model_validate(payload)


@pytest.mark.parametrize(
    ("section", "field_name"),
    [
        ("access", "uan_number"),
        ("identity", "aadhaar_number"),
        ("identity", "pan_number"),
        ("bank", "bank_account_number"),
    ],
)
def test_citizen_state_rejects_raw_identifier_fields(
    section: str,
    field_name: str,
) -> None:
    payload = load_demo_payload("ravi_partial_ready.json")["citizen_state"]
    payload[section][field_name] = "SYNTHETIC-RAW-ID-NOT-ALLOWED"

    with pytest.raises(ValidationError):
        CitizenState.model_validate(payload)


@pytest.mark.parametrize("synthetic_value", [False, None])
def test_citizen_state_requires_explicit_true_synthetic_marker(
    synthetic_value: bool | None,
) -> None:
    payload = load_demo_payload("ravi_partial_ready.json")["citizen_state"]
    if synthetic_value is None:
        payload.pop("is_synthetic")
    else:
        payload["is_synthetic"] = synthetic_value

    with pytest.raises(ValidationError):
        CitizenState.model_validate(payload)


def test_invalid_domain_enum_value_is_rejected() -> None:
    with pytest.raises(ValidationError):
        JourneyDecision(
            journey_id=JourneyId.PF_TRANSFER,
            state="MAYBE",
            policy_version="SYNTH-POLICY-V0",
            decision_id="SYNTH-DECISION-001",
        )


def test_decision_record_accepts_ai_used_for_decision_false() -> None:
    record = build_decision_record()

    assert record.ai_used_for_decision is False


def test_decision_record_rejects_ai_used_for_decision_true() -> None:
    payload = build_decision_record().model_dump(mode="python")
    payload["ai_used_for_decision"] = True

    with pytest.raises(ValidationError):
        DecisionRecord.model_validate(payload)


def test_journey_decision_has_no_readiness_or_confidence_fields() -> None:
    decision = JourneyDecision(
        journey_id=JourneyId.PF_TRANSFER,
        state=DecisionState.UNABLE_TO_VERIFY,
        policy_version="SYNTH-POLICY-V0",
        decision_id="SYNTH-DECISION-001",
    )

    assert "readiness_score" not in JourneyDecision.model_fields
    assert "confidence" not in JourneyDecision.model_fields
    assert "readiness_score" not in decision.model_dump(mode="json")
    assert "confidence" not in decision.model_dump(mode="json")


def test_missing_exit_date_is_valid_citizen_data() -> None:
    payload = load_demo_payload("priya_transfer_missing_exit.json")

    _, citizen_state = parse_demo_payload(payload)

    assert citizen_state.employment.records[0].exit_date is None


@pytest.mark.parametrize("fixture_name", DEMO_FIXTURE_NAMES)
def test_demo_models_round_trip_through_json_compatible_data(
    fixture_name: str,
) -> None:
    payload = load_demo_payload(fixture_name)
    intent, citizen_state = parse_demo_payload(payload)

    intent_json = intent.model_dump_json()
    citizen_state_json = citizen_state.model_dump_json()

    assert CitizenIntent.model_validate_json(intent_json) == intent
    assert CitizenState.model_validate_json(citizen_state_json) == citizen_state
    json.dumps(intent.model_dump(mode="json"), sort_keys=True)
    json.dumps(citizen_state.model_dump(mode="json"), sort_keys=True)


def test_decision_record_round_trips_through_json() -> None:
    record = build_decision_record()

    serialized = record.model_dump_json()

    assert DecisionRecord.model_validate_json(serialized) == record


def test_configuration_contracts_round_trip_through_json() -> None:
    for contract in build_configuration_contracts():
        serialized = contract.model_dump_json()

        assert contract.__class__.model_validate_json(serialized) == contract
        json.dumps(contract.model_dump(mode="json"), sort_keys=True)
