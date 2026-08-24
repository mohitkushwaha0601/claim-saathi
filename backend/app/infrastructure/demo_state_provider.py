"""Allowlisted synthetic persona state and mock capability providers."""

import json
from dataclasses import dataclass
from datetime import date
from enum import Enum
from pathlib import Path
from types import MappingProxyType
from typing import Mapping

from app.domain import (
    CapabilityValue,
    CitizenIntent,
    CitizenState,
    EmploymentRecordType,
    ExitRecordStatus,
    IntentGoal,
)


class DemoPersonaId(str, Enum):
    """Closed public identifiers for the three synthetic demo personas."""

    RAVI_PARTIAL_READY = "RAVI_PARTIAL_READY"
    PRIYA_TRANSFER_MISSING_EXIT = "PRIYA_TRANSFER_MISSING_EXIT"
    ARJUN_FINAL_SETTLEMENT = "ARJUN_FINAL_SETTLEMENT"


@dataclass(frozen=True)
class DemoPersona:
    """Safe persona-list metadata plus an internal allowlisted fixture name."""

    persona_id: DemoPersonaId
    display_name: str
    scenario: str
    compatible_goal: IntentGoal
    fixture_name: str


_PERSONAS: Mapping[DemoPersonaId, DemoPersona] = MappingProxyType(
    {
        DemoPersonaId.RAVI_PARTIAL_READY: DemoPersona(
            persona_id=DemoPersonaId.RAVI_PARTIAL_READY,
            display_name="Ravi",
            scenario="Access some PF funds with complete synthetic readiness data.",
            compatible_goal=IntentGoal.ACCESS_SOME_PF_FUNDS,
            fixture_name="ravi_partial_ready.json",
        ),
        DemoPersonaId.PRIYA_TRANSFER_MISSING_EXIT: DemoPersona(
            persona_id=DemoPersonaId.PRIYA_TRANSFER_MISSING_EXIT,
            display_name="Priya",
            scenario=(
                "Transfer PF after changing employment when the previous "
                "employment Date of Exit is missing."
            ),
            compatible_goal=(
                IntentGoal.TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE
            ),
            fixture_name="priya_transfer_missing_exit.json",
        ),
        DemoPersonaId.ARJUN_FINAL_SETTLEMENT: DemoPersona(
            persona_id=DemoPersonaId.ARJUN_FINAL_SETTLEMENT,
            display_name="Arjun",
            scenario=(
                "Final PF settlement with intentionally unresolved policy "
                "configuration."
            ),
            compatible_goal=IntentGoal.FINAL_PF_SETTLEMENT,
            fixture_name="arjun_final_settlement.json",
        ),
    }
)


class DemoCitizenStateProvider:
    """Load immutable base fixtures and apply one allowlisted synthetic event."""

    def __init__(self, fixture_directory: Path) -> None:
        self._fixture_directory = fixture_directory

    def personas(self) -> tuple[DemoPersona, ...]:
        return tuple(_PERSONAS[persona_id] for persona_id in DemoPersonaId)

    def persona(self, persona_id: DemoPersonaId) -> DemoPersona:
        return _PERSONAS[persona_id]

    def load_base(
        self,
        persona_id: DemoPersonaId,
    ) -> tuple[CitizenIntent, CitizenState]:
        """Load only a known fixture; caller input never becomes a path."""

        persona = self.persona(persona_id)
        fixture_path = self._fixture_directory / persona.fixture_name
        payload = json.loads(fixture_path.read_text(encoding="utf-8"))
        return (
            CitizenIntent.model_validate(payload["intent"]),
            CitizenState.model_validate(payload["citizen_state"]),
        )

    def apply_previous_exit_date_updated(
        self,
        persona_id: DemoPersonaId,
        citizen_state: CitizenState,
    ) -> tuple[CitizenState, bool]:
        """Apply Priya's single synthetic demo event to one isolated snapshot."""

        if persona_id is not DemoPersonaId.PRIYA_TRANSFER_MISSING_EXIT:
            raise ValueError("demo event is not supported for this persona")

        previous_records = tuple(
            record
            for record in citizen_state.employment.records
            if record.employment_type is EmploymentRecordType.PREVIOUS
        )
        if len(previous_records) != 1:
            raise ValueError("previous employment record is not unique")
        target = previous_records[0]
        if target.exit_date is not None:
            return citizen_state, False

        corrected_records = tuple(
            record.model_copy(
                update={
                    "exit_date": date(2023, 1, 31),
                    "exit_record_status": ExitRecordStatus.RECORDED,
                }
            )
            if record.employment_id == target.employment_id
            else record
            for record in citizen_state.employment.records
        )
        next_revision = citizen_state.state_revision + 1
        corrected = citizen_state.model_copy(
            update={
                "state_version": f"SYNTH-PRIYA-STATE-R{next_revision}",
                "state_revision": next_revision,
                "employment": citizen_state.employment.model_copy(
                    update={"records": corrected_records}
                ),
            }
        )
        return CitizenState.model_validate(corrected.model_dump()), True


class DemoAuthoritativeCapabilityProvider:
    """Clearly mocked transfer-route capability; no EPFO logic is recreated."""

    def __init__(
        self,
        transfer_route_value: CapabilityValue = CapabilityValue.AVAILABLE,
    ) -> None:
        self._transfer_route_value = transfer_route_value

    def for_persona(
        self,
        persona_id: DemoPersonaId,
    ) -> Mapping[str, CapabilityValue]:
        if persona_id is DemoPersonaId.PRIYA_TRANSFER_MISSING_EXIT:
            return MappingProxyType(
                {"T13-ROUTE-001": self._transfer_route_value}
            )
        return MappingProxyType({})
