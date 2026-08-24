"""Immutable reviewed journey catalog with cross-layer consistency checks."""

from collections.abc import Iterable
from types import MappingProxyType
from typing import Mapping

from app.domain import (
    IntentGoal,
    JourneyCatalogDefinition,
    JourneyDefinition,
    JourneyDefinitionStatus,
    JourneyId,
    PolicySourceStatus,
    PrerequisiteGraphDefinition,
)
from app.policies import PolicyRegistry
from app.policies.exceptions import (
    PolicyConfigurationError as PolicyRegistryError,
)

from .exceptions import (
    DuplicateJourneyMappingError,
    JourneyConfigurationError,
    JourneyNotAvailableError,
    PolicyGraphMismatchError,
)


class JourneyCatalog:
    """Read-only binding from citizen goals to configured deterministic layers."""

    def __init__(
        self,
        definition: JourneyCatalogDefinition,
        policy_registry: PolicyRegistry,
        graphs: Iterable[tuple[str, PrerequisiteGraphDefinition]],
    ) -> None:
        if definition.status is not JourneyDefinitionStatus.ACTIVE:
            raise JourneyConfigurationError(
                f"journey catalog is not active: {definition.catalog_id}"
            )
        graphs_by_file: dict[str, PrerequisiteGraphDefinition] = {}
        for filename, graph in graphs:
            if filename in graphs_by_file:
                raise JourneyConfigurationError(
                    f"duplicate graph binding: {filename}"
                )
            graphs_by_file[filename] = graph

        definitions_by_key: dict[tuple[JourneyId, int], JourneyDefinition] = {}
        active_by_goal: dict[IntentGoal, JourneyDefinition] = {}
        active_by_journey: dict[JourneyId, JourneyDefinition] = {}
        for journey in definition.journeys:
            key = (journey.journey_id, journey.version)
            if key in definitions_by_key:
                raise JourneyConfigurationError(
                    f"duplicate journey definition: {key}"
                )
            definitions_by_key[key] = journey
            if journey.status is not JourneyDefinitionStatus.ACTIVE:
                continue
            if journey.citizen_goal in active_by_goal:
                raise DuplicateJourneyMappingError(journey.citizen_goal.value)
            if journey.journey_id in active_by_journey:
                raise JourneyConfigurationError(
                    f"multiple active definitions: {journey.journey_id.value}"
                )
            active_by_goal[journey.citizen_goal] = journey
            active_by_journey[journey.journey_id] = journey

        for journey in definition.journeys:
            self._validate_journey(
                definition,
                journey,
                policy_registry,
                graphs_by_file,
            )

        self.definition = definition
        self._definitions: Mapping[
            tuple[JourneyId, int], JourneyDefinition
        ] = MappingProxyType(definitions_by_key)
        self._active_by_goal: Mapping[
            IntentGoal, JourneyDefinition
        ] = MappingProxyType(active_by_goal)
        self._active_by_journey: Mapping[
            JourneyId, JourneyDefinition
        ] = MappingProxyType(active_by_journey)
        self._graphs: Mapping[
            str, PrerequisiteGraphDefinition
        ] = MappingProxyType(graphs_by_file)

    @staticmethod
    def _validate_journey(
        catalog: JourneyCatalogDefinition,
        journey: JourneyDefinition,
        policy_registry: PolicyRegistry,
        graphs: Mapping[str, PrerequisiteGraphDefinition],
    ) -> None:
        if journey.catalog_version != catalog.version:
            raise JourneyConfigurationError(
                f"catalog version mismatch: {journey.journey_id.value}"
            )
        try:
            source = policy_registry.source_registry.get(
                journey.official_process_source_id
            )
        except PolicyRegistryError as error:
            raise JourneyConfigurationError(
                f"unknown process source: {journey.official_process_source_id}"
            ) from error
        if source.status is not PolicySourceStatus.ACTIVE:
            raise JourneyConfigurationError(
                f"inactive process source: {source.source_id}"
            )

        try:
            policy = policy_registry.get_active_policy(
                journey.policy_id,
                journey.policy_version,
            )
        except PolicyRegistryError as error:
            raise JourneyConfigurationError(
                f"invalid policy binding: {journey.policy_id}"
            ) from error
        try:
            graph = graphs[journey.prerequisite_graph_file]
        except KeyError as error:
            raise JourneyConfigurationError(
                f"missing graph: {journey.prerequisite_graph_file}"
            ) from error

        if policy.journey_id is not journey.journey_id:
            raise PolicyGraphMismatchError(
                f"policy journey mismatch: {journey.journey_id.value}"
            )
        if graph.journey_id is not journey.journey_id:
            raise PolicyGraphMismatchError(
                f"graph journey mismatch: {journey.journey_id.value}"
            )
        if graph.graph_version != journey.prerequisite_graph_version:
            raise PolicyGraphMismatchError(
                f"graph version mismatch: {journey.journey_id.value}"
            )
        if graph.root_node_id != journey.prerequisite_root:
            raise PolicyGraphMismatchError(
                f"graph root mismatch: {journey.journey_id.value}"
            )

        graph_rule_ids = tuple(
            node.rule_ids[0]
            for node in graph.nodes
            if node.rule_ids
        )
        expected_rule_ids = journey.policy_rule_ids
        if len(set(expected_rule_ids)) != len(expected_rule_ids):
            raise PolicyGraphMismatchError(
                f"duplicate expected rule: {journey.journey_id.value}"
            )
        if graph_rule_ids != expected_rule_ids:
            raise PolicyGraphMismatchError(
                f"graph rule binding mismatch: {journey.journey_id.value}"
            )
        active_policy_rule_ids = tuple(
            rule.rule_id
            for rule in policy_registry.active_rules(
                journey.policy_id,
                journey.policy_version,
            )
        )
        if (
            len(active_policy_rule_ids) != len(expected_rule_ids)
            or set(active_policy_rule_ids) != set(expected_rule_ids)
        ):
            raise PolicyGraphMismatchError(
                f"policy rule binding mismatch: {journey.journey_id.value}"
            )
        policy_resolution_ids = tuple(
            rule.resolution_id
            for rule in policy_registry.active_rules(
                journey.policy_id,
                journey.policy_version,
            )
            if rule.resolution_id is not None
        )
        if (
            len(set(journey.resolution_ids)) != len(journey.resolution_ids)
            or policy_resolution_ids != journey.resolution_ids
        ):
            raise PolicyGraphMismatchError(
                f"resolution binding mismatch: {journey.journey_id.value}"
            )

    def get_by_goal(self, goal: IntentGoal) -> JourneyDefinition:
        """Return the single active exact mapping for a typed citizen goal."""

        try:
            return self._active_by_goal[goal]
        except (KeyError, TypeError) as error:
            raise JourneyNotAvailableError(str(goal)) from error

    def get_by_journey(self, journey_id: JourneyId) -> JourneyDefinition:
        """Return the active definition for a journey identifier."""

        try:
            return self._active_by_journey[journey_id]
        except (KeyError, TypeError) as error:
            raise JourneyNotAvailableError(str(journey_id)) from error

    def graph_for(
        self,
        journey: JourneyDefinition,
    ) -> PrerequisiteGraphDefinition:
        """Return the graph pinned by an already-validated definition."""

        try:
            return self._graphs[journey.prerequisite_graph_file]
        except KeyError as error:
            raise JourneyConfigurationError(
                f"missing graph: {journey.prerequisite_graph_file}"
            ) from error

    def all(self) -> tuple[JourneyDefinition, ...]:
        """Return definitions in stable journey/version order."""

        return tuple(self._definitions[key] for key in sorted(self._definitions))
