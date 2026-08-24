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

## Phase 7 — Frontend (In Progress — Phases 7A–7E Complete)

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
no-AI audit metadata.

Phase 7C completed on 2026-08-24 with Priya's complete backend-driven recovery
experience. It renders every prerequisite, presents the missing Date of Exit in
citizen-facing language, starts only the approved resolution attached to the
decision, preserves backend guidance and sources, follows the legal state
machine through waiting and still-blocked states, isolates the synthetic demo
correction, and requires backend verification before `RESOLVED`. A separate
explicit full journey evaluation creates a new `PASS` decision and reveals Form
13 while preserving the earlier `ACTION_REQUIRED` history. A minimal read-only
resolution-list endpoint supports refresh recovery without automatic side
effects. Phase 7 remains in progress; Arjun's polished safety flow and any
later explicitly authorized frontend work are not part of Phase 7C.

Phase 7D completed on 2026-08-24 with a dedicated judge/reviewer-facing System
Explorer at `/how-it-works`. A new observational FastAPI trace endpoint projects
only already stored deterministic artifacts into typed intent, planner, policy,
prerequisite-graph, and immutable-decision stages. The responsive frontend runs
explicit Ravi, Priya, and Arjun synthetic create/evaluate/trace sequences and
supports keyboard stage inspection, connected graph viewing, and reviewed
source access. Static architecture sections distinguish the current live trace
from Priya's conceptual recovery flow, explain explicit uncertainty, and keep a
disabled optional future AI explanation layer outside the decision path. Phase
7 remains in progress; Arjun's polished citizen safety flow and final polish
were not started.

Phase 7E completed on 2026-08-24 with a reusable citizen-facing
`POLICY_REVIEW_REQUIRED` safe-stop experience. Arjun's journey now withholds
Form 19 until the explicit backend check, presents policy uncertainty as a
valid deliberate stop, distinguishes identified process metadata from
readiness and rule evidence, and makes the no-guess/no-AI boundary visible. No
waiting period or resolution is invented, and refresh restores the immutable
backend decision using read-only requests. Phase 7 remains in progress; final
polish, deployment, and runtime AI were not started.

## Phase 8 — Safe AI Gateway

Optionally add an isolated gateway limited to simplifying, translating, or
summarizing approved deterministic outputs, with a deterministic fallback and
no path back into government decisions.

## Phase 9 — E2E Tests, Accessibility, Deployment

Validate complete mocked citizen journeys, safety invariants, accessibility,
operational configuration, and deployment behavior before any demonstration or
release.
