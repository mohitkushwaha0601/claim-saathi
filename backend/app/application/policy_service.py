"""Read-only access to reviewed policy-source metadata."""

from app.domain import PolicySource
from app.policies import PolicySourceRegistry


class PolicyService:
    """Return local registry metadata without fetching source URLs."""

    def __init__(self, source_registry: PolicySourceRegistry) -> None:
        self._source_registry = source_registry

    def get_source(self, source_id: str) -> PolicySource:
        return self._source_registry.get(source_id)
