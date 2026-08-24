"""Synthetic persona-list and allowlisted demo-event responses."""

from typing import Literal

from app.application.demo_service import DemoEventResult
from app.infrastructure import DemoPersona

from .common import ApiModel, DemoMetadata


class DemoPersonaResponse(ApiModel):
    persona_id: str
    display_name: str
    scenario: str
    compatible_goal: str

    @classmethod
    def from_persona(cls, persona: DemoPersona) -> "DemoPersonaResponse":
        return cls(
            persona_id=persona.persona_id.value,
            display_name=persona.display_name,
            scenario=persona.scenario,
            compatible_goal=persona.compatible_goal.value,
        )


class DemoPersonaListResponse(ApiModel):
    personas: tuple[DemoPersonaResponse, ...]
    demo: DemoMetadata = DemoMetadata()


class DemoEventResponse(ApiModel):
    journey_instance_id: str
    event_type: str
    synthetic_event: Literal[True] = True
    real_government_action_performed: Literal[False] = False
    changed: bool
    citizen_state_version: str
    citizen_state_revision: int
    demo: DemoMetadata = DemoMetadata()

    @classmethod
    def from_result(cls, result: DemoEventResult) -> "DemoEventResponse":
        return cls(
            journey_instance_id=result.journey_instance_id,
            event_type=result.event_type,
            changed=result.changed,
            citizen_state_version=result.citizen_state_version,
            citizen_state_revision=result.citizen_state_revision,
        )
