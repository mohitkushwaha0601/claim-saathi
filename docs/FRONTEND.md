# ClaimSaathi Frontend

Phases 7A and 7B provide a mobile-first Next.js App Router application at
`frontend/`. It asks citizens for their PF goal, loads the three synthetic
personas from FastAPI, creates a real journey instance, and supports Ravi's
explicit deterministic journey evaluation. Priya resolution navigation remains
out of scope.

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
- No frontend action contacts EPFO or submits a claim.
- Demo and synthetic status remains visible in the shared application shell.

## Checks

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
```
