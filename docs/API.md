# ClaimSaathi Demo API

Phase 6 exposes the deterministic ClaimSaathi domain engine through a synthetic
hackathon API. It does not connect to EPFO, modify government records, submit
claims, persist data, or use AI.

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
CLAIMSAATHI_ENV=development
CLAIMSAATHI_ALLOWED_ORIGINS=http://localhost:3000
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
| POST | `/api/v1/journeys/{journey_id}/resolutions` | Start the approved resolution attached to a current issue |
| POST | `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}/confirm-external-step-started` | Move an approved citizen-action workflow to its waiting state |
| POST | `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}/recheck` | Verify the workflow against current trusted synthetic facts |
| GET | `/api/v1/journeys/{journey_id}/resolutions/{resolution_id}` | Read current resolution state and approved guidance |
| POST | `/api/v1/demo/journeys/{journey_id}/events/previous-exit-date-updated` | Apply the single Priya-only synthetic correction event |
| GET | `/api/v1/policy/sources/{source_id}` | Read reviewed source metadata without fetching the URL |

The `{resolution_id}` path segment above is the generated resolution instance
ID. Clients cannot select a workflow ID such as `RES_EXIT`; the server derives
that mapping from the specified deterministic issue.

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
POST /api/v1/demo/journeys/{id}/events/previous-exit-date-updated
     → synthetic journey-local fact update only
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
