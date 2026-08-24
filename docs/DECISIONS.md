# ClaimSaathi Architecture Decisions

## Phase 1 — Domain Contract Boundaries

### Citizen state contains facts, not eligibility

`CitizenState` is an immutable, versioned snapshot of supplied synthetic facts.
It contains no eligibility, readiness, action-required, approval, or rejection
field, and it performs no inference from names or dates. Future policy logic
must evaluate the snapshot separately and preserve uncertainty.

### Citizen intent is separate from government journey

`CitizenIntent.goal` describes what a citizen wants to achieve. `JourneyId`
identifies a government journey. Keeping these types separate prevents citizen
language, government process metadata, and future intent-to-journey mapping from
becoming one hidden decision.

### Money uses integer rupees

All monetary facts and intent context use strict, non-negative integer rupees.
Floating-point money is rejected so serialization and future deterministic
comparisons remain reproducible.

### AI cannot participate in decision records

`DecisionRecord.ai_used_for_decision` is typed as `Literal[False]`. Pydantic
therefore rejects any attempt to construct a canonical audit record with the
value `true`; no confidence, readiness, or AI-generated fields exist in the
decision contracts.

### Demo fixtures are synthetic facts only

The demo fixture set contains exactly three visibly synthetic personas using
opaque synthetic identifiers. It stores no Aadhaar, UAN, PAN, or bank account
numbers and encodes facts rather than eligibility or action states. Extra fields
are forbidden by the typed citizen contracts, so raw identifier fields are
rejected rather than silently retained.
