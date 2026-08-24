# ClaimSaathi Frontend

Phases 7A through 7F provide a mobile-first Next.js App Router application at
`frontend/`. It asks citizens for their PF goal, loads the three synthetic
personas from FastAPI, creates a real journey instance, supports explicit
deterministic journey evaluation, and provides Priya's backend-driven recovery
flow for a missing previous-employment Date of Exit.

Phase 7D adds a separate judge/reviewer-facing System Explorer at
`/how-it-works`. It keeps technical architecture out of the citizen home flow
while making the intent mapping, deterministic rules, prerequisite graph,
immutable decision record, resolution/reverification boundary, uncertainty
states, and no-AI decision boundary inspectable in one product-native scroll
narrative.

Phase 7F hardens the existing flows without changing their semantics. It adds
consistent status visuals and retry behavior, environment-aware demo-service
errors, a frontend-only expired-journey restart path, application not-found and
error boundaries, request deduplication for concurrent source metadata, result
focus management, responsive regression coverage, and submission metadata.

Phase 8 adds two secondary controls after an immutable decision exists:
“Explain simply” and “हिंदी में समझाएँ”. They call the stored-decision
explanation endpoint only on an explicit button press. The canonical result,
policy-review safe stop, prerequisites, resolution navigator, official process,
sources, and audit metadata remain primary and visible while the optional
request is pending or fails.

Phase 8.5 adds a compact header accessibility menu, 100–200% root text scaling,
a persistent high-contrast preference, and complete deterministic English/Hindi
catalogues through `next-intl`. Locale changes preserve the current route and
perform no API action. A Serwist production worker precaches static assets and
the home, System Explorer, and offline shells while keeping every API request,
mutation, and dynamic journey navigation NetworkOnly. Details and safety tests
are in `docs/ACCESSIBILITY_AND_LOW_BANDWIDTH.md`.

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
- The header's secondary “How it works” link opens the System Explorer without
  competing with the primary citizen journey.
- Live explorer examples explicitly create and evaluate a fresh isolated demo
  journey, then call the read-only decision trace endpoint. No scenario runs
  automatically.
- Pipeline stages, rule results, graph structure, versions, source identifiers,
  and no-AI audit values are rendered from typed backend trace data.
- The Priya recovery diagram is visibly labeled as architecture, separate from
  the current live trace; it never invents a second decision record.
- The Arjun example preserves `POLICY_REVIEW_REQUIRED` and states that no AI
  fallback, numeric waiting period, or government outcome is supplied.
- Explanation controls do not exist before a decision record exists and never
  run on page load. Duplicate requests are disabled while one is pending.
- A real provider result is labeled “AI-assisted explanation” and states that
  AI did not determine the result. Deterministic fallback is labeled
  “Plain-language explanation” and is not presented as AI assistance.
- Explanation transport failures preserve the entire deterministic result and
  expose a scoped retry. They are not mapped to `UNABLE_TO_VERIFY`.
- The citizen decision renderer treats `POLICY_REVIEW_REQUIRED` as a dedicated
  valid safe-stop state based on backend state alone. It is not a persona check,
  error, rejection, eligibility result, or resolution opportunity.
- For that state, an identified official process is displayed separately from
  readiness. The process source supports only the backend-provided process
  label, while any rule evidence remains a distinct provenance section.
- Accessibility preferences are presentation-only local browser state. Text
  uses fixed 100/125/150/175/200% root steps without transforms, and status
  meaning remains textual at every scale and contrast setting.
- `next-intl` receives only the two committed catalogues. Stable backend enums,
  IDs, versions, and Form 31/13/19 values are never translated or sent to a
  translation service.
- Language switching is in-place: it creates no journey, evaluates no journey,
  starts no resolution, and calls no explanation provider.
- Serwist never caches an API response or `/journey/*` document. Every non-GET
  request is NetworkOnly and background sync is absent.
- Offline infrastructure state is separate from citizen state. A loaded result
  is labeled previously loaded, new actions require a connection, and no
  connectivity failure is presented as `UNABLE_TO_VERIFY`.

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

## System Explorer

The `/how-it-works` route contains:

1. the citizen product thesis and a safely scoped form-first comparison;
2. a compact before/ClaimSaathi transformation;
3. the technical architecture and reviewed-config boundaries;
4. an interactive Ravi, Priya, and Arjun live execution trace;
5. Priya's conceptual recovery/re-evaluation architecture and Arjun's safe stop;
6. plain-language uncertainty states; and
7. the deterministic decision path separated from the optional one-way
   `DecisionRecord → Canonical explanation → Sanitizer → Optional AI` path,
   with “NO PATH BACK TO DECISION” shown explicitly.

Scenario and stage controls are real buttons with visible focus and accessible
selected state. The stage pipeline and connected prerequisite tree reflow from
horizontal/branched desktop layouts to vertical nested mobile layouts without
requiring hover or horizontal scrolling. State is always communicated with
text and an icon as well as visual treatment.

## Arjun policy-review flow

Before evaluation, Arjun's page shows only the citizen goal, “Not checked yet,”
and the explicit “Check my journey” action. It deliberately withholds Form 19
and policy-review details until the citizen runs the backend evaluation.

When the stored result is `POLICY_REVIEW_REQUIRED`, the generic state-driven
renderer explains that ClaimSaathi identified the final-settlement journey but
stopped because the reviewed policy basis cannot support a safe automated
determination. It shows that no waiting period, AI fallback, eligibility, or
government outcome was invented. Form 19 appears only as an identified process,
with an explicit statement that process identification is not readiness.

No resolution-start or government-process action is offered because the
backend decision contains no reviewed resolution. The citizen can inspect the
System Explorer or start another journey. Refresh reconstructs the result using
the existing journey, decision-detail, history, and source GETs and performs no
evaluation or mutation.

## Submission hardening and accessibility

- Every POST action disables only its relevant controls while pending and keeps
  the last confirmed backend decision or resolution visible on failure.
- Result and resolution changes use text plus an icon and visual treatment;
  major explicit changes move focus to the new result or state heading.
- Async loading, command results, and errors use status or alert semantics.
- Buttons, links styled as controls, expandable summaries, intent cards, and
  trace stages provide visible keyboard focus and approximately 44px targets.
- Source links have descriptive accessible names and accept only validated
  HTTP(S) URLs returned through backend source metadata.
- The horizontal trace and graph become vertical at narrow widths. Browser
  regressions cover 320, 375, 390, and 430px mobile widths and 1280 and 1440px
  desktop widths without page-level horizontal overflow.
- Reduced-motion preferences disable nonessential transitions and animation;
  no meaning depends on motion or color.
- An unknown backend journey is presented as an expired in-memory demo with a
  “Start a new journey” link. It is never converted into a policy state.
- An unmatched Next.js route uses the separate “Page not found” experience;
  unexpected render failures use a small retryable error boundary without
  exposing stack traces.
- The home page distinguishes demo-service unavailability from citizen-policy
  uncertainty. Development copy explains how to start the local backend, while
  production copy remains environment-neutral.

## Checks

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run test:e2e:pwa
```

Playwright starts the real FastAPI and Next.js development servers, creates a
fresh isolated synthetic journey per persona test, and never mocks the backend.
Its Chromium suite covers Ravi, Priya, Arjun, the System Explorer, GET-only
refresh behavior, responsive overflow, page-level not-found recovery, and
expired in-memory journeys. Install the local browser once with
`npx playwright install chromium`. Failure traces and screenshots are written
under ignored `test-results/` paths.

`test:e2e:pwa` uses the production build because service-worker registration is
deliberately disabled in development. It writes artifacts under the ignored
`test-results-pwa/` path.
