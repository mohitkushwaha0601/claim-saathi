# ClaimSaathi

## Problem

EPFO citizen journeys can be difficult to navigate because a citizen's goal may map to a specific government process with prerequisites, blockers, and resolution steps that are not easy to identify or understand.

## Solution

ClaimSaathi maps a citizen's intent to the appropriate EPFO process, checks prerequisites through deterministic and source-backed policy rules, explains blockers, and guides resolution while preserving uncertainty instead of guessing.

## Current Development Status

Phases 1–7 are complete. The repository includes the deterministic domain,
reviewed policy engine, prerequisite graphs, resolution navigator, immutable
decisions, synthetic FastAPI demo API, citizen journeys, System Explorer, and
real-browser regression coverage. It has no live government integration,
authentication, persistence, or runtime AI.

## Local quick start

Terminal 1:

```bash
cd backend
uv run uvicorn app.main:app --reload
```

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

- Product: `http://localhost:3000`
- API docs: `http://localhost:8000/docs`

Run the real-browser regression suite from `frontend/` with:

```bash
npx playwright install chromium
npm run test:e2e
```
