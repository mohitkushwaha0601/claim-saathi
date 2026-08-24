"""Local JSON loader for reviewed resolution workflows and source metadata."""

from pathlib import Path

from pydantic import TypeAdapter, ValidationError

from app.domain import PolicySource, ResolutionWorkflow

from .catalog import ResolutionCatalog
from .exceptions import (
    ResolutionConfigurationError,
    ResolutionWorkflowMismatchError,
)

_SOURCE_ADAPTER = TypeAdapter(tuple[PolicySource, ...])
_EXPECTED_WORKFLOWS = {
    "exit_date_missing.v1.json": ("RES_EXIT", 1, "EXIT_DATE_MISSING"),
}


def load_resolution_workflow(path: Path) -> ResolutionWorkflow:
    """Load one immutable workflow and verify its known file identity."""

    try:
        workflow = ResolutionWorkflow.model_validate_json(
            path.read_text(encoding="utf-8")
        )
    except (OSError, ValidationError, ValueError) as error:
        raise ResolutionConfigurationError(f"cannot load {path}") from error

    expected = _EXPECTED_WORKFLOWS.get(path.name)
    if expected is None:
        raise ResolutionConfigurationError(f"unknown workflow file: {path.name}")
    actual = (workflow.resolution_id, workflow.version, workflow.issue_code)
    if actual != expected:
        raise ResolutionWorkflowMismatchError(
            f"{path.name} declares {actual!r}; expected {expected!r}"
        )
    return workflow


def load_resolution_catalog(
    resolution_directory: Path,
    source_registry_path: Path,
) -> ResolutionCatalog:
    """Load reviewed local configuration without network or policy evaluation."""

    paths = tuple(sorted(resolution_directory.glob("*.json")))
    names = {path.name for path in paths}
    unknown_names = names - set(_EXPECTED_WORKFLOWS)
    missing_names = set(_EXPECTED_WORKFLOWS) - names
    if unknown_names:
        raise ResolutionConfigurationError(
            f"unknown workflow files: {', '.join(sorted(unknown_names))}"
        )
    if missing_names:
        raise ResolutionConfigurationError(
            f"missing workflow files: {', '.join(sorted(missing_names))}"
        )

    try:
        sources = _SOURCE_ADAPTER.validate_json(
            source_registry_path.read_text(encoding="utf-8")
        )
    except (OSError, ValidationError, ValueError) as error:
        raise ResolutionConfigurationError(
            f"cannot load {source_registry_path}"
        ) from error

    workflows = tuple(load_resolution_workflow(path) for path in paths)
    return ResolutionCatalog(sources, workflows)
