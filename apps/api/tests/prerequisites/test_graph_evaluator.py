"""Behavioral and dependency-boundary tests for pure graph evaluation."""

import ast
from pathlib import Path

import pytest

from app.domain import (
    DecisionState,
    JourneyId,
    PrerequisiteAggregation,
    PrerequisiteGraphDefinition,
    PrerequisiteNode,
    RuleResult,
)
from app.prerequisites import aggregate_all_of, evaluate_graph
from app.prerequisites.exceptions import (
    DuplicateRuleResultError,
    MissingRuleResultError,
)

REPOSITORY_ROOT = Path(__file__).resolve().parents[4]
PREREQUISITE_PACKAGE = REPOSITORY_ROOT / "apps" / "api" / "app" / "prerequisites"


def two_leaf_graph() -> PrerequisiteGraphDefinition:
    return PrerequisiteGraphDefinition(
        journey_id=JourneyId.PF_TRANSFER,
        graph_version="SYNTH-GRAPH-V1",
        root_node_id="ROOT",
        nodes=(
            PrerequisiteNode(
                node_id="ROOT",
                label="Synthetic root",
                children=("LEFT", "RIGHT"),
                aggregation=PrerequisiteAggregation.ALL_OF,
            ),
            PrerequisiteNode(
                node_id="LEFT",
                label="Synthetic left",
                rule_ids=("SYNTH-RULE-LEFT",),
            ),
            PrerequisiteNode(
                node_id="RIGHT",
                label="Synthetic right",
                rule_ids=("SYNTH-RULE-RIGHT",),
            ),
        ),
    )


def result(rule_id: str, state: DecisionState) -> RuleResult:
    return RuleResult(
        rule_id=rule_id,
        state=state,
        policy_version="SYNTH-POLICY-V1",
    )


@pytest.mark.parametrize(
    ("states", "expected"),
    [
        ((DecisionState.PASS, DecisionState.PASS), DecisionState.PASS),
        (
            (DecisionState.PASS, DecisionState.UNABLE_TO_VERIFY),
            DecisionState.UNABLE_TO_VERIFY,
        ),
        (
            (DecisionState.PASS, DecisionState.ACTION_REQUIRED),
            DecisionState.ACTION_REQUIRED,
        ),
        (
            (DecisionState.ACTION_REQUIRED, DecisionState.UNABLE_TO_VERIFY),
            DecisionState.ACTION_REQUIRED,
        ),
        (
            (DecisionState.NOT_ELIGIBLE, DecisionState.ACTION_REQUIRED),
            DecisionState.NOT_ELIGIBLE,
        ),
        (
            (DecisionState.NOT_ELIGIBLE, DecisionState.UNABLE_TO_VERIFY),
            DecisionState.NOT_ELIGIBLE,
        ),
        (
            (DecisionState.NOT_APPLICABLE, DecisionState.NOT_ELIGIBLE),
            DecisionState.NOT_APPLICABLE,
        ),
        (
            (DecisionState.POLICY_REVIEW_REQUIRED, DecisionState.PASS),
            DecisionState.POLICY_REVIEW_REQUIRED,
        ),
        (
            (
                DecisionState.POLICY_REVIEW_REQUIRED,
                DecisionState.NOT_APPLICABLE,
            ),
            DecisionState.POLICY_REVIEW_REQUIRED,
        ),
    ],
)
def test_all_of_semantic_precedence(
    states: tuple[DecisionState, ...],
    expected: DecisionState,
) -> None:
    assert aggregate_all_of(states) is expected


def test_empty_all_of_is_rejected() -> None:
    with pytest.raises(ValueError, match="at least one"):
        aggregate_all_of(())


def test_missing_rule_result_raises_typed_invocation_error() -> None:
    with pytest.raises(MissingRuleResultError, match="SYNTH-RULE-RIGHT"):
        evaluate_graph(
            two_leaf_graph(),
            (result("SYNTH-RULE-LEFT", DecisionState.PASS),),
        )


def test_extra_unrelated_rule_result_does_not_affect_evaluation() -> None:
    supplied = (
        result("SYNTH-RULE-LEFT", DecisionState.PASS),
        result("SYNTH-RULE-RIGHT", DecisionState.PASS),
        result("SYNTH-RULE-UNRELATED", DecisionState.POLICY_REVIEW_REQUIRED),
    )

    evaluation = evaluate_graph(two_leaf_graph(), supplied)

    assert evaluation.root_state is DecisionState.PASS
    assert {item.node_id for item in evaluation.node_results} == {
        "ROOT",
        "LEFT",
        "RIGHT",
    }


def test_duplicate_supplied_rule_result_is_rejected() -> None:
    duplicate = result("SYNTH-RULE-LEFT", DecisionState.PASS)

    with pytest.raises(DuplicateRuleResultError):
        evaluate_graph(
            two_leaf_graph(),
            (
                duplicate,
                duplicate,
                result("SYNTH-RULE-RIGHT", DecisionState.PASS),
            ),
        )


def test_repeat_evaluation_is_identical_and_json_stable() -> None:
    supplied = (
        result("SYNTH-RULE-LEFT", DecisionState.ACTION_REQUIRED),
        result("SYNTH-RULE-RIGHT", DecisionState.UNABLE_TO_VERIFY),
    )

    first = evaluate_graph(two_leaf_graph(), supplied)
    second = evaluate_graph(two_leaf_graph(), supplied)

    assert first == second
    assert first.model_dump_json() == second.model_dump_json()
    assert first.non_pass_leaf_node_ids == ("LEFT", "RIGHT")


def test_node_results_do_not_copy_rule_observed_values_or_issue_metadata() -> None:
    sensitive = RuleResult(
        rule_id="SYNTH-RULE-LEFT",
        state=DecisionState.ACTION_REQUIRED,
        observed_value="SYNTH-SENSITIVE-VALUE",
        issue_code="SYNTH-ISSUE",
        resolution_id="SYNTH-RESOLUTION",
        source_id="SYNTH-SOURCE",
        policy_version="SYNTH-POLICY-V1",
    )
    evaluation = evaluate_graph(
        two_leaf_graph(),
        (sensitive, result("SYNTH-RULE-RIGHT", DecisionState.PASS)),
    )
    serialized = evaluation.model_dump(mode="json")

    assert "SYNTH-SENSITIVE-VALUE" not in str(serialized)
    assert "SYNTH-ISSUE" not in str(serialized)
    assert "observed_value" not in serialized["node_results"][1]


def test_prerequisite_package_has_no_policy_engine_or_external_imports() -> None:
    forbidden_roots = {
        "fastapi",
        "httpx",
        "openai",
        "requests",
        "socket",
        "urllib",
    }

    for path in PREREQUISITE_PACKAGE.glob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        imports = {
            alias.name.split(".")[0]
            for node in ast.walk(tree)
            if isinstance(node, (ast.Import, ast.ImportFrom))
            for alias in node.names
        }
        assert imports.isdisjoint(forbidden_roots)
        assert "policies" not in path.read_text(encoding="utf-8")


def test_prerequisite_package_has_no_dynamic_expression_execution() -> None:
    forbidden_calls = {"eval", "exec"}

    for path in PREREQUISITE_PACKAGE.glob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"))
        assert not any(
            isinstance(node, ast.Call)
            and isinstance(node.func, ast.Name)
            and node.func.id in forbidden_calls
            for node in ast.walk(tree)
        )
