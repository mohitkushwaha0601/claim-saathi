"""Tests that reviewed JSON policy configuration stays narrowly scoped."""

import ast
import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.domain import (
    DecisionState,
    IntegerRatio,
    JourneyId,
    PolicyEvaluatorId,
    PolicyLifecycleStatus,
    PolicyOperator,
    PolicyRule,
    PolicyRuleDisposition,
    PolicyRuleType,
    PolicySourceStatus,
    PolicyVersion,
)
from app.policies import PolicyRegistry

BACKEND_ROOT = Path(__file__).resolve().parents[2]
REPOSITORY_ROOT = BACKEND_ROOT.parent
POLICY_DIRECTORY = REPOSITORY_ROOT / "policies" / "epfo"
POLICY_PACKAGE = BACKEND_ROOT / "app" / "policies"


def test_policy_directory_contains_only_required_configuration_files() -> None:
    assert {path.name for path in POLICY_DIRECTORY.glob("*.json")} == {
        "sources.json",
        "partial_withdrawal.v1.json",
        "transfer.v1.json",
        "final_settlement.conflict_demo.json",
    }


def test_source_registry_contains_exact_reviewed_sources(
    policy_registry: PolicyRegistry,
) -> None:
    sources = policy_registry.source_registry.all()

    assert {source.source_id for source in sources} == {
        "SRC-EPFO-PARTIAL-2026",
        "SRC-EPFO-TRANSFER-DOE",
        "SRC-EPFO-FORMS",
        "SRC-EPFO-EXIT-RESOLUTION",
    }
    assert all(source.status is PolicySourceStatus.ACTIVE for source in sources)
    assert all(source.verified_at is not None for source in sources)


def test_policy_enums_have_only_phase_two_semantics() -> None:
    assert {rule_type.value for rule_type in PolicyRuleType} == {
        "DATA_CHECK",
        "POLICY_RULE",
        "AUTHORITATIVE_CAPABILITY",
    }
    assert {status.value for status in PolicyLifecycleStatus} == {
        "DRAFT",
        "REVIEWED",
        "TESTED",
        "APPROVED",
        "ACTIVE",
        "SUPERSEDED",
    }


def test_partial_withdrawal_policy_contains_only_supplied_rules(
    policy_registry: PolicyRegistry,
) -> None:
    policy = policy_registry.get_policy("EPFO-PARTIAL-WITHDRAWAL", "1.0.0")

    assert {rule.rule_id for rule in policy.rules} == {
        "P31-SERVICE-001",
        "P31-AMOUNT-001",
        "P31-UAN-001",
        "P31-AADHAAR-001",
        "P31-BANK-001",
    }
    assert {
        rule.source_id
        for rule in policy.rules
        if rule.rule_type is PolicyRuleType.POLICY_RULE
    } == {"SRC-EPFO-PARTIAL-2026"}


def test_partial_amount_rule_uses_typed_integer_ratio(
    policy_registry: PolicyRegistry,
) -> None:
    rule = policy_registry.get_rule(
        "EPFO-PARTIAL-WITHDRAWAL",
        "1.0.0",
        "P31-AMOUNT-001",
    )

    assert isinstance(rule.expected, IntegerRatio)
    assert rule.expected.numerator == 75
    assert rule.expected.denominator == 100


def test_named_75_percent_evaluator_rejects_a_different_ratio(
    policy_registry: PolicyRegistry,
) -> None:
    rule = policy_registry.get_rule(
        "EPFO-PARTIAL-WITHDRAWAL",
        "1.0.0",
        "P31-AMOUNT-001",
    )
    payload = rule.model_dump(mode="json")
    payload["expected"] = {"numerator": 3, "denominator": 4}

    with pytest.raises(ValidationError):
        PolicyRule.model_validate(payload)


def test_named_policy_evaluator_cannot_be_reclassified_as_data_check(
    policy_registry: PolicyRegistry,
) -> None:
    rule = policy_registry.get_rule(
        "EPFO-PARTIAL-WITHDRAWAL",
        "1.0.0",
        "P31-AMOUNT-001",
    )
    payload = rule.model_dump(mode="json")
    payload["rule_type"] = "DATA_CHECK"

    with pytest.raises(ValidationError):
        PolicyRule.model_validate(payload)


def test_named_data_evaluator_rejects_ignored_expected_data() -> None:
    with pytest.raises(ValidationError):
        PolicyRule(
            rule_id="SYNTH-IGNORED-OPERAND",
            version="SYNTH-V1",
            requirement_id="SYNTH-IGNORED-OPERAND",
            journeys=(JourneyId.PF_TRANSFER,),
            rule_type=PolicyRuleType.DATA_CHECK,
            evaluator_id=PolicyEvaluatorId.PREVIOUS_EMPLOYMENT_EXISTS,
            expected=True,
            pass_state=DecisionState.PASS,
            failure_state=DecisionState.NOT_APPLICABLE,
            status=PolicyLifecycleStatus.ACTIVE,
        )


def test_transfer_policy_contains_only_supplied_rules(
    policy_registry: PolicyRegistry,
) -> None:
    policy = policy_registry.get_policy("EPFO-TRANSFER", "1.0.0")

    assert {rule.rule_id for rule in policy.rules} == {
        "T13-PREVIOUS-EMPLOYMENT-001",
        "T13-CURRENT-EMPLOYMENT-001",
        "T13-DOE-001",
        "T13-ACTIVE-TRANSFER-001",
        "T13-ALREADY-COMPLETE-001",
        "T13-ROUTE-001",
    }
    sourced_rules = {rule.rule_id: rule.source_id for rule in policy.rules}
    assert sourced_rules["T13-DOE-001"] == "SRC-EPFO-TRANSFER-DOE"
    assert sourced_rules["T13-ROUTE-001"] is None


def test_forms_source_is_process_metadata_not_eligibility_policy(
    policy_registry: PolicyRegistry,
) -> None:
    forms_source = policy_registry.source_registry.get("SRC-EPFO-FORMS")
    active_rule_source_ids = {
        rule.source_id
        for policy_id, version in (
            ("EPFO-PARTIAL-WITHDRAWAL", "1.0.0"),
            ("EPFO-TRANSFER", "1.0.0"),
        )
        for rule in policy_registry.active_rules(policy_id, version)
    }

    assert forms_source.source_id not in active_rule_source_ids
    assert forms_source.scope is not None
    assert all(
        label in forms_source.scope
        for label in ("Form 31", "Form 13", "Form 19")
    )
    assert "do not establish eligibility" in (forms_source.notes or "")


def test_transfer_faq_source_is_narrowly_scoped(
    policy_registry: PolicyRegistry,
) -> None:
    source = policy_registry.source_registry.get("SRC-EPFO-TRANSFER-DOE")

    assert source.scope is not None
    assert "Date of Exit" in source.scope
    assert "legacy or stale" in (source.notes or "")


def test_final_settlement_demo_has_no_executable_or_numeric_wait_period(
    policy_registry: PolicyRegistry,
) -> None:
    policy = policy_registry.get_policy(
        "EPFO-FINAL-SETTLEMENT-CONFLICT-DEMO",
        "CONFLICT-DEMO-1",
    )
    rule = policy.rules[0]
    raw_configuration = json.loads(
        (POLICY_DIRECTORY / "final_settlement.conflict_demo.json").read_text(
            encoding="utf-8"
        )
    )

    assert policy.is_conflict_demo is True
    assert rule.disposition is PolicyRuleDisposition.POLICY_REVIEW_REQUIRED
    assert rule.input_path is None
    assert rule.operator is None
    assert rule.expected is None
    assert not any(
        isinstance(value, int) and not isinstance(value, bool)
        for value in _walk_json_values(raw_configuration)
    )


def test_conflict_demo_cannot_contain_an_executable_rule() -> None:
    executable_rule = PolicyRule(
        rule_id="SYNTH-EXECUTABLE-DEMO-RULE",
        version="SYNTH-DEMO-V1",
        requirement_id="SYNTH-DEMO-REQUIREMENT",
        journeys=(JourneyId.PF_FINAL_SETTLEMENT,),
        rule_type=PolicyRuleType.DATA_CHECK,
        input_path="employment.currently_employed",
        operator=PolicyOperator.EQUALS,
        expected=False,
        pass_state=DecisionState.PASS,
        failure_state=DecisionState.NOT_APPLICABLE,
        status=PolicyLifecycleStatus.ACTIVE,
    )

    with pytest.raises(ValidationError):
        PolicyVersion(
            policy_id="SYNTH-UNSAFE-CONFLICT-DEMO",
            version="SYNTH-DEMO-V1",
            journey_id=JourneyId.PF_FINAL_SETTLEMENT,
            status=PolicyLifecycleStatus.ACTIVE,
            rules=(executable_rule,),
            is_conflict_demo=True,
        )


def _walk_json_values(value: object) -> tuple[object, ...]:
    if isinstance(value, dict):
        return tuple(
            child
            for nested in value.values()
            for child in _walk_json_values(nested)
        )
    if isinstance(value, list):
        return tuple(
            child for nested in value for child in _walk_json_values(nested)
        )
    return (value,)


def test_policy_engine_has_no_ai_network_or_dynamic_execution_imports() -> None:
    forbidden_import_roots = {
        "openai",
        "anthropic",
        "httpx",
        "requests",
        "socket",
        "urllib",
    }
    forbidden_calls = {"eval", "exec"}

    for path in POLICY_PACKAGE.glob("*.py"):
        syntax_tree = ast.parse(path.read_text(encoding="utf-8"))
        imports: set[str] = set()
        for node in ast.walk(syntax_tree):
            if isinstance(node, ast.Import):
                imports.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module is not None:
                imports.add(node.module.split(".")[0])
        calls = {
            node.func.id
            for node in ast.walk(syntax_tree)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)
        }

        assert imports.isdisjoint(forbidden_import_roots)
        assert calls.isdisjoint(forbidden_calls)
        if path.name == "engine.py":
            assert "JourneyDecision" not in path.read_text(encoding="utf-8")
