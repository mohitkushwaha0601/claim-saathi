# ClaimSaathi Repository Instructions

These instructions apply to every file and task in this repository. ClaimSaathi
is government-service software: correctness, traceability, and honest
uncertainty take priority over convenience or persuasive presentation.

## Before Making Changes

- Read this file, `ENGINEERING.md`, and the relevant implementation and tests.
- Keep work within the phase explicitly authorized by the user. Do not begin a
  later phase merely because its scaffold or plan exists.
- Inspect the working tree before substantial changes and preserve unrelated
  user work.
- Prefer the smallest coherent change that follows the existing architecture.
- Do not invent EPFO processes, rules, eligibility criteria, monetary values,
  limits, URLs, document requirements, or outcomes.

## Non-Negotiable Government Safety Rules

- Government decisions must be deterministic, source-backed, versioned,
  reproducible, and auditable.
- Never use AI to determine eligibility, identity or KYC status, monetary
  amounts or limits, government policy, approval or rejection, or any
  authoritative government action.
- Treat valid uncertainty as a supported result. Return `UNABLE_TO_VERIFY` when
  required facts cannot be verified and `POLICY_REVIEW_REQUIRED` when policy is
  missing, ambiguous, conflicting, stale, or not safely applicable. Never
  guess.
- Never silently resolve conflicting government sources. Preserve the conflict,
  cite the sources, and require policy review.
- Removing every runtime AI capability must never change a government decision,
  reason code, prerequisite result, amount, action, or outcome.
- Any AI capability added in a future authorized phase may only simplify,
  translate, or summarize an already approved deterministic explanation or
  result. Its output is non-authoritative and must not add facts, rules,
  actions, amounts, URLs, eligibility conditions, or claim outcomes.
- Treat all government integrations in the hackathon prototype as mocks and
  label them clearly in code, configuration, fixtures, tests, logs, and user
  interfaces. Never present mock data or behavior as a live government action.

## Architecture Boundaries

- Use `backend/` for the Python service and reserve the top-level `frontend/`
  directory for the explicitly authorized frontend phase. Keep reviewed
  `policies/`, `journeys/`, `resolutions/`, and `fixtures/` at repository root.
- Keep business and government decision logic out of frontend components and
  FastAPI route handlers.
- Route handlers and UI components may validate transport/UI concerns and call
  application services; they must not decide policy outcomes.
- Store policies as versioned configuration or data evaluated by a deterministic
  policy engine. Do not scatter policy conditions through application code.
- Keep domain, policy evaluation, orchestration, integration adapters, API, and
  presentation concerns separated. Dependencies should point toward the domain
  and deterministic application logic, not toward frameworks.
- Isolate external integrations behind explicit interfaces. Production-like and
  mock adapters must be distinguishable and must not be selected implicitly.
- Preserve provenance through the journey so a decision record can identify the
  inputs, policy versions, sources, reason codes, and uncertainty states used.

## Policy and Source Discipline

- A policy change must identify its stable rule identifier, version, source,
  source publication or effective date when available, and applicability.
- Released policy versions are immutable. Corrections create a new version and
  retain prior versions for reproduction and audit.
- Do not activate a policy whose source or applicability cannot be verified.
  Use an explicit uncertainty state instead.
- Do not infer a policy from examples, mock fixtures, AI output, or frontend
  copy.
- Keep approved explanatory text linked to the deterministic result and source;
  explanatory wording must not broaden or alter the underlying rule.

## Implementation and Testing Rules

- Target Python 3.12+, FastAPI, Pydantic v2, and pytest for the backend; target
  Next.js, TypeScript, and Tailwind for the frontend when those phases are
  explicitly authorized.
- Add tests for every meaningful behavior change. Prefer behavioral tests over
  implementation-detail tests.
- Deterministic decision tests must cover normal results, boundary conditions,
  missing or unverifiable facts, policy conflicts, unsupported policy versions,
  malformed inputs, dependency failures, and reproducibility.
- Use fixed clocks and controlled inputs wherever time could influence a result.
- AI-related tests must prove that deterministic results are produced before AI
  is called, AI failure leaves those results unchanged, and AI output cannot
  enter a decision path.
- Mock integration tests must assert visible mock labeling and must never require
  live government credentials or endpoints.
- Run the strongest practical targeted checks after changes, inspect the final
  diff, and state exactly what was and was not verified.

## Security and Data Handling

- Minimize collection and retention of identity, KYC, claim, financial, and
  other sensitive citizen data.
- Never commit secrets, credentials, real citizen data, or production government
  responses. Fixtures must be synthetic and visibly non-production.
- Validate untrusted input at system boundaries and apply additional review to
  authentication, authorization, filesystem, database, network, subprocess,
  and serialization changes.
- Logs and decision records must support audit without exposing unnecessary
  sensitive data.

## Change Control

- Update documentation and tests alongside architecture, policy-schema, or
  behavior changes.
- Do not commit, push, deploy, contact external services, or perform destructive
  Git operations unless explicitly authorized.
- If source evidence, requirements, or authorization are insufficient, stop and
  report the uncertainty rather than filling the gap with an assumption.
