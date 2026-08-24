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

## Phase 3 — Prerequisite Graph Boundaries

### Prerequisite graphs are configuration

Journey prerequisite structure lives in immutable, versioned JSON under
`journeys/epfo`, not in route handlers, frontend components, or policy-engine
code. Loading rejects ambiguous nodes, broken references, cycles, orphan nodes,
and duplicate rule bindings before evaluation.

### Phase 3 supports `ALL_OF` only

Every group is explicitly marked `ALL_OF`. There is no arbitrary boolean or
Python expression language, `ANY_OF`, scoring, probability, confidence, or
fuzzy aggregation. New aggregation semantics require a later explicit design
decision and tests rather than an implicit default.

### Graphs compose rule results but never evaluate policy

The prerequisite evaluator accepts only a graph definition and supplied
`RuleResult` objects. It does not accept citizen state or intent and does not
import or call the policy engine. A future orchestrator will own calling both
independent layers.

### Missing rule results are invocation errors

Every configured leaf requires a caller-supplied `RuleResult`. A missing result
raises `MissingRuleResultError`; the graph must not manufacture
`UNABLE_TO_VERIFY`, assume `PASS`, or confuse an incomplete engine invocation
with uncertainty about a citizen fact.

### Deterministic conclusions outrank unrelated unknown facts

`ALL_OF` uses the explicit precedence `POLICY_REVIEW_REQUIRED`,
`NOT_APPLICABLE`, `NOT_ELIGIBLE`, `ACTION_REQUIRED`, `UNABLE_TO_VERIFY`, then
`PASS`. This differs from a naive "unknown always wins" rule: when a mandatory
condition is definitely unsatisfied, an unrelated unverifiable prerequisite
does not erase that known conclusion.

### Every leaf state remains inspectable

`PrerequisiteGraphEvaluation` returns all group and leaf states plus stable
non-pass leaf identifiers. Consequently an `UNABLE_TO_VERIFY` leaf remains
visible even when the root is `NOT_ELIGIBLE`. Node results do not copy raw
observations or sensitive values from rule results.

### Graph evaluation has no readiness score

Phase 3 produces categorical states only. It does not calculate readiness
percentages, confidence scores, eligibility probabilities, journey decisions,
or claim outcomes.
