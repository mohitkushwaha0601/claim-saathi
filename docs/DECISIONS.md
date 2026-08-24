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

## Phase 4 — Resolution Navigator Boundaries

### Resolutions are pre-approved configuration

Resolution workflows are immutable, versioned JSON reviewed against official
source metadata. The catalog performs exact issue-code lookup; remediation is
never generated by AI, fuzzy search, user input, route handlers, or runtime
prose interpretation.

### Citizen confirmation is not government-state evidence

The navigator accepts no `resolved`, `user_confirmed`, or equivalent success
flag. Following or confirming a workflow step does not prove that an official
record changed and cannot produce `RESOLVED`.

### Success requires fresh trusted citizen state

The only public service path to `RESOLVED` is `ResolutionNavigator.recheck`.
It moves a waiting instance through `RECHECKING`, runs the workflow's closed
allowlisted verifier against a supplied fresh `CitizenState`, and selects
`RESOLVED` or `STILL_BLOCKED` from that factual result.

### State version is audit metadata, not proof

`last_checked_citizen_state_version` records which snapshot the verifier used.
A different or higher version does not establish success; the verifier still
requires the unique explicitly typed `PREVIOUS` employment record to contain a
non-null `exit_date`.

### Mark Exit guidance remains conditional

The approved guidance says EPFO provides its self-service Mark Exit process
after the applicable 60-day condition is satisfied. ClaimSaathi does not possess
enough trusted facts to evaluate that condition, infer a leaving date, or claim
that the process is currently available to a particular citizen.

### Phase 4 does not orchestrate earlier decision layers

Resolution code does not import or invoke the Policy Engine or prerequisite
graph evaluator. Satisfying a resolution condition does not change journey
eligibility or a graph root; full re-evaluation belongs to Phase 5.

### Missing catalog guidance fails closed

An exact issue code without an approved active workflow raises
`ResolutionNotAvailableError`. The navigator does not invent alternative steps,
ask an AI system, or silently select a near match.

## Phase 5 — Journey Planning and Audit Boundaries

### Citizen intent maps through reviewed deterministic configuration

The Journey Planner performs an exact lookup of the typed
`CitizenIntent.goal` in an immutable versioned catalog. It does not inspect
citizen facts, rank alternatives, perform fuzzy matching, or use AI. Zero active
mappings raise `JourneyNotAvailableError`; duplicate active mappings are
configuration failures.

### `PASS` means configured prerequisites pass

A `JourneyDecision` with state `PASS` means only that every prerequisite in the
pinned ClaimSaathi graph currently passes. It is not an EPFO decision, payment
promise, settlement guarantee, or legal advice. Citizen-facing language in a
future UI should say “Ready to proceed,” never “Approved.”

### Journey decisions and decision records are immutable history

Each full evaluation creates a new frozen `JourneyDecision` and
`DecisionRecord`. A later resolution or trusted-state update never mutates an
older result. This preserves the exact state, rules, sources, and versions that
were used at each point in time.

### Rechecks create new records by rerunning every layer

The orchestrator re-evaluates every configured Phase 2 rule and then the full
Phase 3 graph from scratch. It never patches an old rule result, graph node, or
decision after a resolution succeeds. A new result receives caller-supplied
decision identity and time metadata.

### Older trusted snapshots are rejected; equal revisions are allowed

The existing human-readable `state_version` is retained as an opaque audit
label. Phase 5 adds strict non-negative `state_revision` metadata because stale
ordering must not be inferred from version names. A revision lower than the
previous decision is rejected with `StaleCitizenStateError`; an equal revision
may be explicitly rechecked, and a higher revision is evaluated normally. A
higher revision alone is not evidence that a citizen fact improved.

### Resolution completion does not change prior decisions

The orchestrator may start a resolution only when the current decision contains
an exact issue-to-resolution link and the Resolution Catalog confirms the same
approved workflow. `RESOLVED` means only that Phase 4's trusted-state success
condition passed. A new full journey evaluation is still required, and the old
decision remains unchanged.

### Configuration failures are not citizen uncertainty

Missing graphs, mismatched journey identifiers, missing or duplicate rule
bindings, wrong selected versions, and stale snapshots raise typed journey
exceptions. They are not converted into `UNABLE_TO_VERIFY`, which is reserved
for valid product uncertainty about trusted citizen or capability inputs.

### Evaluation identifiers and timestamps are explicit inputs

Core journey creation and evaluation receive `journey_instance_id`,
`decision_id`, `created_at`, and `evaluated_at` from the caller. The
deterministic core does not read the wall clock or generate random identifiers,
so identical inputs and metadata replay to equal outputs.

### Only evaluated rule provenance enters a decision record

Source identifiers are collected from the actual ordered `RuleResult` values,
deduplicated without losing first-seen order. Process-label and resolution
sources are not added merely because they exist in the registries.

### `blocking_node_ids` means non-pass prerequisite leaves

The Phase 1 field name remains for contract compatibility, but Phase 5 fills it
directly from Phase 3's ordered `non_pass_leaf_node_ids`. It is not a legal
rejection classification and the orchestrator applies no second interpretation
of graph state.

### Journey definitions bind components but contain no policy logic

The reviewed catalog pins policy, graph, rule, process-label, and supported
resolution identifiers. Load-time validation rejects drift between those
layers. It contains no numeric policy values, executable conditions, graph
precedence, or resolution success logic.
