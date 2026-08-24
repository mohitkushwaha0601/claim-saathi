# ClaimSaathi

## Problem

EPFO citizen journeys can be difficult to navigate because a citizen's goal may map to a specific government process with prerequisites, blockers, and resolution steps that are not easy to identify or understand.

## Solution

ClaimSaathi maps a citizen's intent to the appropriate EPFO process, checks prerequisites through deterministic and source-backed policy rules, explains blockers, and guides resolution while preserving uncertainty instead of guessing.

## Current Development Status

Phases 1–6 and frontend Phase 7A are complete: the deterministic domain,
reviewed policy engine, prerequisite graphs, resolution navigator, journey
orchestration, immutable decision records, synthetic FastAPI demo layer, and
intent-first Next.js foundation are implemented and tested. Journey evaluation
and resolution UI, real government integrations, persistence, and runtime AI
have not been implemented.

## Run the Backend

```bash
cd backend
uv run uvicorn app.main:app --reload
```

- API docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

## Run the Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` while the backend is running.
