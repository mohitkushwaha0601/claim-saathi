# ClaimSaathi — Visual Consolidation, UI Polish & Dark Mode

## Objective

The core ClaimSaathi functionality is now in place.

Do NOT add major product features in this task.

The goal is to make the existing product feel:

* cleaner
* less cluttered
* more visually confident
* less pale
* more modern
* more consistent
* accessible
* polished enough for a serious government/public-digital-infrastructure prototype

Also implement a complete **Light / Dark / System** theme.

Do not rewrite the existing architecture or break existing journeys.

---

# Phase 1 — Homepage simplification

The current homepage contains duplicated concepts:

* new "What do you need to do?"
* Service hub
* Task-first navigation
* Quick entry points
* Choose a task
* How ClaimSaathi works
* Trust and boundary

The homepage should become significantly shorter.

## Final homepage structure

```text
Header
↓
Hero / Service Search
↓
Popular Services
↓
Employee / Employer / Pensioner
↓
Important Updates
↓
Small prototype boundary
↓
Footer
```

Remove duplicate old-v0 sections from `/`.

Do not delete functionality; move useful content to appropriate routes.

---

# Phase 2 — Stronger visual hierarchy

The current UI is too visually flat/pale.

Introduce a stronger visual hierarchy using:

* deep navy primary surfaces
* white content surfaces
* light neutral section backgrounds
* restrained accent color
* stronger typography contrast
* clearer section spacing

Do NOT turn the entire site into a colorful fintech UI.

Target aesthetic:

**modern government + digital public infrastructure + premium simplicity**

Avoid:

* excessive gradients
* glassmorphism
* excessive shadows
* decorative illustrations
* excessive animation
* rainbow-colored cards

---

# Phase 3 — Redesign hero

Make the hero the strongest visual element on the homepage.

Use a dark/navy hero section.

Content:

**EPFO SERVICES**

# What do you need to do?

Find the right EPFO service without having to know the form or process.

Large search field:

`Try "I want to withdraw my PF"`

Below it show compact popular search suggestions:

* Withdraw PF
* Check balance
* Update KYC
* Track claim

The search remains functional.

---

# Phase 4 — Service cards

Redesign Popular Services.

Use proper service cards rather than plain buttons.

At minimum:

* Withdraw PF
* PF Passbook
* Update KYC
* Track Claim
* Transfer PF
* UAN

Each should have:

* icon
* title
* one-line description
* subtle category/role indicator
* arrow/action

Do not make every card visually identical.

Allow the primary services to have slightly stronger hierarchy.

Avoid excessive card nesting.

---

# Phase 5 — Role section

Keep:

**Who are you?**

Cards:

### Employee

Manage PF, claims, KYC and employment records.

### Employer

Manage employees, contributions and establishment services.

### Pensioner

Manage pension, PPO and payment information.

Make these visually strong but simple.

Place them on a contrasting light-neutral section so the page has visual rhythm.

---

# Phase 6 — Move explanatory content

Do not remove these concepts.

Move detailed content to dedicated pages:

`/how-it-works`

`/safety`

The homepage should only contain a compact link/statement such as:

> Guided by reviewed rules. Never guess.

and:

> Independent prototype · Synthetic data · No real EPFO transactions.

Avoid repeating safety explanations throughout the homepage.

---

# Phase 7 — Navigation redesign

Current navigation is too focused on the original v0 structure.

Move toward:

```text
ClaimSaathi

Services
Employees
Employers
Pensioners
Help

                     Search
                     Language
                     Accessibility
```

Keep navigation minimal.

On mobile, use a clean responsive menu.

Do not create a large mega-menu.

---

# Phase 8 — Reduce card overload

Audit the entire homepage.

Use cards only for actual interactive objects:

* services
* roles
* updates
* account/service objects

Do NOT wrap every paragraph or explanatory section in a card.

Use whitespace and typography for hierarchy.

This is important for reducing the current "messy" feeling.

---

# Phase 9 — Typography

Strengthen hierarchy.

Recommended hierarchy:

```text
Hero eyebrow
Hero heading
Hero supporting text

Section eyebrow
Section heading
Section description

Card title
Card description
Metadata
```

Increase contrast between:

* primary text
* secondary text
* metadata

Avoid having too much muted gray text.

Accessibility contrast must remain compliant.

---

# Phase 10 — Color system

Create a centralized design-token system.

Example direction:

```text
Primary / Navy
Deep navy for hero/header/important surfaces

Background
Warm/cool neutral light background

Surface
White

Text
Dark charcoal/navy

Muted text
Medium slate

Accent
Restrained saffron/orange

Success
Accessible green

Warning
Accessible amber

Error
Accessible red

Border
Neutral gray
```

Do not hard-code colors throughout components.

Use semantic tokens such as:

```text
--background
--surface
--surface-muted
--text-primary
--text-secondary
--border
--primary
--accent
--success
--warning
--error
```

---

# Phase 11 — DARK MODE

Implement a complete theme system.

Supported modes:

```text
Light
Dark
System
```

Default:

`System`

Use CSS variables/design tokens so the entire application switches themes consistently.

Do NOT implement dark mode by individually changing random component colors.

---

## Dark mode requirements

Dark mode must cover:

* header
* hero
* navigation
* service cards
* role cards
* buttons
* inputs
* search
* dropdowns
* modals
* drawers
* tables
* passbook
* KYC journey
* status timelines
* alerts
* empty states
* loading states
* footer
* accessibility controls

No white/light surfaces should remain accidentally inside dark mode.

---

## Dark mode palette

Use a true dark neutral/navy system.

Avoid pure black.

Example direction:

```text
Background      #0B1220
Surface         #111A2B
Surface raised  #172236
Border          #273449
Primary text    #F3F6FA
Secondary text  #AAB7C7
Accent          restrained saffron/orange
```

Adjust values as necessary for accessibility.

The dark theme should feel:

**professional / government / technical**

not:

**gaming / neon / hacker**

---

# Phase 12 — Theme switcher

Add a theme control to the existing accessibility/settings area:

```text
Appearance

○ System
○ Light
○ Dark
```

Alternatively use a compact:

`☀ / System / ☾`

control if it fits the existing UI.

The selected theme must persist across page reloads.

Use localStorage or the existing preference mechanism.

Avoid flash of incorrect theme during initial page load.

Respect:

`prefers-color-scheme`

when System is selected.

---

# Phase 13 — Accessibility compatibility

Dark mode must work with existing:

* A− / A / A+
* high contrast
* reduced motion
* comfortable spacing
* English/Hindi

Test combinations such as:

```text
Dark + large text
Dark + high contrast
Dark + reduced motion
Dark + comfortable spacing
```

Do not allow accessibility settings to create unreadable combinations.

---

# Phase 14 — Existing journey polish

Do NOT redesign the journey architecture.

Apply the new design system consistently to:

* Withdraw PF
* Transfer PF
* Claim Tracking
* PF Passbook
* KYC
* UAN

Check:

* buttons
* cards
* step indicators
* status timelines
* forms
* tables
* alerts
* success states
* error states

The journeys should visually feel like one product.

---

# Phase 15 — Mobile polish

Test at:

```text
375px
390px
768px
1024px
1440px
```

Pay particular attention to:

* hero height
* search
* navigation
* service cards
* role cards
* accessibility menu
* theme selector
* tables
* filters
* journey steps

Do not simply shrink desktop layouts.

---

# Phase 16 — Motion

Keep animation subtle.

Use motion for:

* page/step transitions
* hover/focus
* dropdowns
* success states

Avoid decorative animation.

Respect:

`prefers-reduced-motion`

---

# Phase 17 — Final homepage acceptance criteria

The homepage should communicate only:

1. What can I do?
2. Find my service.
3. What are the popular services?
4. Which user type am I?
5. What's important right now?
6. Is this an official government transaction?

Everything else belongs deeper in the product.

The homepage should be approximately 40–50% shorter than the current version.

---

# Phase 18 — Quality check

Before finishing:

### Functional

Verify all existing service links work.

Verify:

* Passbook
* KYC
* Withdraw
* Transfer
* Claims
* UAN
* Employee
* Employer
* Pensioner

### Theme

Verify:

* Light
* Dark
* System
* persistence
* system preference changes

### Accessibility

Verify:

* keyboard navigation
* visible focus
* text scaling
* high contrast
* reduced motion
* dark mode contrast

### Responsive

Verify:

375px
390px
768px
1024px
1440px

### Technical

* no console errors
* no hydration issues
* no broken routes
* no unnecessary dependencies
* no duplicated design-token logic

---

# Execution order

Implement in this order:

1. Audit current homepage/components/design tokens.
2. Create centralized semantic color/theme tokens.
3. Implement Light/Dark/System theme.
4. Consolidate homepage structure.
5. Redesign hero.
6. Redesign service cards.
7. Redesign role section.
8. Simplify navigation.
9. Move detailed explanatory sections to existing routes.
10. Apply visual system to existing journeys.
11. Polish responsive behavior.
12. Test accessibility/theme combinations.
13. Run complete regression check.

Do not add unrelated product features.

Do not rewrite working journey logic.

Prefer modifying/reusing existing components over creating duplicate components.

The goal of this task is:

**fewer elements + stronger hierarchy + better contrast + consistent design + complete dark mode.**
