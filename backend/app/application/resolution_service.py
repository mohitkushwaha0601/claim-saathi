"""Application commands around approved Phase 4 resolution navigation."""

from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass

from app.domain import ResolutionInstance, ResolutionState, ResolutionWorkflow
from app.infrastructure import InMemoryJourneyStore, StoredJourneySession
from app.infrastructure.memory_store import StoredJourneyNotFoundError
from app.journeys import JourneyOrchestrator
from app.resolutions import ResolutionNavigator

from .exceptions import (
    DecisionNotCurrentError,
    DecisionNotFoundError,
    JourneySessionNotFoundError,
    ResolutionInstanceNotFoundError,
)
from .journey_service import Clock, IdFactory, _default_id_factory, _utc_now


@dataclass(frozen=True)
class ResolutionView:
    """Resolution instance joined only with its approved workflow."""

    instance: ResolutionInstance
    workflow: ResolutionWorkflow


class ResolutionService:
    """Expose purpose-specific transitions without a direct resolve command."""

    def __init__(
        self,
        *,
        orchestrator: JourneyOrchestrator,
        navigator: ResolutionNavigator,
        store: InMemoryJourneyStore,
        id_factory: IdFactory = _default_id_factory,
        clock: Clock = _utc_now,
    ) -> None:
        self._orchestrator = orchestrator
        self._navigator = navigator
        self._store = store
        self._id_factory = id_factory
        self._clock = clock

    def start_resolution(
        self,
        *,
        journey_instance_id: str,
        decision_id: str,
        issue_code: str,
    ) -> ResolutionView:
        with self._locked_session(journey_instance_id) as session:
            if not session.evaluations:
                raise DecisionNotFoundError(decision_id)
            current = session.evaluations[-1]
            if current.decision_record.decision_id != decision_id:
                if any(
                    item.decision_record.decision_id == decision_id
                    for item in session.evaluations
                ):
                    raise DecisionNotCurrentError(decision_id)
                raise DecisionNotFoundError(decision_id)
            now = self._clock()
            created = self._orchestrator.start_resolution_for_issue(
                journey_instance=session.journey_instance,
                current_evaluation=current,
                issue_code=issue_code,
                resolution_instance_id=self._id_factory("RES"),
                at=now,
            )
            started = self._navigator.start(created, at=now)
            session.resolutions[started.resolution_instance_id] = started
            return self._view(started)

    def confirm_external_step_started(
        self,
        *,
        journey_instance_id: str,
        resolution_instance_id: str,
    ) -> ResolutionView:
        with self._locked_session(journey_instance_id) as session:
            instance = self._find_resolution(
                session.resolutions,
                resolution_instance_id,
            )
            now = self._clock()
            if instance.state is ResolutionState.STILL_BLOCKED:
                instance = self._navigator.retry(instance, at=now)
            waiting = self._navigator.wait_for_update(instance, at=now)
            session.resolutions[resolution_instance_id] = waiting
            return self._view(waiting)

    def recheck_resolution(
        self,
        *,
        journey_instance_id: str,
        resolution_instance_id: str,
    ) -> ResolutionView:
        with self._locked_session(journey_instance_id) as session:
            instance = self._find_resolution(
                session.resolutions,
                resolution_instance_id,
            )
            updated = self._navigator.recheck(
                instance,
                session.citizen_state,
                at=self._clock(),
            )
            session.resolutions[resolution_instance_id] = updated
            return self._view(updated)

    def get_resolution(
        self,
        *,
        journey_instance_id: str,
        resolution_instance_id: str,
    ) -> ResolutionView:
        with self._locked_session(journey_instance_id) as session:
            return self._view(
                self._find_resolution(
                    session.resolutions,
                    resolution_instance_id,
                )
            )

    def _view(self, instance: ResolutionInstance) -> ResolutionView:
        return ResolutionView(
            instance=instance,
            workflow=self._navigator.workflow_for_issue(instance.issue_code),
        )

    @staticmethod
    def _find_resolution(
        resolutions: dict[str, ResolutionInstance],
        resolution_instance_id: str,
    ) -> ResolutionInstance:
        try:
            return resolutions[resolution_instance_id]
        except KeyError as error:
            raise ResolutionInstanceNotFoundError(
                resolution_instance_id
            ) from error

    @contextmanager
    def _locked_session(
        self,
        journey_instance_id: str,
    ) -> Iterator[StoredJourneySession]:
        try:
            with self._store.locked_session(journey_instance_id) as session:
                yield session
        except StoredJourneyNotFoundError as error:
            raise JourneySessionNotFoundError(journey_instance_id) from error
