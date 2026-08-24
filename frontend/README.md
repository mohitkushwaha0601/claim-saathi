# ClaimSaathi Frontend

The Phase 7A frontend is a Next.js App Router application that uses the real
synthetic FastAPI demo endpoints. It creates journey instances but deliberately
does not evaluate journeys or implement resolution workflows.

## Run locally

Start the backend from the repository root:

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

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The default local API base URL is defined only in `src/lib/config.ts` and may
be overridden with `NEXT_PUBLIC_API_BASE_URL`.
