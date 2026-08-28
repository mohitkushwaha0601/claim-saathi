# ClaimSaathi Architecture Audit

Audit date: 2026-08-28  
Scope: Phase 0 of the v1 frontend redesign brief

## 1. System purpose and boundaries

ClaimSaathi is an independent PF-journey prototype. It maps a citizen's stated
goal to a reviewed journey definition, evaluates synthetic facts through a
deterministic backend, records the result, and presents approved guidance.

The prototype does not submit claims, modify EPFO records, authenticate a
citizen, or connect to a live government system. All government-shaped data is
synthetic and must remain visibly marked as demo data.

The authoritative boundary includes intent-to-journey mapping, prerequisites,
eligibility-like results, amounts and limits, policy interpretation, approved
actions, and government outcomes. These remain in the deterministic backend and
versioned reviewed artifacts. The frontend is a presentation adapter and must
not calculate or infer any of them.

## 2. Current architecture

### Backend

The Python 3.12+ FastAPI service is composed in `backend/app/main.py` and
`backend/app/api/dependencies.py`.

Dependencies point inward through these layers:

- `backend/app/domain/` contains framework-independent contracts, enums,
  decisions, citizen state, journeys, prerequisites, policies, and resolutions.
- `backend/app/policies/` loads and evaluates versioned policy data using a
  closed deterministic operator/evaluator vocabulary.
- `backend/app/prerequisites/` loads and evaluates prerequisite graphs with
  explicit uncertainty propagation.
- `backend/app/journeys/` binds citizen goals to reviewed journey definitions,
  policy versions, graph versions, and resolution IDs, then orchestrates
  evaluation and immutable decision records.
- `backend/app/resolutions/` navigates approved blocker-resolution workflows
  and verifies only allowlisted synthetic corrections.
- `backend/app/application/` provides use-case services for journeys, traces,
  policy sources, resolutions, explanations, and demo state.
- `backend/app/infrastructure/` provides process-local storage, synthetic
  citizen state, synthetic capability providers, and the optional isolated
  explanation adapter.
- `backend/app/api/` contains thin FastAPI routes, schemas, dependency access,
  and safe error envelopes. Routes do not contain policy decisions.

The runtime store is process-local and in-memory. Restarting the backend resets
demo journeys, decisions, and resolution instances.

### Reviewed and synthetic data

Reviewed system artifacts remain outside implementation packages:

- `policies/epfo/`: policy versions and source metadata.
- `journeys/epfo/`: the active journey catalog and prerequisite graphs.
- `resolutions/epfo/`: source-backed resolution workflows.
- `fixtures/demo/`: synthetic persona state only.

The active catalog currently supports three deterministic journeys:

| Citizen goal | Journey | Current result path |
| --- | --- | --- |
| Access some PF funds | Partial withdrawal | Ravi synthetic PASS path |
| Transfer PF after employment change | Transfer | Priya synthetic resolution path |
| Final PF settlement | Final settlement | Arjun policy-review safe stop |

Adding a government-shaped journey requires a new reviewed policy/source
binding, graph, deterministic service path, provenance, fixtures, and tests. A
frontend card alone does not create support for that service.

## 3. Current frontend architecture

The frontend is a Next.js 16 App Router application under `frontend/`, using
React 19, TypeScript, Tailwind CSS, `next-intl`, Vitest, and Playwright.

### Routes

| Route | Responsibility |
| --- | --- |
| `/` | Intent-first home, persona discovery, journey creation, error/offline states |
| `/how-it-works` | Reviewer-facing System Explorer and live stored-decision trace |
| `/journey/[journeyInstanceId]` | Existing journey loading, explicit evaluation, decision, resolution, source, and explanation presentation |
| `/services/[slug]` | Supported journey-family entry pages; unsupported lookups use an informational state |
| `/offline` | Static offline shell |
| `/manifest.webmanifest` | PWA metadata |
| application error/not-found routes | Safe product-level recovery without technical details |

The root layout supplies the shared header, demo boundary, connectivity notice,
providers, footer, metadata, and global styles.

### Component and data flow

Reusable presentation components are in `frontend/src/components/`. Important
existing groups include:

- shell: `AppHeader`, `AppFooter`, `PageContainer`, `DemoBoundaryBar`,
  `ConnectivityNotice`;
- state and safety: `StatusBadge`, `ErrorState`, `LoadingState`,
  `SafetyNotice`, `DemoBadge`, `PolicyReviewRequiredExperience`;
- journeys: `JourneyExperience`, `JourneyFamilyExperience`,
  `JourneyDecision`, `JourneyIssues`, `PrerequisiteList`,
  `ResolutionNavigator`, `DecisionHistory`;
- provenance and audit: `PolicySources`, `DecisionAuditSummary`,
  `LiveExecutionTrace`, `TraceStageDetail`, `PrerequisiteTraceTree`;
- accessibility: `AccessibilityToolbar` and `AppProviders`.

Typed API adapters in `frontend/src/lib/api/` are the only frontend transport
boundary. They use the shared client and contract guard, then expose typed
demo, journey, trace, resolution, policy, and explanation operations. The
frontend does not accept arbitrary workflow IDs, policy outcomes, or citizen
state from UI code.

The normal journey flow is:

```text
demo personas
  -> explicit intent and synthetic input
  -> POST journey creation
  -> explicit POST evaluation
  -> stored backend decision
  -> read-only detail/history/source/trace requests
  -> explicit approved resolution actions, if present
  -> optional stored-decision explanation
```

Refreshes restore existing backend state through GET requests. They do not
silently evaluate, start a resolution, apply a correction, or call AI.

## 4. Accessibility, language, and resilience

The existing presentation layer already provides:

- English and Hindi committed message catalogs under `frontend/messages/`;
- a local preference provider using `next-intl`;
- 100%, 125%, 150%, 175%, and 200% root text scaling;
- persistent high-contrast preference;
- visible keyboard focus styles and semantic status/alert announcements;
- online/offline and Save-Data awareness;
- a Serwist worker that caches static shells only and keeps API and dynamic
  journey operations network-only;
- responsive trace and prerequisite layouts with no dependency on hover;
- not-found, expired in-memory journey, and retryable infrastructure states.

Accessibility preferences are presentation-only. They cannot alter a backend
decision or trigger an API mutation.

## 5. Reusable functionality to preserve

The redesign should retain, adapt, or extract rather than replace:

- the typed API client and safe demo metadata guard;
- deterministic backend-bound intent binding;
- explicit create-versus-evaluate semantics;
- immutable decision history and read-only refresh recovery;
- `UNABLE_TO_VERIFY` and `POLICY_REVIEW_REQUIRED` as valid displayed states;
- backend-provided policy/source provenance and approved resolution guidance;
- the separate System Explorer;
- the demo-only synthetic correction boundary;
- shared loading, error, offline, not-found, and expired-journey behavior;
- existing accessibility and language preference behavior;
- component, API-boundary, backend, and real-backend E2E regression coverage.

## 6. Gaps and risks against the v1 brief

The brief describes a broader service hub than the current reviewed backend.
These are gaps, not assumptions to fill in through frontend copy:

- There is no central service registry with the full requested service set.
- The backend catalog has three active journey goals, not balance/passbook,
  KYC, UAN, claim tracking, employer, or pensioner decision contracts.
- `/services/[slug]` currently exposes the existing journey-family entries and
  informational unsupported states; it is not a general service implementation.
- There are no `/employee`, `/employer`, or `/pensioner` routes yet.
- The current catalogs are `messages/en.json` and `messages/hi.json`, not the
  proposed `locales/` directory. A migration must avoid breaking `next-intl`
  loading or reviewed translations.
- `ARCHITECTURE.md` was missing before this audit.
- The brief's UAN and official-handoff details require current, reviewed source
  evidence before they can be presented as factual guidance.
- Balance, KYC, claim-status, employer, and pensioner data must be explicitly
  synthetic unless their backend contracts and source provenance are added.
- Any service that needs policy outcomes must be implemented in the backend
  first; it must not be simulated by component conditions.

## 7. Recommended v1 target architecture

The target should preserve the current inward dependency direction:

```text
Next.js routes and components
        |
typed frontend API adapters + presentation registry
        |
FastAPI transport adapters
        |
application services
        |
domain + deterministic policy/prerequisite/journey logic
        |
versioned reviewed artifacts and explicit synthetic adapters
```

Recommended frontend organization:

- `src/components/ui/`: reusable visual primitives and state components;
- `src/components/shell/`: header, footer, navigation, demo boundary,
  connectivity, and accessibility controls;
- `src/components/services/`: service discovery, search, role cards, and
  service details;
- `src/components/journeys/`: shared journey framing and backend result
  renderers;
- `src/lib/service-registry/`: typed discovery metadata and deterministic
  matching only;
- `src/lib/api/`: unchanged single transport boundary, expanded only with
  reviewed contracts;
- `src/lib/presentation/`: labels, grouping, and display formatting that do
  not calculate government outcomes;
- `messages/`: existing reviewed locale catalogs unless a deliberate,
  separately verified catalog migration is authorized.

Recommended backend additions, only when separately authorized and source
evidence exists:

- reviewed service/journey definitions for each supported government-shaped
  workflow;
- application services for new read-only synthetic snapshots;
- deterministic policy/graph contracts where a result is required;
- explicit mock adapters and response metadata;
- provenance and immutable decision coverage matching existing journeys.

## 8. Migration strategy and phase gates

Implementation should proceed one phase at a time:

1. **Phase 0 — Audit (complete):** preserve this document as the baseline and
   maintain a route/component/API gap matrix.
2. **Phase 1 — Design system:** extract primitives without changing decision
   semantics or removing existing safety states.
3. **Phase 2 — Homepage:** introduce intent-oriented discovery while retaining
   current persona loading, journey creation, and offline behavior.
4. **Phase 3 — Registry/search:** start with the three reviewed journey goals;
   add informational entries only when their synthetic/non-authoritative status
   is explicit.
5. **Phase 4 — Employee hub:** compose existing journeys and synthetic account
   summaries without frontend policy logic.
6. **Phase 5 — Flagship journeys:** implement new journeys in backend-first
   slices, each with source evidence, contracts, fixtures, tests, and UI.
7. **Phase 6 — UAN:** source-review gate before any process-specific copy or
   official URL is added.
8. **Phase 7 — Employer/pensioner:** begin with clearly synthetic,
   non-authoritative views and add backend capabilities only through reviewed
   contracts.
9. **Phases 8–11 — Modes, accessibility, language, personas, and states:**
   extend existing infrastructure rather than replacing it.
10. **Phases 12–13 — Responsive, performance, verification, and polish:** run
    the full quality gates only after functional scope is stable.

Each phase is complete only after its targeted tests, type/lint/build checks,
relevant browser checks, visual inspection, and documented limitations pass.
No later phase should begin automatically.

## 9. Phase 0 audit outcome

Phase 0 establishes that the existing architecture is reusable and suitable
for incremental v1 work. The safest next implementation phase is the shared
design-system extraction, with the following constraints:

- do not rewrite the application;
- do not add unsupported EPFO rules or official process claims;
- do not move policy or decision logic into React;
- do not remove visible demo, uncertainty, provenance, or no-AI boundaries;
- keep the application runnable after the phase;
- add behavioral tests for every changed component contract.
