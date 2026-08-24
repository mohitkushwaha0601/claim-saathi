# ClaimSaathi Build Plan

Application implementation has not started. Each phase below requires explicit
authorization before work begins, and every phase remains subject to
`AGENTS.md` and `ENGINEERING.md`.

## Phase 1 — Domain Models

Define framework-independent citizen-intent, process, prerequisite, result,
uncertainty, and provenance contracts without encoding EPFO policy rules.

## Phase 2 — Policy Registry + Policy Engine

Define the versioned, source-backed policy format and deterministic registry and
evaluation engine, including explicit handling for unavailable and conflicting
policy evidence.

## Phase 3 — Prerequisite Graph

Represent prerequisite dependencies and evaluate them deterministically with
structured blockers, reason codes, and uncertainty propagation.

## Phase 4 — Resolution Navigator

Map approved deterministic blockers to source-backed resolution guidance without
inventing actions, rules, URLs, or outcomes.

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
