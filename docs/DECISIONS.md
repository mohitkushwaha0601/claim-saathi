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

## Phase 6 — FastAPI and Demo Runtime Boundaries

### HTTP routes contain no government decision logic

Routes validate public request shapes, call application services, and map safe
read views into response schemas. They do not import policy engines, graph
evaluators, journey orchestrators, or resolution navigators and contain no
eligibility, amount, graph-precedence, or resolution-success logic.

### Demo state is synthetic, journey-isolated, and process-local

Each journey creation loads a fresh typed copy of one allowlisted base fixture.
Mutable state is keyed by generated `journey_instance_id`, so a correction in
one browser journey cannot alter another. The in-memory store is explicitly
prototype infrastructure; restarting the API discards sessions, resolutions,
and decision history by design.

### Demo correction events are allowlisted and non-government

The API exposes exactly one synthetic mutation event for the Priya scenario. It
updates only the unique previous-employment record in that journey's isolated
snapshot, increments `state_revision` only when a fact changes, and never writes
the base fixture. Every response states that the event is synthetic and no real
government action occurred. There is no generic fact-mutation endpoint.

### Historical decision records remain immutable

Every explicit evaluation creates and appends a new frozen `DecisionRecord`,
including when the citizen-state revision is unchanged. Resolution transitions
and demo state changes never edit existing records. Decision history and detail
endpoints return safe summaries of those historical values.

### Public requests cannot submit citizen state

Journey creation accepts only an allowlisted persona ID, a typed citizen goal,
and an optional non-negative integer-rupee amount. Extra fields are forbidden;
raw `CitizenState`, capability results, filesystem paths, policy inputs, and
resolution instructions are not public request contracts.

### Resolution HTTP commands cannot mark success directly

Resolution creation accepts a decision ID and issue code, not a resolution ID.
The server derives the approved workflow from the current deterministic issue.
The only terminal check is the purpose-specific recheck command, which delegates
to Phase 4's trusted-state verifier. There is no `resolved` command or arbitrary
target-state endpoint.

### The application boundary owns runtime IDs and time

Application services generate UUID-based journey, decision, and resolution IDs
and timezone-aware UTC timestamps. These values are passed into deterministic
domain services; the policy engine, graph evaluator, orchestrator, and
resolution verifier remain free of hidden clocks and randomness.

### Mock capability behavior is explicit and not public input

Priya's demo uses a clearly named mock authoritative-capability provider for
`T13-ROUTE-001`. Its default is `AVAILABLE`; application construction can use
`UNKNOWN` for tests. No public endpoint accepts a capability override, and no
EPFO routing logic is reconstructed.

### API errors separate client, state, and configuration failures

Validation and expected application failures use one safe error envelope.
Missing resources return 404, invalid demo combinations return 400, invalid
state transitions return 409, and reviewed-configuration corruption returns
500. Configuration failures are never presented as citizen uncertainty, and
responses disclose neither stack traces nor local filesystem paths.

## Repository Layout After Phase 6

### Backend and frontend use explicit top-level directories

ClaimSaathi has one Python backend and will have one web frontend, so the
canonical application directories are top-level `backend/` and `frontend/`.
The Python package remains `backend/app/` and keeps its existing `from app...`
imports. The frontend directory is not created until Phase 7 is explicitly
authorized.

### Reviewed system artifacts remain at repository root

The versioned `policies/`, `journeys/`, and `resolutions/` configurations and
synthetic `fixtures/` remain top-level. They are reviewed inputs and auditable
system artifacts rather than private implementation details of either delivery
application. Backend configuration discovery therefore resolves the repository
as the parent of its own `backend/` directory and does not use an absolute
developer-machine path.

## Phase 7A — Frontend Foundation Boundaries

### Citizen entry is intent-first

The landing experience asks what the citizen wants to do and does not require
government form knowledge. Form labels are intentionally withheld until a
future journey evaluation returns reviewed process metadata.

### The frontend contains no eligibility logic

React validates transport-level input such as a required positive integer
amount, but it does not calculate policy limits, service thresholds, readiness,
or government outcomes. The backend API remains authoritative for every runtime
journey decision.

### Demo persona binding is explicit and validated

Landing-card presentation is local configuration, while persona IDs and their
compatible goals must be present in the backend persona response. Missing,
duplicate, or mismatched personas fail visibly instead of being substituted or
guessed.

### Synthetic status is prominent

The shared application shell and journey preparation view state that the
prototype uses synthetic data, performs no real EPFO action, and submits no
claim. Visual design deliberately avoids government emblems and official-portal
imitation.

### HTTP details stay behind a typed boundary

Components call focused demo and journey API modules rather than constructing
URLs or parsing error envelopes themselves. The central client preserves safe
backend error codes, messages, and HTTP status while replacing malformed or
unknown failures with a generic citizen-safe message.

## Phase 7B — Journey Evaluation Presentation Boundaries

### Evaluation is an explicit citizen action

Opening or refreshing a journey performs read-only journey and decision-detail
requests. A new deterministic evaluation occurs only when the citizen selects
“Check my journey” or “Check again”; pending controls prevent accidental double
submission.

### Refresh never creates a decision

When `GET /journeys/{id}` reports a latest decision, the frontend retrieves its
immutable detail by decision ID. It does not call the evaluation endpoint, and
an expired process-local journey is presented as a demo reset rather than
`UNABLE_TO_VERIFY`.

### Official form terminology appears only after evaluation

Although journey metadata already contains a reviewed process label, the
frontend deliberately withholds it before a decision exists. After evaluation,
the process card renders the exact backend label and visually connects it to the
citizen's original goal.

### `PASS` is ready to proceed, never approval

The closed state presentation map labels `PASS` as “Ready to proceed” and
states that it means only the configured prerequisites currently pass. It never
creates a claim-submission action, promise, or government approval state.

### Audit and source metadata are secondary

Citizen-facing state and prerequisites lead the page. Decision ID, policy and
graph versions, timestamp, reviewed source metadata, and the no-AI audit flag
remain available in secondary trust and provenance sections without exposing
raw records.

### The frontend does not calculate policy thresholds

React renders the backend's closed decision state and ordered prerequisite
metadata. It contains no service-duration threshold, balance percentage,
monetary cap calculation, graph aggregation, or eligibility condition.

## Phase 7C — Priya Resolution Presentation Boundaries

### Resolution state is always backend state

React sends only the purpose-specific start, external-step confirmation, and
recheck commands exposed by FastAPI. It replaces the displayed resolution state
only with a validated backend response and never infers external completion,
sets `RESOLVED`, patches a prerequisite, evaluates a waiting period, or accepts
a client-selected resolution workflow identifier.

### Demo mutation is visually and technically isolated

The Priya correction control is contained in a conspicuous `DEMO ONLY` panel
and calls only the allowlisted previous-exit-date synthetic event. The interface
states that the change is journey-local, synthetic, and performs no real
government action. Event success does not change the resolution display to
`RESOLVED`; a later explicit backend recheck is still required.

### Resolution success is not journey readiness

`RESOLVED` means only that the resolution verifier found its trusted success
condition satisfied. The frontend continues to show the existing
`ACTION_REQUIRED` journey decision and explains that the whole transfer journey
has not yet been checked again. Only an explicit full evaluation response with
state `PASS` can render “Ready to proceed” and reveal Form 13.

### Historical decisions are never rewritten

After re-evaluation, the frontend reads the real ordered decision-history
endpoint and presents the earlier `ACTION_REQUIRED` check beside the latest
`PASS` check. No historical object is synthesized or mutated in browser state.

### Refresh recovery is read-only

The Phase 6 API could read a resolution only when the browser already knew its
instance ID. Phase 7C adds a minimal read-only resolution-list endpoint so a
refresh can rediscover existing backend instances. Loading a journey performs
only journey, persona, decision, source, history, and resolution reads; it never
starts a resolution, confirms an action, simulates a correction, rechecks a
resolution, or evaluates a journey.

## Phase 7D — Interactive System Explorer Boundaries

### The trace API is observational only

The execution trace is built exclusively from an already stored journey
evaluation, its immutable `DecisionRecord`, and pinned reviewed journey/graph
metadata. Its application service receives no planner, orchestrator, policy
engine, graph evaluator, resolution navigator, demo mutator, or AI dependency.
Calling it cannot re-run decision logic, create a decision or resolution,
change a state revision, transition a resolution, or execute a demo event.

### Trace presentation is based on backend truth

The frontend does not invent rule outcomes, graph node states, versions, or
decision state for the interactive explorer. The live pipeline and detail panel
use typed data from the trace endpoint, rule source links resolve through the
existing source-metadata endpoint, and malformed or internally inconsistent
trace structures fail safely rather than being visualized.

### Live traces and recovery architecture are visibly distinct

Ravi, Priya, and Arjun live examples explicitly create and evaluate a new
isolated synthetic journey before reading its trace. Priya's subsequent
resolution and full-re-evaluation sequence is a structural explanation labeled
“Architecture · not the current live trace.” The interface never claims a
second decision exists unless that citizen journey actually completed the
separate recovery flow.

### The System Explorer is a secondary reviewer experience

Technical architecture remains on `/how-it-works` for judges, reviewers,
developers, and policy/product stakeholders. A small secondary header link
exposes it without moving package, class, or trace detail into the normal
citizen entry journey.

### AI remains outside the deterministic decision path

Every stored trace records `ai_used_for_decision: false`. The explorer depicts
the explanation layer downstream of a canonical result. At the Phase 7D
boundary that layer was future-only; Phase 8 later activated it as an optional
one-way presentation path without changing the trace or decision contract.

### The current-process comparison is deliberately scoped

The form-first side-by-side is a simplified citizen journey model used to
explain orchestration. It is explicitly not an exhaustive audit of EPFO or a
claim about every external government experience.

## Phase 7E — Policy-Review Presentation Boundaries

### `POLICY_REVIEW_REQUIRED` is a first-class citizen UI state

The citizen renderer selects the policy-review experience from the backend
decision state, not from a persona identifier. It presents an intentional safe
stop and never reframes the state as rejection, ineligibility, system failure,
or a transport error.

### Official process identification is not readiness

Form 19 may be shown after the backend identifies the evaluated journey, but it
is labeled only as the identified official process. The page does not reuse the
`PASS` process card and explicitly states that the process label does not mean
the journey is verified as ready.

### Process metadata and rule evidence remain distinct

The form-label source is fetched only from the backend-provided official-process
source ID and is described as process metadata. Sources used by evaluated rules
remain a separate decision-provenance section. An absent source on the
policy-review marker is surfaced honestly rather than attributing the unresolved
rule to the form-label source.

### No resolution is invented without reviewed configuration

When a policy-review decision carries no approved resolution, the frontend
offers no resolution start, form submission, wait instruction, or government
action. It provides only product-explanation and start-another-journey links.

### AI cannot bridge unresolved policy

The structural backend value `ai_used_for_decision: false` remains visible, and
the citizen copy states that AI was not used to fill the policy gap. Any future
optional explanation capability remains unable to change the deterministic
decision state.

### The final-settlement waiting period remains unresolved

The frontend contains no numeric final-settlement waiting period and does not
interpret the unresolved policy marker. The reviewed configuration remains
unchanged and continues to return `POLICY_REVIEW_REQUIRED` until a separately
authorized policy-review process supplies a safe versioned basis.

## Phase 7F — Submission Hardening Boundaries

### Browser regression tests use the real public demo API

Playwright starts local FastAPI and Next.js processes and creates a fresh
synthetic journey for every Ravi, Priya, and Arjun test. It does not mock API
responses, reuse journey IDs from earlier tests, reset global backend state, or
add a database. Failure traces and screenshots remain ignored local artifacts.

### Infrastructure failures are not citizen-policy states

A missing process-local journey is presented as an expired demo with a link to
start again. A network-unavailable demo service and an unexpected page-render
error receive separate transport/application recovery UI. None is converted to
`UNABLE_TO_VERIFY`, `POLICY_REVIEW_REQUIRED`, or another domain result.

### Demo restart is frontend-only

“Start a new journey” and “Return to ClaimSaathi” are ordinary links to `/`.
Journey isolation already makes a global reset unnecessary, so Phase 7F adds no
backend reset endpoint and does not mutate another journey's synthetic state.

### Explicit actions remain the only mutation boundary

Create, evaluate, start resolution, confirm, recheck, simulate, and trace-demo
actions disable only their relevant controls while pending. Refresh and page
load remain GET-only. Failures preserve the last confirmed backend result and
never advance a decision, resolution, or synthetic correction optimistically.

### Accessibility is part of the presentation contract

Valid states use consistent text, icon, and visual treatment rather than color
alone. Major explicit state changes receive focus, asynchronous changes are
announced, controls retain visible focus and practical touch targets, and the
trace/graph remain operable as vertical structures at narrow widths. Motion is
nonessential and respects reduced-motion preferences; this is a WCAG 2.1 AA
fundamentals target, not a certification claim.

### Frontend hardening remains non-authoritative

Centralized state labels, icons, loading text, error recovery, metadata, and
responsive CSS are presentation concerns only. They do not add policy
thresholds, interpret eligibility, resolve uncertainty, mark a resolution
complete, or reveal an official process before the corresponding backend
decision permits it.

## Phase 8 — Guarded AI Explanation Boundaries

### Canonical wording precedes every optional provider call

One frozen `CanonicalExplanation` is derived only from an existing stored
`DecisionRecord` and presentation-safe reviewed metadata. It recalculates no
rule, threshold, prerequisite, resolution, process, or policy meaning and exists
when AI is disabled.

### Sanitization is a positive allowlist

`SanitizedExplanationInput` is constructed field by field and is the provider's
only decision-related input. `DecisionRecord`, `CitizenState`, rule objects,
graph internals, resolution objects, HTTP bodies, arbitrary frontend text, raw
identifiers, monetary facts, employment dates, and service duration cannot
cross this boundary.

### Provider authority ends at presentation

`ExplanationProvider` returns only bounded `ExplanationContent`. The OpenAI
adapter lives under infrastructure integrations, uses the Responses API with
schema-constrained Structured Outputs, supplies no tools, disables SDK retries,
and uses a finite configured timeout. Domain, policy, prerequisite, journey,
and resolution packages do not import OpenAI.

### Structured output receives deterministic semantic review

Schema adherence cannot prove factual authority. A conservative validator
rejects new amounts, percentages, durations, dates, form IDs, URLs, actions,
approval/rejection/guarantee claims, and stronger eligibility or readiness
claims. `POLICY_REVIEW_REQUIRED` must preserve an explicit safe stop. Rejection
selects canonical fallback; it never asks another model or retries into delay.

### Explanation is a read-only stored-decision operation

The endpoint verifies journey ownership and looks up an immutable decision in
server memory. It creates no decision, mutates no history or citizen revision,
and transitions no resolution. The response structurally fixes
`ai_used_for_decision` to `false` and separately reports provider and fallback
use.

### AI is disabled by default and never required

`AI_ENABLED` defaults to `false`; absence of `OPENAI_API_KEY` also keeps the
provider disabled. The configured default model is `gpt-5.6-luna` with no
silent model fallback. All provider and validation failures return deterministic
English or Hindi wording while the citizen result remains fully usable.

## Phase 8.5 — Accessibility, Localization, and Cache Boundaries

### Locale is presentation state, not route or journey state

`next-intl` renders exactly two committed catalogues without locale-prefixed
URLs. English is canonical and initially rendered; Hindi is a lazy local build
chunk. Changing locale updates no route, creates no journey, and invokes no API
or Phase 8 explanation operation. Backend enum values and identifiers remain
unchanged beneath localized citizen copy.

### Text and contrast preferences are local presentation state

The only allowed text scales are 100, 125, 150, 175, and 200 percent. A root
data attribute changes rem-based typography; transforms and fixed-canvas zoom
are prohibited. Contrast swaps reviewed CSS tokens only. Both preferences are
stored locally without authentication and have no business-state dependency.

### Static availability must not imply dynamic freshness

Serwist may precache emitted static assets and the named static shells. Every
API request, non-GET request, and `/journey/*` navigation is NetworkOnly.
Background sync and mutation replay are absent. An offline loaded result is
explicitly historical presentation until the citizen reconnects and performs a
new explicit check.

### Connectivity failure is infrastructure state

Offline, timeout, and slow-network presentation never synthesize
`UNABLE_TO_VERIFY`, `POLICY_REVIEW_REQUIRED`, or another domain state. The last
confirmed deterministic result remains visible; a blocked network action may
be retried explicitly after reconnection.

### Translation authoring is offline and reviewed

Runtime translation services and browser models are prohibited. IndicTrans2
may assist future authoring, but any generated string must receive review and
be committed in the static catalogue. LibreTranslate is not used in Phase 8.5.
