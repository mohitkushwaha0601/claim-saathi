"""Process-local demo store; restarting the API intentionally resets it."""

from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass, field
from threading import RLock

from app.domain import (
    CitizenIntent,
    CitizenState,
    JourneyEvaluationResult,
    JourneyInstance,
    ResolutionInstance,
)

from .demo_state_provider import DemoPersonaId


class StoredJourneyNotFoundError(KeyError):
    """A journey instance is absent from the process-local demo store."""


class StoredJourneyAlreadyExistsError(ValueError):
    """A generated journey instance identifier unexpectedly collided."""


@dataclass
class StoredJourneySession:
    """Mutable runtime container holding immutable domain values."""

    persona_id: DemoPersonaId
    journey_instance: JourneyInstance
    citizen_intent: CitizenIntent
    citizen_state: CitizenState
    evaluations: list[JourneyEvaluationResult] = field(default_factory=list)
    resolutions: dict[str, ResolutionInstance] = field(default_factory=dict)


class InMemoryJourneyStore:
    """Journey-isolated process memory for the synthetic prototype only."""

    def __init__(self) -> None:
        self._sessions: dict[str, StoredJourneySession] = {}
        self._lock = RLock()

    def create(self, session: StoredJourneySession) -> None:
        with self._lock:
            key = session.journey_instance.journey_instance_id
            if key in self._sessions:
                raise StoredJourneyAlreadyExistsError(key)
            self._sessions[key] = session

    @contextmanager
    def locked_session(
        self,
        journey_instance_id: str,
    ) -> Iterator[StoredJourneySession]:
        """Serialize mutations within one in-process store operation."""

        with self._lock:
            try:
                session = self._sessions[journey_instance_id]
            except KeyError as error:
                raise StoredJourneyNotFoundError(
                    journey_instance_id
                ) from error
            yield session
