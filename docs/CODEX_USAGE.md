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
