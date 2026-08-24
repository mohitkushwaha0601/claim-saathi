# Frontend Foundation

Phase 7A provides a mobile-first Next.js App Router application at `frontend/`.
It asks citizens for their PF goal, loads the three synthetic personas from the
FastAPI demo API, and creates a real journey instance. It deliberately stops
before journey evaluation or resolution navigation.

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
- Creating a journey does not evaluate it, contact EPFO, or submit a claim.
- Demo and synthetic status remains visible in the shared application shell.

## Checks

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
```
