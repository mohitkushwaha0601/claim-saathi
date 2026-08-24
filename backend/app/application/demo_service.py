"""Safe persona discovery and one explicit synthetic correction event."""

from dataclasses import dataclass

from app.infrastructure import (
    DemoCitizenStateProvider,
    DemoPersona,
    DemoPersonaId,
    InMemoryJourneyStore,
)
from app.infrastructure.memory_store import StoredJourneyNotFoundError

from .exceptions import (
    DemoEventNotAllowedError,
    JourneySessionNotFoundError,
)


@dataclass(frozen=True)
class DemoEventResult:
    """Audit-safe result of the allowlisted hackathon-only state mutation."""

    journey_instance_id: str
    event_type: str
    changed: bool
    citizen_state_version: str
    citizen_state_revision: int


class DemoService:
    """Expose safe persona metadata and isolated synthetic state changes."""

    def __init__(
        self,
        state_provider: DemoCitizenStateProvider,
        store: InMemoryJourneyStore,
    ) -> None:
        self._state_provider = state_provider
        self._store = store

    def list_personas(self) -> tuple[DemoPersona, ...]:
        return self._state_provider.personas()

    def apply_previous_exit_date_updated(
        self,
        journey_instance_id: str,
    ) -> DemoEventResult:
        try:
            context = self._store.locked_session(journey_instance_id)
            with context as session:
                if (
                    session.persona_id
                    is not DemoPersonaId.PRIYA_TRANSFER_MISSING_EXIT
                ):
                    raise DemoEventNotAllowedError(journey_instance_id)
                try:
                    state, changed = (
                        self._state_provider.apply_previous_exit_date_updated(
                            session.persona_id,
                            session.citizen_state,
                        )
                    )
                except ValueError as error:
                    raise DemoEventNotAllowedError(
                        journey_instance_id
                    ) from error
                session.citizen_state = state
                return DemoEventResult(
                    journey_instance_id=journey_instance_id,
                    event_type="PREVIOUS_EXIT_DATE_UPDATED",
                    changed=changed,
                    citizen_state_version=state.state_version,
                    citizen_state_revision=state.state_revision,
                )
        except StoredJourneyNotFoundError as error:
            raise JourneySessionNotFoundError(journey_instance_id) from error
