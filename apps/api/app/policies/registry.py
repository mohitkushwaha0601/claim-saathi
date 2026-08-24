"""Immutable reviewed-source and versioned-policy registries."""

from collections import defaultdict
from types import MappingProxyType
from typing import Iterable, Mapping

from app.domain import (
    PolicyLifecycleStatus,
    PolicyRule,
    PolicyRuleDisposition,
    PolicyRuleType,
    PolicySource,
    PolicySourceStatus,
    PolicyVersion,
)

from .exceptions import (
    DuplicatePolicyIdentifierError,
    InactivePolicyRuleError,
    InactivePolicySourceError,
    InactivePolicyVersionError,
    PolicyConfigurationError,
    UnknownPolicyRuleError,
    UnknownPolicySourceError,
    UnknownPolicyVersionError,
)


class PolicySourceRegistry:
    """Read-only lookup for human-reviewed policy source metadata."""

    def __init__(self, sources: Iterable[PolicySource]) -> None:
        indexed: dict[str, PolicySource] = {}
        for source in sources:
            if source.source_id in indexed:
                raise DuplicatePolicyIdentifierError(
                    f"duplicate policy source: {source.source_id}"
                )
            indexed[source.source_id] = source
        self._sources: Mapping[str, PolicySource] = MappingProxyType(indexed)

    def get(self, source_id: str) -> PolicySource:
        """Return one reviewed source or reject an unknown identifier."""

        try:
            return self._sources[source_id]
        except KeyError as error:
            raise UnknownPolicySourceError(source_id) from error

    def all(self) -> tuple[PolicySource, ...]:
        """Return sources in stable identifier order."""

        return tuple(self._sources[key] for key in sorted(self._sources))


class PolicyRegistry:
    """Read-only registry of immutable policy versions and active rules."""

    def __init__(
        self,
        source_registry: PolicySourceRegistry,
        policy_versions: Iterable[PolicyVersion],
    ) -> None:
        indexed: dict[tuple[str, str], PolicyVersion] = {}
        conflicts: dict[tuple[str, str], frozenset[str]] = {}

        for policy_version in policy_versions:
            key = (policy_version.policy_id, policy_version.version)
            if key in indexed:
                raise DuplicatePolicyIdentifierError(
                    f"duplicate policy version: {key}"
                )
            self._validate_policy_version(source_registry, policy_version)
            indexed[key] = policy_version
            conflicts[key] = self._find_conflicts(policy_version)

        self.source_registry = source_registry
        self._versions: Mapping[tuple[str, str], PolicyVersion] = MappingProxyType(
            indexed
        )
        self._conflicts: Mapping[
            tuple[str, str], frozenset[str]
        ] = MappingProxyType(conflicts)

    @staticmethod
    def _validate_policy_version(
        source_registry: PolicySourceRegistry,
        policy_version: PolicyVersion,
    ) -> None:
        rule_ids: set[str] = set()
        for rule in policy_version.rules:
            if rule.rule_id in rule_ids:
                raise DuplicatePolicyIdentifierError(
                    f"duplicate rule in policy version: {rule.rule_id}"
                )
            rule_ids.add(rule.rule_id)

            if rule.version != policy_version.version:
                raise PolicyConfigurationError(
                    f"rule {rule.rule_id} version does not match its policy version"
                )
            if policy_version.journey_id not in rule.journeys:
                raise PolicyConfigurationError(
                    f"rule {rule.rule_id} does not declare its policy journey"
                )

            if rule.source_id is None:
                if (
                    rule.rule_type is PolicyRuleType.POLICY_RULE
                    and rule.disposition is PolicyRuleDisposition.EXECUTABLE
                ):
                    raise PolicyConfigurationError(
                        f"active government policy rule lacks source: {rule.rule_id}"
                    )
                continue

            source = source_registry.get(rule.source_id)
            if (
                policy_version.status is PolicyLifecycleStatus.ACTIVE
                and rule.status is PolicyLifecycleStatus.ACTIVE
                and source.status
                in (PolicySourceStatus.INACTIVE, PolicySourceStatus.SUPERSEDED)
            ):
                raise InactivePolicySourceError(
                    f"{source.source_id} cannot back active rule {rule.rule_id}"
                )

    @staticmethod
    def _find_conflicts(policy_version: PolicyVersion) -> frozenset[str]:
        conditions: dict[str, set[str]] = defaultdict(set)
        for rule in policy_version.rules:
            if (
                rule.status is not PolicyLifecycleStatus.ACTIVE
                or rule.disposition is not PolicyRuleDisposition.EXECUTABLE
            ):
                continue
            fingerprint = rule.model_dump_json(
                include={
                    "rule_type",
                    "input_path",
                    "trust_status_path",
                    "operator",
                    "expected",
                    "evaluator_id",
                    "pass_state",
                    "failure_state",
                }
            )
            conditions[rule.requirement_id].add(fingerprint)
        return frozenset(
            requirement_id
            for requirement_id, fingerprints in conditions.items()
            if len(fingerprints) > 1
        )

    def get_policy(self, policy_id: str, version: str) -> PolicyVersion:
        """Return an immutable policy version or reject an unknown version."""

        try:
            return self._versions[(policy_id, version)]
        except KeyError as error:
            raise UnknownPolicyVersionError(f"{policy_id}@{version}") from error

    def get_active_policy(self, policy_id: str, version: str) -> PolicyVersion:
        policy_version = self.get_policy(policy_id, version)
        if policy_version.status is not PolicyLifecycleStatus.ACTIVE:
            raise InactivePolicyVersionError(f"{policy_id}@{version}")
        return policy_version

    def get_rule(
        self,
        policy_id: str,
        version: str,
        rule_id: str,
    ) -> PolicyRule:
        policy_version = self.get_policy(policy_id, version)
        for rule in policy_version.rules:
            if rule.rule_id == rule_id:
                return rule
        raise UnknownPolicyRuleError(rule_id)

    def get_active_rule(
        self,
        policy_id: str,
        version: str,
        rule_id: str,
    ) -> tuple[PolicyVersion, PolicyRule]:
        policy_version = self.get_active_policy(policy_id, version)
        rule = self.get_rule(policy_id, version, rule_id)
        if rule.status is not PolicyLifecycleStatus.ACTIVE:
            raise InactivePolicyRuleError(rule_id)
        return policy_version, rule

    def active_rules(self, policy_id: str, version: str) -> tuple[PolicyRule, ...]:
        policy_version = self.get_active_policy(policy_id, version)
        return tuple(
            rule
            for rule in policy_version.rules
            if rule.status is PolicyLifecycleStatus.ACTIVE
        )

    def has_conflict(
        self,
        policy_version: PolicyVersion,
        rule: PolicyRule,
    ) -> bool:
        return rule.requirement_id in self._conflicts[
            (policy_version.policy_id, policy_version.version)
        ]
