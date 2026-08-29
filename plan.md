# ClaimSaathi v1 — Implementation Brief

You are working on the existing ClaimSaathi EPFO prototype.

Your task is to evolve the existing v0 into a polished, modern, task-oriented EPFO service hub.

## Critical instruction

DO NOT rewrite the project from scratch.

First inspect the repository and understand the current architecture, routing, components, styling, data models, accessibility implementation, and existing guided journeys.

Preserve reusable v0 functionality wherever possible.

Make changes incrementally and keep the application runnable after every phase.

---

## Product vision

ClaimSaathi should help Employees, Employers, and Pensioners find and understand the correct EPFO service without requiring them to understand EPFO form numbers, internal terminology, or legacy portal navigation.

Core principle:

USER INTENT
→ SERVICE DISCOVERY
→ ROLE / CONTEXT
→ ELIGIBILITY / REQUIREMENTS
→ GUIDED JOURNEY
→ CLEAR NEXT ACTION
→ OFFICIAL EPFO / UMANG HANDOFF
→ STATUS

The product must remain an independent prototype using synthetic data.

Never submit real EPFO transactions.

Never collect or store real Aadhaar, PAN, UAN, bank-account, OTP, or password information.

Government eligibility decisions must remain deterministic and rule-based. Do not use an LLM to determine eligibility.

---

# Phase 0 — Repository audit

Before modifying UI:

1. Inspect the complete repository.
2. Identify framework and build tooling.
3. Inspect routing.
4. Inspect component structure.
5. Inspect CSS/design system.
6. Inspect current data models.
7. Inspect existing guided PF journeys.
8. Inspect accessibility implementation.
9. Identify reusable components.
10. Identify technical debt and risks.

Create:

`ARCHITECTURE.md`

Document:

* current architecture
* reusable components
* current routes
* data architecture
* journey architecture
* accessibility implementation
* recommended v1 architecture
* migration strategy

Do not make large architectural changes until this audit is complete.

---

# Phase 1 — Design system

Create/rework a reusable design system.

Required components:

* Button
* IconButton
* Input
* SearchInput
* Card
* ServiceCard
* RoleCard
* StatusBadge
* StatusTimeline
* StepIndicator
* Alert
* Notice
* Modal
* Drawer
* Tabs
* Breadcrumb
* ProgressBar
* EmptyState
* Skeleton
* Accordion
* PrototypeBoundary
* AccessibilityControls

Visual direction:

Modern government/public-digital-infrastructure aesthetic.

Avoid excessive fintech styling.

Use:

* strong typography
* whitespace
* restrained colors
* subtle borders
* minimal shadows
* consistent radii
* clear hierarchy

Avoid:

* excessive gradients
* glassmorphism
* excessive animation
* decorative backgrounds
* giant illustrations
* carousel-heavy UI
* excessive nested cards

---

# Phase 2 — Homepage

Redesign the homepage around:

## Hero

"What do you need to do?"

Supporting text:

"Find the right EPFO service without having to know the form or process."

Large search input:

"Search for a service"

Example suggestions:

* withdraw PF
* check balance
* update KYC
* track claim
* transfer PF

## Popular services

Include:

* Check PF balance
* View passbook
* Withdraw PF
* Transfer PF
* Update KYC
* Track claim
* Find UAN
* Manage nomination

## Role selector

"I'm an..."

* Employee
* Employer
* Pensioner

## Important updates

Use compact update cards, not a carousel.

## Trust boundary

Keep the existing v0 concept:

"ClaimSaathi is an independent prototype using synthetic data. It does not submit transactions to EPFO."

Make this subtle except at transaction-like actions.

---

# Phase 3 — Service registry and universal search

Create a central service registry.

Each service should contain:

* id
* title
* description
* category
* roles
* keywords
* route
* officialUrl where applicable
* officialServiceName
* requiresLogin
* requirements
* estimatedTime
* availability

Search must support natural phrases.

Examples:

"I need money from PF"
→ Withdraw PF

"old company PF"
→ Transfer PF

"my PF balance"
→ PF Balance & Passbook

"change aadhaar"
→ Update KYC

Do not implement an LLM search system.

Use deterministic matching first.

Provide:

* best match
* related services
* empty states
* role browsing fallback

---

# Phase 4 — Employee experience

Create `/employee`.

Hero:

"Manage your PF"

Quick actions:

* Withdraw PF
* Check balance
* Track claim
* Transfer PF
* Update KYC
* Find UAN

Synthetic account overview:

* UAN
* current employer
* PF balance
* KYC status

Attention-needed section:

Examples:

* incomplete nomination
* incomplete KYC
* pending claim

Service catalogue categories:

Money:

* Withdraw PF
* Transfer PF
* Balance
* Passbook

Profile:

* KYC
* Personal details
* Nomination
* UAN

Claims:

* Submit claim
* Track claim
* Claim history

Employment:

* Current employment
* Previous employers
* Member IDs

---

# Phase 5 — Five flagship journeys

Implement these extremely well.

## 1. PF Balance / Passbook

Route:

`/services/pf-balance`

Flow:

Start
→ account selection
→ balance overview
→ contribution history
→ employer/member ID breakdown
→ passbook view/download demo

Show a clear visual contribution timeline.

---

## 2. Withdraw PF

Route:

`/services/withdraw-pf`

Flow:

What do you want to do?
→ eligibility checks
→ requirements
→ review
→ synthetic claim preview
→ prototype boundary
→ official EPFO handoff

Options:

* Withdraw part of PF
* Withdraw PF
* Withdraw pension
* I'm not sure

Show deterministic synthetic checks:

* UAN
* Aadhaar
* bank
* KYC

Never imply the demo is a real EPFO eligibility decision.

---

## 3. Transfer PF

Route:

`/services/transfer-pf`

Show:

Previous employer
→ transfer
→ Current employer

Flow:

employment selection
→ previous employer
→ prerequisites
→ review
→ transfer preview
→ official handoff

---

## 4. KYC

Route:

`/services/kyc`

Dashboard:

* Aadhaar
* PAN
* Bank
* Nomination

Show verified/incomplete states.

Clicking an incomplete item should explain:

"What you'll need"

before presenting the next action.

---

## 5. Claim tracking

Route:

`/services/claim-status`

Create a strong visual timeline:

Submitted
→ Documents verified
→ Under processing
→ Payment initiated
→ Amount credited

Show:

* claim ID
* submission timestamp
* last update
* current state
* whether user action is required

Example:

"No action required from you right now."

---

# Phase 6 — UAN

Create:

`/services/uan`

Use the current EPFO process.

Do NOT design old-style direct portal UAN activation.

Present:

### I don't have a UAN

Explain current UMANG + Aadhaar Face Authentication flow.

### I have a UAN but haven't activated it

Explain current UMANG-based activation.

### I already have an activated UAN

Provide official member portal handoff.

Keep the implementation informational/synthetic.

---

# Phase 7 — Employer experience

Create `/employer`.

Hero:

"Manage your establishment"

Services:

* Register establishment
* Manage employees
* Manage UAN
* File ECR
* Make contribution
* Update establishment
* Forms & circulars

Synthetic employer dashboard:

* establishment ID
* employee count
* contribution cycle
* ECR status
* pending actions

Do not overload the dashboard.

---

# Phase 8 — Pensioner experience

Create `/pensioner`.

Services:

* Pension status
* PPO details
* Pension payment
* Bank details
* Jeevan Pramaan
* Documents
* Forms
* Support

Use larger typography, simpler navigation, and accessibility-first design.

---

# Phase 9 — Guided mode

Add:

`Quick mode | Guided mode`

Quick mode:

minimal clicks for experienced users.

Guided mode:

progressively ask only relevant questions.

Never present a large form before the user understands what is required.

---

# Phase 10 — Accessibility

Preserve and improve v0's:

* English/Hindi
* A-
* A
* A+
* High contrast

Add:

* reduced motion
* visible focus states
* keyboard navigation
* semantic HTML
* proper labels
* screen-reader support
* scalable spacing/line height

Persist accessibility preferences locally.

Support at least:

* normal
* large
* extra-large

text sizes.

---

# Phase 11 — Internationalization

Create:

`locales/en.json`
`locales/hi.json`

Do not hard-code user-facing strings into components.

English and Hindi must be real translations.

---

# Phase 12 — Demo personas

Create deterministic synthetic personas:

1. Employee — complete KYC
2. Employee — incomplete KYC
3. Employee — pending claim
4. Employee — previous employer
5. Employer
6. Pensioner

Add an unobtrusive demo profile selector.

Example:

"Demo profile: Rahul · Employee"

Changing the persona should change synthetic state and allow different journeys to be demonstrated.

---

# Phase 13 — Error/loading/empty states

Every service must have deliberate:

* loading
* error
* empty
* success
* unavailable
* incomplete information

states.

Never expose raw technical errors to users.

---

# Phase 14 — Responsive design

Mobile-first.

Verify:

375px
390px
768px
1024px
1440px

The mobile layout must be intentionally designed rather than merely compressed.

---

# Phase 15 — Performance

Avoid unnecessary dependencies.

Lazy-load secondary routes.

Optimize assets.

Avoid loading all service data/UI into the initial homepage bundle if unnecessary.

Target:

LCP < 2.5s
CLS < 0.1
INP < 200ms

---

# Phase 16 — Testing

Test:

Service search:

* withdraw PF
* need money
* check balance
* old company
* Aadhaar
* claim status

Journey states:

* complete KYC
* incomplete KYC
* missing bank
* inactive UAN
* pending claim

Accessibility:

* keyboard
* focus order
* screen reader semantics
* contrast
* reduced motion
* 200% zoom

Responsive:

* 375
* 390
* 768
* 1024
* 1440

No console errors.

---

# Phase 17 — Visual polish

Only after functionality is stable.

Review:

* spacing
* typography
* hierarchy
* alignment
* card density
* mobile layout
* animation
* loading states
* empty states
* error states

The site should feel calm, credible, modern and highly usable.

---

# Definition of Done

The v1 implementation is complete when:

1. Users can find a service within seconds.
2. Users do not need to know EPFO form numbers.
3. Employee, Employer and Pensioner journeys are obvious.
4. Five flagship employee journeys are polished.
5. Service search works with natural phrases.
6. Guided and Quick modes work.
7. Accessibility controls work globally.
8. Hindi/English architecture is implemented.
9. Synthetic data is isolated from UI.
10. No real personal information is collected.
11. No real EPFO transactions are submitted.
12. Official handoff is clear.
13. Claim status is visually understandable.
14. Mobile experience is first-class.
15. No console errors remain.
16. Existing v0 functionality is preserved unless intentionally replaced.
17. All major routes have loading, empty, error and success states.

---

## Execution discipline

Work phase-by-phase.

After each phase:

1. Run the application.
2. Run tests.
3. Inspect the changed UI.
4. Fix regressions.
5. Summarize what changed.
6. Identify remaining issues.
7. Only then proceed to the next phase.

Do not implement speculative features.

Do not add an AI chatbot unless explicitly requested later.

Do not replace deterministic service discovery/rules with AI.

Prioritize user journeys over decorative UI.

The goal is not to build "more pages".

The goal is to make EPFO tasks dramatically easier to understand and complete.
