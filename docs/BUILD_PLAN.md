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

## Phase 5 — Journey Orchestrator + Decision Records

Coordinate intent mapping, policy evaluation, prerequisites, and resolution
guidance while producing reproducible, auditable decision records.

## Phase 6 — FastAPI

Expose application use cases through thin FastAPI transport adapters using
Python 3.12+, Pydantic v2, and explicit mock-integration labeling.

## Phase 7 — Frontend

Build the Next.js, TypeScript, and Tailwind presentation layer with accessible
uncertainty, blocker, provenance, and mock-status communication and no business
logic in components.

## Phase 8 — Safe AI Gateway

Optionally add an isolated gateway limited to simplifying, translating, or
summarizing approved deterministic outputs, with a deterministic fallback and
no path back into government decisions.

## Phase 9 — E2E Tests, Accessibility, Deployment

Validate complete mocked citizen journeys, safety invariants, accessibility,
operational configuration, and deployment behavior before any demonstration or
release.
