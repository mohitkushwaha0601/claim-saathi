# ClaimSaathi — Implement Interactive PF Passbook & KYC Journeys

Implement the next feature set on the existing ClaimSaathi v1 codebase.

## Goal

Two services currently shown as "Informational preview" must become fully interactive **synthetic/demo journeys**, consistent with the existing Withdraw PF, Transfer PF and Claim Tracking journeys:

1. PF Balance & Passbook
2. Update KYC

First inspect the existing architecture and reuse the current journey engine, demo profiles, synthetic data, state management, UI components, prototype-boundary and official-handoff components. **Do not rewrite existing architecture or break existing journeys.**

---

## 1. PF Balance & Passbook

Route:

`/services/pf-balance`

Turn this into a realistic interactive passbook experience using deterministic synthetic data.

### Flow

```text
Demo account
→ Account overview
→ Date range / filters
→ Transaction summary
→ Transaction history
→ Transaction details
→ Demo export
```

### Account overview

Show synthetic:

* PF balance
* employee contribution
* employer contribution
* interest
* current employer
* member ID
* last contribution

Clearly identify the data as demo/synthetic.

### Filters

Implement functional filters:

* Last 3 months
* Last 6 months
* Current FY
* Previous FY
* Custom date range
* Transaction type
* Employer/member ID where applicable

Transaction types:

* Employee contribution
* Employer contribution
* Interest
* Transfer
* Withdrawal
* Adjustment

Filters must actually change the results.

### Summary

Dynamically calculate:

* opening balance
* contributions
* interest
* withdrawals
* transfers
* closing balance

Keep calculation logic outside UI components and add tests.

### Transaction history

Desktop: table.

Mobile: transaction cards.

Include:

* date
* description
* type
* employee contribution
* employer contribution
* interest
* amount
* balance

Clicking a transaction opens a detail view.

### Export

Add "Download passbook".

This must be clearly labelled:

`DEMO — SYNTHETIC DATA — NOT AN OFFICIAL EPFO PASSBOOK`

If actual PDF generation is unnecessary, provide a clearly labelled demo-export interaction.

### Empty state

If filters return nothing:

> No transactions match your filters.

Provide `Clear filters`.

---

# 2. Update KYC

Route:

`/services/kyc`

Turn this into a complete synthetic KYC workflow.

### Flow

```text
KYC overview
→ Select document
→ Requirements
→ Process explanation
→ Synthetic validation
→ Review
→ Demo verification
→ Updated KYC status
```

### KYC dashboard

Show:

* Aadhaar
* PAN
* Bank account
* Nomination

States:

* Verified
* Pending
* Action required
* Not added

Each should be interactive.

### Requirements

For selected document explain what is generally required.

Examples:

Aadhaar:

* Aadhaar
* registered mobile

PAN:

* PAN
* matching personal details

Bank:

* account details
* IFSC
* account-holder information

Clearly distinguish general guidance from actual EPFO rules where certainty is unavailable.

### Process diagram

Show:

```text
Choose document
→ Enter details
→ Verify details
→ Verification
→ KYC updated
```

Then run a synthetic version of that process.

### Demo workflow

Allow user to select Aadhaar/PAN/Bank.

Use pre-filled synthetic values.

Do NOT request real identity information.

Perform deterministic demo validation:

```text
✓ Format valid
✓ Required information present
✓ Demo verification complete
```

Then show a review screen and:

`Submit demo KYC`

Process into a synthetic success state.

After success, update the demo KYC state from e.g.:

`Action required → Verified`

and show the update in KYC history.

### Failure state

Support at least one deterministic failure/incomplete profile.

Example:

```text
PAN
⚠ Action required

Missing verification information.
```

Do not make every path automatically successful.

### Final state

Show:

> Demo KYC completed.

> No real identity information was submitted.

Then provide the existing official-service handoff.

---

# 3. Shared architecture

Reuse existing:

* journey/step components
* demo profile system
* synthetic state
* prototype boundary
* official handoff
* loading/error/success components

Add structured synthetic data rather than hardcoding data inside components.

For passbook, create a transaction model and centralized summary/filter utilities.

For KYC, create structured KYC records and state transitions.

Keep all demo data deterministic.

---

# 4. Homepage

Update the existing cards.

Replace:

> Informational preview

with:

### PF balance & passbook

> View your balance, contribution history and synthetic passbook.

CTA:

`Explore passbook →`

### Update KYC

> Check KYC status, understand requirements and walk through a demo update.

CTA:

`Explore KYC →`

Do not imply real EPFO transactions.

---

# 5. UX requirements

Both experiences must be:

* responsive
* mobile-first
* keyboard accessible
* compatible with existing accessibility controls
* consistent with the current ClaimSaathi visual language
* minimal and task-focused

Mobile passbook filters should become a drawer/bottom sheet rather than a desktop-style filter bar.

Mobile transactions should use cards rather than a squeezed table.

KYC process diagram should become vertical on mobile.

---

# 6. Safety

This remains a prototype.

Never collect/store/transmit real:

* Aadhaar
* PAN
* UAN
* bank details
* OTP
* passwords
* identity documents

No real EPFO API calls or transactions.

Clearly label synthetic/demo data.

Do not use AI/LLMs for eligibility or government decisions.

---

# 7. Testing

Add/update tests for:

### Passbook

* date filtering
* transaction filtering
* summary calculations
* empty results
* transaction details

### KYC

* status rendering
* document selection
* validation
* success
* failure
* state update

### Integration

Verify:

Homepage → Passbook works.

Homepage → KYC works.

Demo profile changes correctly affect both.

Verify existing Withdraw PF, Transfer PF and Claim Tracking journeys are not broken.

---

# Execution

Implement in this order:

1. Inspect existing architecture.
2. Implement Passbook.
3. Test Passbook.
4. Implement KYC.
5. Test KYC.
6. Update homepage cards.
7. Run full application/tests.
8. Fix regressions.

Do not add unrelated features.

Do not ask for clarification unless the existing architecture contains a genuine ambiguity that cannot be resolved safely by following the established patterns.

Prefer reusing existing abstractions over creating parallel implementations.
