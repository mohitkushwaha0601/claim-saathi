# ClaimSaathi Engineering Standard

ClaimSaathi maps a citizen's intent to the appropriate EPFO process, evaluates
prerequisites using deterministic policy data, explains blockers, and guides
resolution. Because the product concerns government services, its engineering
standard is evidence-first: the system must be able to show what it concluded,
why it concluded it, and which versioned sources supported that conclusion.
All government decisions must be deterministic, source-backed, versioned,
reproducible, and auditable.

## Repository Layout

ClaimSaathi has one Python service under `backend/` and will have one web
application under top-level `frontend/` when that phase is authorized. The
reviewed `policies/`, `journeys/`, `resolutions/`, and synthetic `fixtures/`
directories remain at repository root because they are system artifacts shared
across delivery layers, not implementation details of a route or UI component.

The backend application package remains `backend/app/`; Python imports continue
to use `from app...`. Backend development commands run from `backend/`.

## Architecture Principles

- Separate the domain and deterministic application logic from delivery
  frameworks. FastAPI and Next.js are adapters, not homes for business rules.
- Keep policy evaluation, prerequisite evaluation, resolution navigation,
  orchestration, decision recording, integrations, and presentation as distinct
  concerns with explicit contracts.
- Direct dependencies inward: presentation and integration layers depend on
  application/domain contracts, while deterministic decision logic must not
  depend on web frameworks, runtime AI, or concrete external services.
- Policies are data or configuration interpreted by a deterministic engine.
  They are not conditional fragments embedded across Python or TypeScript.
- External systems sit behind adapters. The hackathon uses only clearly marked
  mock government adapters.
- Prefer explicit inputs and outputs, stable reason codes, and structured
  uncertainty over hidden state, implicit defaults, or prose-only decisions.
- Business logic must never live in frontend components or FastAPI route
  handlers.

## Government Safety Boundaries

The authoritative boundary includes eligibility, identity and KYC,
prerequisites, monetary amounts and limits, government policy, approval or
rejection, prescribed actions, and government outcomes. Only deterministic,
source-backed code and versioned policy data may participate in that boundary.

The system must not:

- claim to perform an authoritative government action;
- infer missing citizen facts or government rules;
- convert a mock response into an authoritative result;
- silently choose between conflicting sources;
- present unsupported guidance, URLs, requirements, amounts, or outcomes; or
- use AI output as a policy, fact, prerequisite, action, or decision input.

When required facts cannot be established, the result is
`UNABLE_TO_VERIFY`. When policy evidence is missing, conflicting, ambiguous,
stale, or requires human interpretation, the result is
`POLICY_REVIEW_REQUIRED`. These are valid product states, not errors to hide.

## Deterministic Decision Rules

A government-related result must be a deterministic function of explicit,
validated inputs and an identified set of policy versions. The same inputs and
policy versions must reproduce the same substantive result.

Decision logic must:

- execute independently of runtime AI and external prose generation;
- use stable identifiers and machine-readable reason codes;
- expose all material prerequisites and blockers rather than relying on a
  single unexplained boolean;
- distinguish false, unknown, unverifiable, and policy-review states;
- avoid implicit current-time, locale, network, or mutable-global inputs;
- fail closed to an uncertainty state when evidence is insufficient; and
- produce enough provenance for a future decision record to identify input
  references, policy and rule versions, sources, results, reason codes, and
  uncertainty states.

Timestamps and request metadata may be recorded for audit, but they must not
silently influence a decision. If time is a legitimate policy input, it must be
provided explicitly and tested with a controlled clock.

## Policy Versioning Principles

- Every policy set and rule has a stable identifier and an explicit version.
- Every rule carries source provenance, including a source reference and the
  publication or effective date when the source provides one.
- Released policy versions are immutable. A correction or interpretation creates
  a new version rather than rewriting history.
- Policy activation is explicit. The active version must be recorded with each
  result, and historical versions must remain available for reproduction.
- Applicability and effective periods are data, not comments or hidden code.
- Source conflicts are retained and surfaced as `POLICY_REVIEW_REQUIRED` until
  resolved through a documented review. Resolution must record why one
  interpretation was approved and supersede policy data through a new version.
- Fixtures and examples are never policy sources. No EPFO rule may be added
  without verified source evidence.
- Policy schema and semantic changes require migration or compatibility planning
  so historical decisions remain interpretable.

## Testing Expectations

Testing is part of the decision system, not a follow-up activity.

- Unit-test domain behavior and each deterministic rule using fixed inputs and
  explicit policy versions.
- Add regression tests for every corrected defect.
- Cover positive, negative, boundary, empty, malformed, unverifiable, conflict,
  unsupported-version, and dependency-failure cases.
- Add reproducibility tests proving that identical inputs and policy versions
  yield identical substantive results.
- Test that policy versions and source provenance appear in decision outputs or
  records where required by their contract.
- Test adapters separately from the domain and use contract tests to keep mock
  and future live-adapter interfaces aligned without implying equivalent
  authority.
- Test API routes as transport adapters and frontend components as presentation;
  their tests must not be the only coverage of business behavior.
- Future AI gateway tests must prove that AI is downstream of an approved
  deterministic result, cannot mutate it, and can fail or be removed without
  changing it.
- Run targeted tests first, then the strongest practical type, lint, build, and
  integration checks for the affected area.

## Mock Integration Rules

All government integrations in the hackathon prototype are mocks.

- Name mock adapters, data, configuration, and fixtures so their mock status is
  unmistakable.
- Show a persistent, unambiguous mock/non-authoritative label wherever mock data
  is presented to a user or operator.
- Use only synthetic data. Never copy real citizen records, credentials, tokens,
  or production government payloads into fixtures.
- Do not call live government endpoints or imitate a successful authoritative
  transaction.
- Keep mock selection explicit and safe by default; configuration errors must
  not silently switch adapter type.
- Model dependency failures, timeouts, unavailable data, and unverifiable
  responses. A convenient happy-path mock must not erase uncertainty.
- Mock responses may exercise contracts but must never serve as evidence for a
  government policy.

## AI Boundaries

AI is optional presentation assistance outside the authoritative decision
boundary. It may be introduced only in the explicitly authorized Safe AI
Gateway phase.

Allowed uses are limited to:

- simplifying an approved deterministic explanation;
- translating an approved deterministic explanation; and
- summarizing an approved deterministic result.

AI must never determine or alter eligibility, identity or KYC, monetary amounts
or limits, policy, approval or rejection, prerequisites, authoritative actions,
or claim outcomes. It must never invent actions, rules, amounts, eligibility
conditions, URLs, or outcomes.

The deterministic result and approved explanation must exist before an AI call.
AI output must remain labeled non-authoritative, traceable to its source result,
and structurally unable to feed back into decision logic. Timeouts, invalid
output, refusal, gateway removal, or complete runtime AI disablement must leave
the government result unchanged; the system should fall back to the approved
deterministic wording.
