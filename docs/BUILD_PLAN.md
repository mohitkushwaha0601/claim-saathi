# ClaimSaathi Build Plan

Implementation proceeds only through explicitly authorized phases. Every phase
below remains subject to `AGENTS.md` and `ENGINEERING.md`.

## Phase 1 — Domain Models (Complete)

Define framework-independent citizen-intent, process, prerequisite, result,
uncertainty, and provenance contracts without encoding EPFO policy rules.

Completed on 2026-08-24 after the full Phase 1 domain test suite passed. No
policy registry, policy engine, or policy values were introduced.

## Phase 2 — Policy Registry + Policy Engine (Complete)

Define the versioned, source-backed policy format and deterministic registry and
evaluation engine, including explicit handling for unavailable and conflicting
policy evidence.

Completed on 2026-08-24 after the full backend test suite passed. The engine
evaluates one rule at a time and does not aggregate prerequisites or produce a
`JourneyDecision`.

## Phase 3 — Prerequisite Graph (Complete)

Represent prerequisite dependencies and evaluate them deterministically with
structured blockers, reason codes, and uncertainty propagation.

Completed on 2026-08-24 after the full backend test suite passed. Graphs compose
supplied `RuleResult` states using the single documented `ALL_OF` precedence;
they do not evaluate policy, route citizen intent, or create journey decisions.

## Phase 4 — Resolution Navigator (Complete)

Map approved deterministic blockers to source-backed resolution guidance without
inventing actions, rules, URLs, or outcomes.

Completed on 2026-08-24 after the full backend test suite passed. The navigator
maps exact issue codes to immutable approved workflows, applies explicit state
transitions, and resolves only after an allowlisted verifier checks a fresh
trusted `CitizenState`. It does not re-run policy or prerequisite graphs.

## Phase 5 — Journey Planner + Journey Orchestrator + Decision Records (Complete)

Coordinate intent mapping, policy evaluation, prerequisites, and resolution
guidance while producing reproducible, auditable decision records.

Completed on 2026-08-24 after the full backend test suite passed. Reviewed
configuration now maps typed citizen goals to journeys; the orchestrator runs
all pinned policy rules and the full prerequisite graph from scratch and emits
immutable `JourneyDecision` and `DecisionRecord` outputs. Resolution initiation
is explicit and limited to the resolution attached to a current deterministic
issue. No transport, persistence, government integration, or AI was added.

## Phase 6 — FastAPI Application Layer (Complete)

Expose application use cases through thin FastAPI transport adapters using
Python 3.12+, Pydantic v2, and explicit mock-integration labeling.

Completed on 2026-08-24 after the full Phase 1–6 backend suite and API
TestClient suite passed. Thin routes now expose synthetic persona discovery,
journey creation and evaluation, immutable decision history, approved
resolution navigation, one allowlisted journey-local demo correction event,
and reviewed policy-source metadata. Runtime state is process-local and no live
government integration, database, frontend, authentication, or AI was added.
The Python service now resides in the canonical top-level `backend/` directory.

## Phase 7 — Frontend (In Progress — Phases 7A and 7B Complete)

Create the top-level `frontend/` directory and build the Next.js, TypeScript,
and Tailwind presentation layer with accessible uncertainty, blocker,
provenance, and mock-status communication and no business logic in components.

Phase 7A completed on 2026-08-24 after the frontend type, lint, component, and
production-build checks passed. The mobile-first foundation now discovers real
synthetic personas from FastAPI, presents citizen goals before government form
terminology, creates isolated demo journeys without evaluating them, and keeps
API details behind a typed client boundary. At the Phase 7A boundary, journey
evaluation and resolution navigation remained future work.

Phase 7B completed on 2026-08-24 after frontend type, lint, component,
production-build, and live browser checks passed. The Ravi experience now runs
an explicit backend evaluation, renders the returned prerequisite states,
reveals official process metadata only after evaluation, restores existing
decision detail on refresh without re-evaluating, and shows reviewed source and
no-AI audit metadata. Priya resolution interaction remains future Phase 7 work.

## Phase 8 — Safe AI Gateway

Optionally add an isolated gateway limited to simplifying, translating, or
summarizing approved deterministic outputs, with a deterministic fallback and
no path back into government decisions.

## Phase 9 — E2E Tests, Accessibility, Deployment

Validate complete mocked citizen journeys, safety invariants, accessibility,
operational configuration, and deployment behavior before any demonstration or
release.
