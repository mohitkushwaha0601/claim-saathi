"""Stateful resolution navigation without persistence or government actions."""

from datetime import datetime

from app.domain import (
    CitizenState,
    ResolutionActor,
    ResolutionInstance,
    ResolutionState,
    ResolutionWorkflow,
)

from .catalog import ResolutionCatalog
from .exceptions import ResolutionInstanceMismatchError
from .state_machine import _transition_after_verification, transition
from .verifier import verify_resolution_success


class ResolutionNavigator:
    """Navigate approved workflows and verify success from fresh trusted facts."""

    def __init__(self, catalog: ResolutionCatalog) -> None:
        self._catalog = catalog

    def workflow_for_issue(self, issue_code: str) -> ResolutionWorkflow:
        """Return the exact active workflow for a deterministic issue code."""

        return self._catalog.get_by_issue(issue_code)

    def create(
        self,
        *,
        issue_code: str,
        journey_instance_id: str,
        resolution_instance_id: str,
        at: datetime,
    ) -> ResolutionInstance:
        """Create a workflow instance without accepting remediation text."""

        workflow = self.workflow_for_issue(issue_code)
        return ResolutionInstance(
            resolution_instance_id=resolution_instance_id,
            journey_instance_id=journey_instance_id,
            resolution_id=workflow.resolution_id,
            issue_code=workflow.issue_code,
            state=ResolutionState.CREATED,
            created_at=at,
            updated_at=at,
            workflow_version=workflow.version,
        )

    def start(
        self,
        instance: ResolutionInstance,
        *,
        at: datetime,
    ) -> ResolutionInstance:
        """Move a created instance to its configured responsible actor."""

        workflow = self._workflow_for_instance(instance)
        target_state = (
            ResolutionState.CITIZEN_ACTION_REQUIRED
            if workflow.actor is ResolutionActor.CITIZEN
            else ResolutionState.EXTERNAL_ACTION_REQUIRED
        )
        return transition(instance, target_state, at=at)

    def wait_for_update(
        self,
        instance: ResolutionInstance,
        *,
        at: datetime,
    ) -> ResolutionInstance:
        """Record that the navigator is waiting for trusted record changes."""

        self._workflow_for_instance(instance)
        return transition(instance, ResolutionState.WAITING_FOR_UPDATE, at=at)

    def retry(
        self,
        instance: ResolutionInstance,
        *,
        at: datetime,
    ) -> ResolutionInstance:
        """Return a still-blocked workflow to its approved citizen action."""

        workflow = self._workflow_for_instance(instance)
        if workflow.actor is not ResolutionActor.CITIZEN:
            raise ResolutionInstanceMismatchError(
                "retry is not a citizen-action workflow"
            )
        return transition(
            instance,
            ResolutionState.CITIZEN_ACTION_REQUIRED,
            at=at,
        )

    def recheck(
        self,
        instance: ResolutionInstance,
        fresh_citizen_state: CitizenState,
        *,
        at: datetime,
    ) -> ResolutionInstance:
        """Verify fresh trusted facts and return RESOLVED or STILL_BLOCKED."""

        workflow = self._workflow_for_instance(instance)
        rechecking = transition(instance, ResolutionState.RECHECKING, at=at)
        verification = verify_resolution_success(
            workflow,
            fresh_citizen_state,
        )
        return _transition_after_verification(
            rechecking,
            verification,
            at=at,
        )

    def _workflow_for_instance(
        self,
        instance: ResolutionInstance,
    ) -> ResolutionWorkflow:
        workflow = self._catalog.get_by_resolution(
            instance.resolution_id,
            instance.workflow_version,
        )
        if workflow.issue_code != instance.issue_code:
            raise ResolutionInstanceMismatchError(
                "instance issue does not match its workflow"
            )
        return workflow
