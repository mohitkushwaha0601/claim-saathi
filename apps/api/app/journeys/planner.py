"""Exact typed-intent journey planning from reviewed configuration."""

from datetime import datetime

from app.domain import CitizenIntent, JourneyDefinition, JourneyInstance

from .catalog import JourneyCatalog


class JourneyPlanner:
    """Plan one reviewed journey using only CitizenIntent.goal."""

    def __init__(self, catalog: JourneyCatalog) -> None:
        self._catalog = catalog

    def plan(self, intent: CitizenIntent) -> JourneyDefinition:
        """Return the exact configured definition for the typed intent goal."""

        return self._catalog.get_by_goal(intent.goal)

    def create_instance(
        self,
        intent: CitizenIntent,
        *,
        citizen_id: str,
        journey_instance_id: str,
        created_at: datetime,
    ) -> JourneyInstance:
        """Create an immutable journey-start record from explicit metadata."""

        journey = self.plan(intent)
        return JourneyInstance(
            journey_instance_id=journey_instance_id,
            citizen_id=citizen_id,
            citizen_goal=intent.goal,
            journey_id=journey.journey_id,
            journey_definition_version=journey.version,
            created_at=created_at,
            official_process_label=journey.official_process_label,
        )
