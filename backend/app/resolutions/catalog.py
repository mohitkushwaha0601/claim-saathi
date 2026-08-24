"""Immutable catalog mapping issue codes to approved resolution workflows."""

from collections.abc import Iterable
from types import MappingProxyType
from typing import Mapping

from app.domain import (
    PolicySource,
    PolicySourceStatus,
    ResolutionWorkflow,
    ResolutionWorkflowStatus,
)

from .exceptions import (
    DuplicateIssueMappingError,
    DuplicateResolutionIdentifierError,
    DuplicateResolutionStepError,
    InactiveResolutionSourceError,
    ResolutionConfigurationError,
    ResolutionNotAvailableError,
    UnknownResolutionError,
    UnknownResolutionSourceError,
)


class ResolutionCatalog:
    """Read-only lookup for immutable, source-backed resolution workflows."""

    def __init__(
        self,
        sources: Iterable[PolicySource],
        workflows: Iterable[ResolutionWorkflow],
    ) -> None:
        sources_by_id: dict[str, PolicySource] = {}
        for source in sources:
            if source.source_id in sources_by_id:
                raise ResolutionConfigurationError(
                    f"duplicate source metadata: {source.source_id}"
                )
            sources_by_id[source.source_id] = source

        workflows_by_key: dict[tuple[str, int], ResolutionWorkflow] = {}
        active_by_issue: dict[str, ResolutionWorkflow] = {}
        active_by_id: dict[str, ResolutionWorkflow] = {}
        for workflow in workflows:
            key = (workflow.resolution_id, workflow.version)
            if key in workflows_by_key:
                raise DuplicateResolutionIdentifierError(
                    f"{workflow.resolution_id}@{workflow.version}"
                )
            self._validate_workflow(workflow, sources_by_id)
            workflows_by_key[key] = workflow

            if workflow.status is not ResolutionWorkflowStatus.ACTIVE:
                continue
            if workflow.issue_code in active_by_issue:
                raise DuplicateIssueMappingError(workflow.issue_code)
            if workflow.resolution_id in active_by_id:
                raise DuplicateResolutionIdentifierError(workflow.resolution_id)
            active_by_issue[workflow.issue_code] = workflow
            active_by_id[workflow.resolution_id] = workflow

        self._workflows: Mapping[
            tuple[str, int], ResolutionWorkflow
        ] = MappingProxyType(workflows_by_key)
        self._active_by_issue: Mapping[
            str, ResolutionWorkflow
        ] = MappingProxyType(active_by_issue)

    @staticmethod
    def _validate_workflow(
        workflow: ResolutionWorkflow,
        sources_by_id: Mapping[str, PolicySource],
    ) -> None:
        if not workflow.approved_steps:
            raise ResolutionConfigurationError(
                f"workflow has no approved steps: {workflow.resolution_id}"
            )

        step_ids: set[str] = set()
        for step in workflow.approved_steps:
            if step.step_id in step_ids:
                raise DuplicateResolutionStepError(step.step_id)
            step_ids.add(step.step_id)

        if not workflow.official_source_ids:
            raise ResolutionConfigurationError(
                f"workflow has no official source: {workflow.resolution_id}"
            )
        if len(set(workflow.official_source_ids)) != len(
            workflow.official_source_ids
        ):
            raise ResolutionConfigurationError(
                f"duplicate workflow source: {workflow.resolution_id}"
            )
        for source_id in workflow.official_source_ids:
            try:
                source = sources_by_id[source_id]
            except KeyError as error:
                raise UnknownResolutionSourceError(source_id) from error
            if (
                workflow.status is ResolutionWorkflowStatus.ACTIVE
                and source.status is not PolicySourceStatus.ACTIVE
            ):
                raise InactiveResolutionSourceError(source_id)

    def get_by_issue(self, issue_code: str) -> ResolutionWorkflow:
        """Return the single approved active workflow for an exact issue code."""

        try:
            return self._active_by_issue[issue_code]
        except KeyError as error:
            raise ResolutionNotAvailableError(issue_code) from error

    def get_by_resolution(
        self,
        resolution_id: str,
        version: int,
    ) -> ResolutionWorkflow:
        """Return an exact immutable workflow version for instance replay."""

        try:
            return self._workflows[(resolution_id, version)]
        except KeyError as error:
            raise UnknownResolutionError(f"{resolution_id}@{version}") from error

    def all(self) -> tuple[ResolutionWorkflow, ...]:
        """Return every workflow in stable identifier/version order."""

        return tuple(self._workflows[key] for key in sorted(self._workflows))
