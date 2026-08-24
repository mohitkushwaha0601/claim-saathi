# Accessibility, Hindi, and Low-Bandwidth Boundary

Phase 8.5 adds presentation and delivery resilience only. It does not change a
policy, prerequisite, resolution, `JourneyDecision`, `DecisionRecord`, official
process, or the Phase 8 AI authority boundary.

## Accessibility preferences

The shared header exposes one compact, keyboard-operable accessibility menu.
It contains English/Hindi selection, A−/A/A+ text controls, the current scale,
and a high-contrast toggle. Preferences require no account and are stored only
in browser `localStorage`:

- `claimsaathi.locale`: `en` or `hi`;
- `claimsaathi.textScale`: `100`, `125`, `150`, `175`, or `200`; and
- `claimsaathi.highContrast`: `true` or `false`.

Text resizing changes the root `font-size` through
`html[data-text-scale]`. Components use rem-based Tailwind typography and
reflowing containers; there is no `transform: scale()`, canvas zoom, or scale
below 100%. A− moves down one closed step, A resets to 100%, and A+ moves up one
closed step to 200%.

High contrast changes presentation tokens through
`html[data-contrast="high"]`. It does not change status meaning. Results,
prerequisites, resolution states, offline notices, and trace stages continue to
use text and an icon or explicit control state rather than color alone. The
existing `prefers-reduced-motion` handling remains in effect.

Responsive browser checks cover enlarged text, keyboard access, and horizontal
overflow at 320px, 390px, and desktop widths. This is an accessibility
engineering target, not a claim of formal WCAG certification. Browser zoom is
not disabled, and the document no longer imposes a fixed 320px minimum width,
so 200% browser zoom can reflow below that effective CSS width.

## Deterministic Hindi architecture

[`next-intl`](https://next-intl.dev/) provides App Router-compatible runtime
localization. The canonical reviewed English catalogue is
`frontend/messages/en.json`; the corresponding committed Hindi catalogue is
`frontend/messages/hi.json`. Only `en` and `hi` are accepted.

English is included in the initial client shell. Hindi is a lazy local build
chunk and is loaded only after a stored Hindi preference or an explicit Hindi
selection. Serwist precaches emitted build assets, including that chunk, so a
previously installed production shell can switch or reload in Hindi offline.
There is no translation HTTP endpoint, runtime model, browser-bundled model, or
third-party translation script.

The Hindi catalogue was drafted against each canonical English key and reviewed
in code for state meaning, uncertainty wording, resolution boundaries, and
stable identifiers. Automated tests cover all three persona outcomes and the
closed state enums. Before a production government-service release, a qualified
native Hindi language review remains advisable; Phase 8.5 does not claim legal
translation certification.

[AI4Bharat IndicTrans2](https://github.com/AI4Bharat/IndicTrans2) is an
open-source Hindi/Indic translation system that may assist future catalogue
authoring. Such output must be reviewed and committed before release. It is not
a dependency and never runs in the frontend. LibreTranslate is not used and is
not a dependency.

Stable technical and government identifiers are not translated, including:

- Form 31, Form 13, and Form 19;
- backend enum values such as `PASS`, `ACTION_REQUIRED`, and
  `POLICY_REVIEW_REQUIRED`;
- rule, decision, source, journey, and version identifiers; and
- technical architecture names when translation would make them less clear.

Language switching changes presentation state in place. It preserves the
current URL and journey/decision identifiers and sends no create, evaluate,
resolution, explanation, or other API request. Whole-page Hindi is static
catalogue localization; the separate “Explain simply” and Hindi explanation
buttons remain explicit optional Phase 8 stored-decision operations.

## PWA and cache safety

[`@serwist/next`](https://serwist.pages.dev/docs/next/getting-started) and
`serwist` generate `/sw.js` for production builds. The worker precaches emitted
JS/CSS and static application assets plus `/`, `/how-it-works`, and `/offline`.
Development mode disables registration so normal local iteration is not masked
by an old worker.

The runtime cache boundary is intentionally conservative:

```text
static build assets and named static pages → precache
any non-GET request                    → NetworkOnly
any /api/ request                      → NetworkOnly
any /journey/* navigation              → NetworkOnly
failed document navigation             → /offline shell
```

There is no background sync, mutation queue, replay, cache-first API response,
or dynamic journey response cache. A service-worker test inspects Cache Storage
and rejects API or journey-page entries. Consequently a cached response cannot
silently relabel Ready, Action required, Blocker resolved, or Policy
verification required as current truth.

If connectivity drops while a loaded journey remains on screen, the result is
explicitly labeled “Previously loaded result” with “Connect to refresh this
journey.” A new check, re-check, resolution command, synthetic correction, live
trace, or explanation is stopped before submission and receives an
infrastructure-specific offline message. Connectivity is never converted into
`UNABLE_TO_VERIFY` or another citizen-policy state.

## Low-bandwidth behavior

The normal experience is the low-bandwidth experience; there is no second mode
that can drift from core behavior.

- No hero image, autoplay video, external font, analytics script, animation
  library, chart library, translation model, or runtime ML asset was added.
- Next.js link prefetch is disabled on product navigation to avoid hidden route
  requests, and optional source/AI requests remain explicit.
- The Network Information API is feature-detected. When `saveData` is available
  and true, pending operations disclose that a slow connection may take longer;
  unsupported browsers retain identical core behavior.
- Mutation buttons remain disabled while pending, preventing duplicate POSTs.
- Static home, System Explorer, offline guidance, catalogues, and accessibility
  controls render without a backend call; dynamic persona cards still require
  the explicitly labeled synthetic demo API.

The current production build records approximately 32 KiB of canonical English
catalogue source, 56 KiB of Hindi catalogue source emitted as an approximately
52 KiB lazy build chunk before transfer encoding, and a 36 KiB generated
service worker. These figures record the Phase 8.5 artifacts; no pre-Phase-8.5
production bundle snapshot exists, so an exact historical delta is not claimed.

## Verification

Normal E2E runs in development mode with AI disabled. The additional production
PWA test runs only after `npm run build`:

```bash
cd frontend
npm run test:e2e
npm run test:e2e:pwa
```

It verifies an offline English/Hindi static shell, cached System Explorer,
NetworkOnly mutations, explicit previously-loaded labeling, no queued POST on
reconnect, absence of dynamic journey/API cache entries, and the offline shell
for an uncached journey URL.
