# Codex Usage Log

## 2026-08-24 — Repository Foundation

Codex established the initial ClaimSaathi repository architecture and permanent
engineering constraints. This work created the backend, frontend, policy,
fixture, test, and documentation scaffold; documented deterministic,
source-backed, versioned, reproducible, and auditable government-decision
requirements; defined mock-integration and safe-AI boundaries; and recorded the
phased build plan. No domain models, policy rules, API routes, frontend screens,
or runtime AI integration were implemented.

## 2026-08-24 — Phase 1 Domain Models

Codex established the Python 3.12+ backend project and implemented immutable
Pydantic v2 contracts for citizen intent and state, journey metadata, future
policy data, prerequisite nodes and rule results, approved resolution workflows,
canonical journey decisions, and auditable decision records. It added exactly
three synthetic fact-only demo personas and a pytest suite covering validation,
closed enum states, synthetic-only citizen data, integer-rupee constraints,
stable JSON round trips, and the invariant that AI cannot participate in a
government decision. No policy values, evaluation logic, routes, frontend code,
persistence, integrations, or AI calls were added.

## 2026-08-24 — Phase 2 Policy Registry and Deterministic Engine

Codex implemented immutable reviewed-source and versioned-policy registries, a
local JSON loader, strict deterministic operators, safe typed field-path
resolution, allowlisted named evaluators, authoritative-capability handling, and
one-rule-at-a-time `RuleResult` evaluation. It encoded only the prompt-supplied
MVP partial-withdrawal and transfer values plus a non-executable final-settlement
conflict demo. Tests cover policy immutability, source lifecycle, all operators,
integer-only amount limits, missing-data uncertainty, source and rule conflicts,
capability inputs, output sanitization, reproducibility, and the absence of AI,
network, dynamic expression, journey aggregation, or final-settlement guesses.
No prerequisite propagation, journey orchestration, resolution execution,
routes, frontend, persistence, scraping, or AI integration was added.

## 2026-08-24 — Phase 3 Prerequisite Graph

Codex implemented immutable, external JSON prerequisite graphs; strict load-time
validation for node shapes, topology, reachability, and unique rule bindings;
and a pure deterministic evaluator that composes already-produced `RuleResult`
states using the approved `ALL_OF` precedence. The evaluation preserves every
node state and non-pass leaf identifier without copying observed citizen values.
Tests cover malformed graphs, missing rule-result invocation errors,
reproducibility, semantic precedence, dependency boundaries, and the Ravi,
Priya, and Arjun MVP graph outcomes. No policy evaluation was moved into the
graph layer, and no journey planning, `JourneyDecision`, resolution execution,
routes, frontend, persistence, network access, or AI integration was added.

## 2026-08-24 — Phase 4 Resolution Navigator

Codex implemented the single approved `RES_EXIT` workflow as immutable,
source-backed configuration; an exact issue-code catalog; explicit resolution
state transitions; an allowlisted success verifier; and immutable resolution
instances carrying workflow and citizen-state version audit metadata. The
navigator can reach `RESOLVED` only by rechecking a fresh trusted
`CitizenState`; citizen confirmation, elapsed time, and state-version changes do
not prove success. Tests cover configuration rejection, catalog behavior, all
MVP transitions, missing/ambiguous/wrong employment records, deterministic
replay, source scope, and forbidden dependencies. No policy or graph
re-evaluation, journey decision, persistence, government integration, route,
frontend, or AI functionality was added.

## 2026-08-24 — Phase 5 Journey Planning and Orchestration

Codex connected the previously independent deterministic layers while
preserving their ownership boundaries. Specifically, Codex:

- implemented exact, reviewed-config journey planning from typed citizen goals;
- integrated Phase 2 policy execution for every rule pinned by a journey;
- integrated Phase 3 full prerequisite-graph evaluation;
- connected Phase 4 approved-resolution initiation only for a resolution linked
  to an issue in the current decision;
- implemented immutable journey instances, journey decisions, and auditable
  decision records with citizen, policy, graph, and journey-definition versions;
- wrote end-to-end deterministic tests for Ravi, Priya, Arjun, stale snapshots,
  capability uncertainty, and historical decision immutability; and
- preserved the no-AI government-decision boundary with
  `ai_used_for_decision: Literal[False]` and dependency safety tests.

No FastAPI route, frontend, database, external integration, policy change, graph
aggregation change, or AI functionality was introduced.

## 2026-08-24 — Phase 6 FastAPI Application Layer

Codex implemented a FastAPI application factory with explicit demo metadata,
environment-configured CORS, safe error envelopes, OpenAPI documentation, and
thin versioned routes. It added application services that generate IDs and UTC
timestamps at the boundary while delegating every journey decision to the
existing Phase 5 orchestrator and every resolution success check to Phase 4.

Codex also implemented an allowlisted synthetic persona provider, a clearly
named mock authoritative-capability provider, journey-isolated in-memory state,
immutable decision history, safe decision and prerequisite summaries, and one
hackathon-only Priya correction event that never writes fixture files or claims
a government action. FastAPI TestClient coverage proves the complete Ravi,
Priya, and Arjun flows, Priya session isolation, validation and error behavior,
source lookup without network access, absence of direct resolution success,
and continued operation with no AI dependency.

No frontend, real EPFO integration, database, authentication, background work,
claim submission, policy change, graph change, or runtime AI was introduced.

## 2026-08-24 — Repository Layout Migration After Phase 6

Codex made the repository consistent with its simplified two-application
layout before frontend development began. The initial scaffold used `apps/api`
for the Python service and an empty `apps/web` placeholder. The migration moved
the service to top-level `backend/`, removed the unused web placeholder, and
reserved top-level `frontend/` for the future Phase 7 implementation.

Codex updated current commands, repository-root configuration discovery, and
path-sensitive architecture tests while preserving the Python package name
`app`, all government-policy configuration, and all application behavior. The
reviewed policy, journey, resolution, and synthetic fixture directories remain
top-level system artifacts. No frontend or runtime AI was added.

## 2026-08-24 — Phase 7A Frontend Foundation

Codex created the top-level Next.js, TypeScript, Tailwind, and npm frontend;
established a typed API client from the inspected FastAPI OpenAPI contract; and
built a mobile-first, intent-first citizen entry experience. The application
loads synthetic persona identifiers from the real backend, validates its exact
demo-persona bindings, accepts Ravi's requested amount as positive integer
rupees, creates real in-memory journey instances, and stops at a truthful
preparation page without evaluating a journey.

The foundation includes visible synthetic/non-government boundaries, semantic
structure, keyboard focus states, announced loading and error states, safe API
error handling, and component tests for the three intents, amount validation,
backend persona consumption, configuration drift, and journey creation. No
eligibility calculation, policy value, government form label on the landing
cards, journey-decision mock, runtime AI, or resolution UI was added.

## 2026-08-24 — Phase 7B Ravi Journey Evaluation

Codex extended the journey route into the first complete deterministic citizen
check. It inspected the live FastAPI OpenAPI document, added runtime-validated
clients for evaluation, decision detail, and policy-source metadata, and made
evaluation an explicit citizen action. The UI renders backend prerequisite
labels and states, reveals the returned official process only after evaluation,
shows source provenance and versioned audit metadata, and makes the structural
`ai_used_for_decision: false` result understandable without exposing raw JSON.

Refresh restores the backend's latest immutable decision through a detail GET
without creating a new evaluation. A failed later check preserves an already
displayed decision, while expired in-memory journey URLs receive a demo-reset
explanation rather than a citizen uncertainty state. Tests cover Ravi's PASS
flow and Form 31 reveal, explicit loading, duplicate-submit prevention, source
links, refresh behavior, safe 404 handling, failure preservation, and generic
non-PASS rendering. No policy threshold, resolution interaction, backend
change, or runtime AI was added.

## 2026-08-24 — Phase 7C Priya Resolution Navigator UI

Codex implemented Priya's complete citizen-recovery experience against the real
FastAPI contracts. The frontend now renders the generic `ACTION_REQUIRED`
experience with every prerequisite, presents `EXIT_DATE_MISSING` using safe
citizen wording, derives the approved `RES_EXIT` opportunity from backend rule
results, and displays the backend's ordered steps, conditional Mark Exit
guidance, official route, and distinct rule and resolution sources.

The navigator follows explicit backend commands through
`CITIZEN_ACTION_REQUIRED`, `WAITING_FOR_UPDATE`, `STILL_BLOCKED`, and
backend-verified `RESOLVED`. Its visibly separate `DEMO ONLY` panel invokes only
the allowlisted journey-local synthetic Date-of-Exit event and preserves the
returned `real_government_action_performed: false` boundary. Resolution success
does not patch the journey: the citizen must explicitly run the full evaluation
again before a new backend `PASS` decision reveals Form 13, and the UI reads the
immutable decision history to retain the earlier `ACTION_REQUIRED` check.

Codex also added the smallest backend enhancement required for robust refresh
recovery: a read-only endpoint that lists existing journey resolution instances
without transitioning them. Frontend and FastAPI tests cover the complete flow,
state restoration, command endpoints, safe failures, and absence of optimistic
advancement. No policy logic, resolution semantics, live government
integration, Arjun polished flow, or runtime AI was added.

## 2026-08-24 — Phase 7D Interactive System Explorer

Codex implemented the dedicated `/how-it-works` product page for judges,
reviewers, developers, and policy/product stakeholders while leaving the normal
citizen entry flow simple. The page explains the intent-first product thesis,
the safely scoped form-first comparison, the deterministic architecture,
reviewed configuration artifacts, explicit uncertainty states, Priya's
resolution and full re-evaluation boundary, immutable decision history, and the
current no-AI decision boundary.

Codex added a typed read-only execution-trace API whose service receives only
the existing in-memory store and reviewed journey catalog. It projects an
already stored evaluation into closed intent, planner, policy-engine,
prerequisite-graph, and decision-record stages; it does not possess or invoke a
planner, orchestrator, policy engine, graph evaluator, resolution navigator,
demo mutator, or AI gateway. API tests compare journey, revision, decision, and
resolution state before and after repeated trace reads and rig the deterministic
evaluators to fail if a trace attempts to call them.

The frontend adds runtime-validated trace contracts, explicit Ravi/Priya/Arjun
synthetic create → evaluate → trace interactions, an accessible selectable
pipeline, stored rule/source detail, a connected responsive prerequisite tree,
Priya's separately labeled recovery architecture, and Arjun's backend-driven
safe stop. No policy threshold, graph precedence, journey mapping, resolution
or decision semantic, external government action, final-polish work, or runtime
AI was added.

Verification evidence: the backend suite passed with 260 tests and the offline
lockfile check succeeded; the frontend passed typecheck, lint, 47 tests, and the
Next.js production build. Live browser checks generated all three backend
traces, inspected Ravi's rules, graph, and source metadata, confirmed Priya's
live/architecture separation and Arjun's safe stop, exercised a stage with the
keyboard, found no console or CORS errors, and confirmed a 390px viewport had
no horizontal overflow. The existing home and Priya journey routes also
remained operational.

## 2026-08-24 — Phase 7E Arjun Safety Experience

Codex implemented a reusable `POLICY_REVIEW_REQUIRED` citizen renderer selected
only from the backend decision state. Before evaluation, Arjun's journey keeps
Form 19 and all policy-review detail hidden. After the explicit real API check,
the page presents a calm safe-stop hero, distinguishes what the journey mapping
identified from what the reviewed policy cannot safely determine, and states
that ClaimSaathi stopped instead of guessing.

The experience shows the backend-provided Form 19 label only as an identified
official process, explicitly separates its metadata source from rule evidence,
and exposes policy, graph, journey-definition, and no-AI audit fields in
technical details. It provides no resolution start, readiness action, numeric
waiting period, eligibility conclusion, or government outcome. Refresh remains
read-only and source-request failures leave the stored decision visible.

Frontend boundary coverage verifies pre-evaluation withholding, explicit
evaluation, the policy-review hero and safety facts, Form 19's non-readiness
semantics, backend-only source IDs, absence of resolution controls, read-only
refresh restoration, safe network failure behavior, and the System Explorer
link. No backend, policy, graph, journey, resolution, decision-semantic, runtime
AI, deployment, or final-polish change was made.

Verification evidence: frontend typecheck and lint passed, all 51 frontend tests
passed, the Next.js production build succeeded, and `git diff --check` passed.
Live browser verification used the real FastAPI sequence, confirmed Form 19 was
absent before evaluation and safely identified after
`POLICY_REVIEW_REQUIRED`, observed a GET-only refresh, found no console or CORS
errors, and measured a 390px viewport with no horizontal overflow. Ravi still
reached backend `PASS`, and Priya still exposed her backend resolution action.

## 2026-08-24 — Phase 7F Submission Hardening

Codex hardened the existing frontend without changing citizen or government
decision semantics. Shared decision visuals now keep labels, icons, and tones
consistent across result headers, prerequisite lists, and execution traces.
Explicit evaluation focuses the new backend result, amount entry receives focus
when revealed, source links have descriptive names, and source metadata requests
deduplicate while in flight and offer explicit retry. All mutation controls
retain scoped pending guards and preserve the last confirmed backend state on
failure.

The home page now distinguishes an unavailable demo API from policy
uncertainty, with environment-safe production wording. Expired in-memory
journeys and unknown Next.js routes have separate restart paths, and an App
Router error boundary avoids exposing raw render errors. Metadata, viewport,
theme color, and the original lightweight icon are configured without adding
fonts or runtime dependencies. A browser-found 320px safe-state overflow was
fixed without hiding information.

Playwright was added as development-only tooling. Seven Chromium tests start
the real local FastAPI and Next.js servers and cover Ravi `PASS`/Form 31,
Priya's complete resolution and explicit re-evaluation/Form 13 path, Arjun's
policy-review/Form 19 safe stop, Ravi's interactive System Explorer trace,
320/375/390/430px and 1280/1440px overflow checks, page-level not-found recovery,
expired demo recovery, GET-only refresh behavior, keyboard action activation,
and browser console/CORS failures. Every persona test creates a fresh synthetic
journey and no backend response is mocked.

Verification evidence: 260 backend tests passed; `uv lock --check --offline`
passed; frontend typecheck and lint passed; 57 Vitest tests passed; the Next.js
production build succeeded; and all 7 Playwright tests passed. A final live
Playwright CLI check at 320px measured equal viewport and document widths,
activated the Policy Engine stage with Enter, observed the real
GET-personas/create/evaluate/trace/source network sequence, and found zero error
console entries. No backend or policy artifact changed, and no runtime AI,
authentication, database, analytics SDK, deployment, or government integration
was added.

## 2026-08-24 — Phase 8 Guarded AI Explanation Layer

Codex added a one-way, optional explanation path after immutable stored
decisions. The backend now produces a frozen deterministic
`CanonicalExplanation`, copies only an inspectable positive allowlist into
`SanitizedExplanationInput`, and can pass that object to an isolated
`ExplanationProvider`. The OpenAI implementation uses the current Responses API
with Pydantic Structured Outputs, the configured `gpt-5.6-luna` model, no
tools, no SDK retries, and a short finite timeout.

A deterministic semantic validator rejects invented amounts, percentages,
durations, dates, form IDs, URLs, actions, approval/rejection/guarantee claims,
and stronger eligibility or readiness claims. Arjun's policy-review state has
additional safe-stop validation. Every disabled, missing-key, provider,
timeout, malformed-output, and unsafe-output path returns a deterministic
English or Hindi fallback without changing an HTTP decision response or any
business state.

The frontend adds only the post-decision “Explain simply” and “हिंदी में
समझाएँ” controls. It makes no automatic request, keeps Ravi's Form 31 result,
Priya's resolution navigator, and Arjun's policy safe stop primary, and labels
real AI assistance separately from fallback. The System Explorer now shows the
one-way explanation path and no reverse authority. Normal component and browser
tests use AI disabled and no API key. No chat, additional language, policy
change, deterministic semantic change, live government integration, or
deployment was added.

Verification evidence: 302 backend tests passed and the uv lockfile resolved
offline; frontend typecheck and lint passed; all 66 Vitest tests passed; the
Next.js production build succeeded; all 7 real-backend Chromium tests passed
with AI explicitly disabled and no API key; and `git diff --check` passed. No
real OpenAI request was made because no local `OPENAI_API_KEY` was available.
