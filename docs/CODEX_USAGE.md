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
