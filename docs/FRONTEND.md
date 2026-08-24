# ClaimSaathi Frontend

Phases 7A, 7B, and 7C provide a mobile-first Next.js App Router application at
`frontend/`. It asks citizens for their PF goal, loads the three synthetic
personas from FastAPI, creates a real journey instance, supports explicit
deterministic journey evaluation, and provides Priya's backend-driven recovery
flow for a missing previous-employment Date of Exit.

## Run locally

Start the backend:

```bash
cd backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Boundaries

- `NEXT_PUBLIC_API_BASE_URL` is read only by the central API configuration.
- Persona IDs come from `/api/v1/demo/personas`; expected demo bindings are
  exact and fail safely when the backend contract drifts.
- React performs basic input validation but contains no eligibility or policy
  calculations.
- Creating or refreshing a journey does not evaluate it. Evaluation is a
  separate explicit button action.
- Decision, prerequisite, process, source, and audit values come from the
  backend API. Official form terminology is hidden until a decision exists.
- A refresh retrieves the latest decision detail without creating another
  decision record.
- A refresh also lists existing resolution instances and restores the latest
  backend resolution state without starting, confirming, rechecking, simulating,
  or re-evaluating anything.
- Resolution start commands use the exact issue-to-resolution link in backend
  decision detail. The browser never accepts an arbitrary workflow identifier.
- Approved steps, conditional guidance, official routes, resolution states, and
  source identifiers are rendered from FastAPI responses without rewriting or
  interpreting them.
- The `DEMO ONLY` correction control calls one allowlisted synthetic event. It
  remains visually separate from citizen and official actions and always states
  that no EPFO system is contacted.
- `RESOLVED` means only that the backend verifier found the blocker corrected.
  A separate explicit journey evaluation is required before the UI can render
  `PASS` and reveal Form 13.
- Immutable decision history is read from the backend; earlier decisions are
  never patched in React.
- No frontend action contacts EPFO or submits a claim.
- Demo and synthetic status remains visible in the shared application shell.

## Priya resolution flow

```text
explicit journey check
  → ACTION_REQUIRED / EXIT_DATE_MISSING / RES_EXIT
explicit Start resolution
  → CITIZEN_ACTION_REQUIRED with approved steps and source
explicit external-step confirmation
  → WAITING_FOR_UPDATE
explicit recheck
  → STILL_BLOCKED
explicit DEMO ONLY synthetic event
explicit external-step confirmation
  → WAITING_FOR_UPDATE
explicit recheck
  → RESOLVED
explicit Check journey again
  → new PASS decision / Form 13
```

`GET /api/v1/journeys/{journey_id}/resolutions` was added because the prior
read-by-ID contract could not rediscover an active resolution after browser
state was lost. The endpoint is read-only and returns existing instances in
creation order; it does not change resolution or journey semantics.

## Checks

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
```
