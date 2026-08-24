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

## Phase 2 — Deterministic Policy Boundaries

### Authoritative capabilities are not reconstructed locally

`AUTHORITATIVE_CAPABILITY` rules accept a typed result supplied by a trusted
official-system adapter. The local engine does not reproduce employer
attestation or internal EPFO routing. Missing or `UNKNOWN` capability data yields
`UNABLE_TO_VERIFY`.

### Missing trusted data is not a failed policy condition

Missing, unavailable, or inconsistent trusted facts yield
`UNABLE_TO_VERIFY`. A rule's configured failure state is used only when a known,
type-valid fact deterministically fails its condition. Unavailable data is never
substituted with zero, false, or an inferred value.

### Policy conflicts fail closed

An explicitly unresolved rule, a review-required source, or contradictory
active rules for the same semantic requirement produces
`POLICY_REVIEW_REQUIRED`. The registry and engine never select by file order,
date, priority, or model output.

### There is no arbitrary policy expression language

Configuration may use only seven closed operators or a small typed allowlist of
named evaluators. Input paths are allowlisted Pydantic field paths; `eval`,
`exec`, arbitrary Python expressions, filters, and dynamic imports are not
supported.

### Policy evaluation performs no network access

Policy sources and URLs are reviewed metadata loaded from local JSON. Neither
the loader nor the engine fetches or interprets source content, and evaluation
has no network dependency.

### The 75-percent limit uses integer arithmetic

The approved amount evaluator computes
`available_balance_rupees * 75 // 100`. Its typed configuration is constrained
to the reviewed integer ratio `75/100`; no floating-point arithmetic or frontend
calculation participates.

### Legacy FAQ content is narrowly scoped

`SRC-EPFO-TRANSFER-DOE` supports only the supplied Date-of-Exit rule. Other FAQ
sections are not treated as current policy, and no employer-approval,
correction-workflow, or internal-routing rule is derived from them.

### Previous employment is explicit data

Phase 1's employment record could not safely distinguish current and previous
employment without inference. Phase 2 adds `employment_type` with closed
`CURRENT` and `PREVIOUS` values to the synthetic fact model and fixtures. Names
and dates are never used to infer that role.

### Rule results expose only safe observations

The engine emits only safe scalar observations such as integer service months,
booleans, and status codes. Monetary inputs, identifiers, dates, and record
objects are omitted. Source-free readiness and capability checks retain a
nullable `source_id` rather than fabricating government provenance.
