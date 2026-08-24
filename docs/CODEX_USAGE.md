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
