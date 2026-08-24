# ClaimSaathi

## Problem

EPFO citizen journeys can be difficult to navigate because a citizen's goal may map to a specific government process with prerequisites, blockers, and resolution steps that are not easy to identify or understand.

## Solution

ClaimSaathi maps a citizen's intent to the appropriate EPFO process, checks prerequisites through deterministic and source-backed policy rules, explains blockers, and guides resolution while preserving uncertainty instead of guessing.

## Current Development Status

Phases 1–8 are complete. The repository includes the deterministic domain,
reviewed policy engine, prerequisite graphs, resolution navigator, immutable
decisions, synthetic FastAPI demo API, citizen journeys, System Explorer, and
real-browser regression coverage. Phase 8 adds optional post-decision simple
English and Hindi explanations with deterministic fallback; AI remains disabled
by default and never affects a decision. The product has no live government
integration, authentication, or persistence.

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

Optional backend AI explanation configuration is documented in
`backend/.env.example`. The safe defaults are:

```text
CLAIMSAATHI_AI_ENABLED=false
CLAIMSAATHI_AI_MODEL=gpt-5.6-luna
OPENAI_API_KEY=
```

Run the real-browser regression suite from `frontend/` with:

```bash
npx playwright install chromium
npm run test:e2e
```
