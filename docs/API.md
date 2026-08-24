# ClaimSaathi Demo API

Phase 6 exposes the deterministic ClaimSaathi domain engine through a synthetic
hackathon API. Phase 8 adds an optional, downstream explanation endpoint for
stored decisions. The API does not connect to EPFO, modify government records,
submit claims, or persist data, and AI never participates in a decision.

## Run locally

```bash
cd backend
uv run uvicorn app.main:app --reload
```

- OpenAPI UI: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`
- API prefix: `/api/v1`

Run the backend suite from the same directory:

```bash
uv run pytest -q
```

Optional settings:

```text
APP_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
AI_ENABLED=false
AI_MODEL=gpt-5.6-luna
AI_TIMEOUT_SECONDS=5
OPENAI_API_KEY=
```

Allowed origins are comma-separated. Wildcard origins are rejected, and CORS
credentials are disabled because this prototype has no authentication.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Check the local API process only |
| GET | `/api/v1/demo/personas` | List exactly three safe synthetic persona summaries |
| POST | `/api/v1/journeys` | Create an isolated in-memory demo journey |
| GET | `/api/v1/journeys/{journey_id}` | Read current journey metadata without evaluation |
| POST | `/api/v1/journeys/{journey_id}/evaluate` | Create a new full deterministic evaluation and decision record |
| GET | `/api/v1/journeys/{journey_id}/decisions` | List ordered immutable decision summaries |
| GET | `/api/v1/journeys/{journey_id}/decisions/{decision_id}` | Inspect safe rules, prerequisites, sources, and the no-AI audit flag |
| POST | `/api/v1/journeys/{journey_id}/decisions/{decision_id}/explanations` | Optionally simplify or translate one stored immutable decision |
| GET | `/api/v1/journeys/{journey_id}/decisions/{decision_id}/trace` | Describe a stored deterministic decision without re-running it |
| POST | `/api/v1/journeys/{journey_id}/resolutions` | Start the approved resolution attached to a current issue |
| GET | `/api/v1/journeys/{journey_id}/resolutions` | List existing resolution instances for read-only refresh recovery |
| POST | `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}/confirm-external-step-started` | Move an approved citizen-action workflow to its waiting state |
| POST | `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}/recheck` | Verify the workflow against current trusted synthetic facts |
| GET | `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}` | Read current resolution state and approved guidance |
| POST | `/api/v1/demo/journeys/{journey_id}/events/previous-exit-date-updated` | Apply the single Priya-only synthetic correction event |
| GET | `/api/v1/policy/sources/{source_id}` | Read reviewed source metadata without fetching the URL |

The `{resolution_id}` path segment above is the generated resolution instance
ID. Clients cannot select a workflow ID such as `RES_EXIT`; the server derives
that mapping from the specified deterministic issue.

## Optional stored-decision explanation

The explanation endpoint accepts exactly one of:

```json
{ "mode": "SIMPLE_ENGLISH" }
```

```json
{ "mode": "HINDI" }
```

Extra fields are forbidden. The route verifies the journey, decision, and their
ownership in the process-local store; it never accepts a browser-supplied
decision or citizen state. A successful response contains bounded text fields,
one to four points, and three structural audit flags. It never contains the
model, prompt, provider response, token details, provider error, or API key
status.

When optional AI is disabled, unconfigured, unavailable, timed out, malformed,
or rejected by semantic validation, the same endpoint returns a deterministic
canonical fallback with HTTP 200, `ai_used_for_explanation: false`, and
`fallback_used: true`. `ai_used_for_decision` is always `false`. See
`docs/AI_SAFETY.md` for the exact sanitized input and validator boundary.

An optional real-provider smoke test is deliberately separate from normal
quality gates and requires an explicitly configured local key:

```bash
cd backend
uv run python scripts/smoke_openai_explanation.py
```

It uses a fixed sanitized synthetic input and never prints the key.

## Observational execution trace

The decision trace endpoint is a read-only projection for the judge-facing
System Explorer. It joins an already stored `DecisionRecord` and its immutable
evaluation artifacts with the pinned reviewed journey and graph metadata. It
does not call the planner, policy engine, prerequisite evaluator, resolution
navigator, demo event, or AI, and repeated GET requests create no new records or
state revisions.

`ExecutionTraceResponse` contains:

- the journey instance, decision, typed citizen goal, journey, and applicable
  official-process metadata;
- the stored decision state and citizen-state revision;
- the recorded policy, graph, and journey-definition versions;
- `ai_used_for_decision: false`;
- a closed ordered stage list: `INTENT`, `JOURNEY_PLANNER`, `POLICY_ENGINE`,
  `PREREQUISITE_GRAPH`, and `DECISION_RECORD`; and
- the standard conspicuous synthetic demo metadata.

Stage details are typed rather than arbitrary blobs. Rule summaries are copied
from stored `RuleResult` artifacts and include only rule ID, categorical state,
issue code, and source ID already present in decision provenance. Graph nodes
use reviewed labels and child IDs for structure while taking every state from
the stored graph evaluation. No raw `CitizenState`, observed value, identity
number, bank number, employment date, or monetary fact is returned.

## Demo metadata

Journey, decision, resolution, source, persona, and synthetic-event responses
carry conspicuous demo metadata:

```json
{
  "environment": "DEMO",
  "synthetic_data": true,
  "real_government_action_performed": false
}
```

The correction event also returns `synthetic_event: true`. Restarting the API
resets all journey-local state and history because no database is used.

## State meanings

| Machine state | Display label | Meaning |
|---|---|---|
| `PASS` | Ready to proceed | All prerequisites in the configured ClaimSaathi graph currently pass |
| `ACTION_REQUIRED` | Action required | A deterministic prerequisite requires an approved citizen action |
| `NOT_ELIGIBLE` | Not currently eligible | A known configured eligibility condition is not met |
| `UNABLE_TO_VERIFY` | Unable to verify | Required trusted data or capability input is unavailable |
| `NOT_APPLICABLE` | This journey does not currently apply | A known fact makes this journey inapplicable now |
| `POLICY_REVIEW_REQUIRED` | Policy verification required | ClaimSaathi refuses to automate unresolved policy |

`PASS` means “Ready to proceed” only. It never means a government request was
approved, a payment will occur, or settlement is guaranteed.

## Ravi flow

```text
GET  /api/v1/demo/personas
POST /api/v1/journeys
     RAVI_PARTIAL_READY + ACCESS_SOME_PF_FUNDS + integer amount
POST /api/v1/journeys/{id}/evaluate
     → PASS / Ready to proceed / Form 31 / no issues
```

The response shows `ai_used_for_decision: false` and the synthetic runtime
metadata.

## Priya flow

```text
POST /api/v1/journeys
     PRIYA_TRANSFER_MISSING_EXIT + TRANSFER_PF_AFTER_EMPLOYMENT_CHANGE
POST /api/v1/journeys/{id}/evaluate
     → ACTION_REQUIRED / EXIT_DATE_MISSING / RES_EXIT
POST /api/v1/journeys/{id}/resolutions
     → CITIZEN_ACTION_REQUIRED with approved source-backed steps
POST /api/v1/journeys/{id}/resolutions/{resolution_instance_id}/confirm-external-step-started
     → WAITING_FOR_UPDATE
POST /api/v1/journeys/{id}/resolutions/{resolution_instance_id}/recheck
     → STILL_BLOCKED
POST /api/v1/demo/journeys/{id}/events/previous-exit-date-updated
     → synthetic journey-local fact update only
POST /api/v1/journeys/{id}/resolutions/{resolution_instance_id}/confirm-external-step-started
     → WAITING_FOR_UPDATE
POST /api/v1/journeys/{id}/resolutions/{resolution_instance_id}/recheck
     → RESOLVED
POST /api/v1/journeys/{id}/evaluate
     → new full evaluation and new PASS decision
GET  /api/v1/journeys/{id}/decisions
     → ACTION_REQUIRED, then PASS
```

Resolution success does not edit Priya's first decision and does not itself
make the journey pass. The explicit evaluation reruns all rules and the full
graph. Two Priya journey IDs have independent synthetic states.

## Arjun flow

```text
POST /api/v1/journeys
     ARJUN_FINAL_SETTLEMENT + FINAL_PF_SETTLEMENT
POST /api/v1/journeys/{id}/evaluate
     → POLICY_REVIEW_REQUIRED / Policy verification required / Form 19
```

No numeric waiting period, resolution, or AI fallback is selected.

## Error envelope

Expected errors use:

```json
{
  "error": {
    "code": "REQUEST_VALIDATION_ERROR",
    "message": "The request did not match the public API contract.",
    "request_id": null
  }
}
```

Responses do not include stack traces, Pydantic internals, or local paths.
