"""Local JSON policy loader; this module performs no network access."""

from pathlib import Path

from pydantic import TypeAdapter, ValidationError

from app.domain import PolicySource, PolicyVersion

from .exceptions import PolicyConfigurationError
from .registry import PolicyRegistry, PolicySourceRegistry

_SOURCE_ADAPTER = TypeAdapter(tuple[PolicySource, ...])


def load_source_registry(policy_directory: Path) -> PolicySourceRegistry:
    """Load reviewed source metadata from the local policy directory."""

    source_path = policy_directory / "sources.json"
    try:
        sources = _SOURCE_ADAPTER.validate_json(
            source_path.read_text(encoding="utf-8")
        )
    except (OSError, ValidationError, ValueError) as error:
        raise PolicyConfigurationError(f"cannot load {source_path}") from error
    return PolicySourceRegistry(sources)


def load_policy_registry(policy_directory: Path) -> PolicyRegistry:
    """Load all local immutable policy versions and validate their sources."""

    source_registry = load_source_registry(policy_directory)
    policy_versions: list[PolicyVersion] = []
    for policy_path in sorted(policy_directory.glob("*.json")):
        if policy_path.name == "sources.json":
            continue
        try:
            policy_versions.append(
                PolicyVersion.model_validate_json(
                    policy_path.read_text(encoding="utf-8")
                )
            )
        except (OSError, ValidationError, ValueError) as error:
            raise PolicyConfigurationError(f"cannot load {policy_path}") from error
    return PolicyRegistry(source_registry, policy_versions)
