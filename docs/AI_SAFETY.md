# ClaimSaathi AI Explanation Safety

## Purpose

Phase 8 adds exactly two optional presentation transforms for an already stored
immutable decision: `SIMPLE_ENGLISH` and `HINDI`. There is no prompt box, chat,
free-form language, client-selected model, or automatic request. AI is never
required to create, inspect, resolve, or continue a citizen journey.

## One-way architecture boundary

```text
Journey Planner
      ↓
Policy Engine
      ↓
Prerequisite Graph
      ↓
JourneyDecision
      ↓
DecisionRecord
      ↓
CanonicalExplanation
      ↓
SanitizedExplanationInput
      ↓
Optional ExplanationProvider
      ↓
ExplanationContent
      ↓
Deterministic semantic validator
      ↓
Validated explanation or deterministic fallback

NO PATH BACK TO JOURNEY DECISIONS OR RESOLUTIONS
```

The explanation service retrieves a decision from the server-side journey
store. The browser supplies only the closed explanation mode. A browser cannot
submit a `DecisionRecord`, `CitizenState`, prompt, messages, instructions,
model, temperature, rule modification, or policy value.

## Canonical explanation

`CanonicalExplanation` is frozen, deterministic, and exists before an optional
provider call. It projects only stored `DecisionRecord` facts and existing
presentation-safe reviewed metadata:

- decision ID, journey and state labels;
- an approved state summary;
- presentation-safe prerequisite and issue summaries;
- an optional generic configured-resolution summary;
- the already identified official-process label;
- fixed safety notes; and
- stored source identifiers.

It does not evaluate rules, graphs, thresholds, eligibility, readiness,
resolution success, or current citizen state.

## Sanitized provider input

The provider receives only an immutable `SanitizedExplanationInput` with these
exact fields:

```text
journey_label
decision_state
state_label
summary
prerequisite_summaries
issue_summaries
resolution_summary
official_process
safety_notes
source_ids
```

The sanitizer is a positive constructor, not a pass-through serializer. It
does not accept or retain a `DecisionRecord`, `CitizenState`, `RuleResult`,
graph, resolution instance, HTTP body, or arbitrary frontend text. Raw citizen
identifiers, Aadhaar/UAN/PAN values, bank accounts, balances, requested amounts,
employment dates, service duration, citizen-state revisions, and hidden
observed values are structurally absent. Even presentation-only Aadhaar and UAN
status labels are omitted from the provider input.

## Provider and structured output

`ExplanationProvider` exposes one operation:

```text
generate(SanitizedExplanationInput, ExplanationMode) -> ExplanationContent
```

`OpenAIExplanationProvider` is isolated under
`app/infrastructure/integrations/`. It uses the official Python SDK's Responses
API and Pydantic-backed Structured Outputs. The request supplies no web search,
file search, code interpreter, function tool, MCP tool, or other model tool.
SDK retries are disabled and the request uses the configured finite timeout.

The strict response schema is:

```text
title       string, 1–80 characters
summary     string, 1–600 characters and at most 3 sentences
points      1–4 strings, each 1–180 characters
disclaimer  string, 1–300 characters
```

Extra fields are forbidden. The UI renders these as text fields and list items,
not HTML or Markdown.

## Low-authority prompt

The fixed provider instruction says to restate supplied facts only; preserve
the decision state and uncertainty; keep official-process meaning unchanged;
and add no eligibility, policy interpretation, requirements, amounts, dates,
percentages, durations, form identifiers, links, resolution actions, approval,
rejection, payment, or guarantee. Hindi mode translates and simplifies the
canonical meaning without reinterpreting it and preserves supplied form IDs.

## Deterministic semantic validation

JSON Schema validation is necessary but not sufficient. A deterministic
post-generation validator rejects:

- new rupee/currency values, percentages, durations, or dates;
- form identifiers not present in sanitized input;
- URLs, HTML, and Markdown links;
- new imperative resolution actions;
- approval, rejection, guarantee, and stronger personal eligibility claims;
- readiness claims when the stored state is not `PASS`; and
- Hindi-mode output containing no Hindi text.

For `POLICY_REVIEW_REQUIRED`, the validator additionally requires the safe stop
to remain explicit and rejects submit-now/readiness claims, invented waiting
periods, eligibility conclusions, and claims that a policy interpretation is
correct. The validator is deliberately conservative and is not an NLP policy
engine. Any doubt selects fallback.

## Fallback and failure behavior

The service returns deterministic `CanonicalExplanation`-based English or
Hindi content when AI is disabled, the API key is absent, the provider raises,
times out, rate-limits, refuses, returns malformed structured data, or fails
semantic validation. Provider failure is not converted into a 500 response or
a citizen-policy state. The response reports:

```json
{
  "ai_used_for_decision": false,
  "ai_used_for_explanation": false,
  "fallback_used": true
}
```

Provider errors, prompts, response objects, token usage, model details, and API
key state are never returned.

## No decision or resolution effect

The explanation service can only read an existing journey-owned decision.
It has no planner, policy engine, graph evaluator, resolution navigator,
citizen-state provider, or mutable store operation. Tests compare the
`JourneyDecision`, `DecisionRecord`, graph evaluation, history count,
citizen-state revision, resolution state, official process, and source
provenance before and after explanation calls.

The deterministic product therefore works unchanged with
`CLAIMSAATHI_AI_ENABLED=false`, an absent `OPENAI_API_KEY`, a removed provider,
or an unavailable model.
