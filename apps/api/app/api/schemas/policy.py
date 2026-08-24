"""Read-only policy source registry response."""

from datetime import date, datetime

from app.domain import PolicySource, PolicySourceStatus

from .common import ApiModel, DemoMetadata


class PolicySourceResponse(ApiModel):
    source_id: str
    authority: str
    title: str
    document_type: str
    published_at: date | None
    effective_from: date | None
    effective_to: date | None
    reference_url: str | None
    corroborating_urls: tuple[str, ...]
    verified_at: datetime | None
    scope: str | None
    notes: str | None
    status: PolicySourceStatus
    demo: DemoMetadata = DemoMetadata()

    @classmethod
    def from_source(cls, source: PolicySource) -> "PolicySourceResponse":
        return cls(
            source_id=source.source_id,
            authority=source.authority,
            title=source.title,
            document_type=source.document_type,
            published_at=source.published_at,
            effective_from=source.effective_from,
            effective_to=source.effective_to,
            reference_url=(
                str(source.reference_url) if source.reference_url else None
            ),
            corroborating_urls=tuple(
                str(url) for url in source.corroborating_urls
            ),
            verified_at=source.verified_at,
            scope=source.scope,
            notes=source.notes,
            status=source.status,
        )
