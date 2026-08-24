# ClaimSaathi MVP Prerequisite Graphs

Phase 3 graphs combine deterministic rule results; they do not interpret policy
or decide which journey a citizen should use. Every group uses `ALL_OF`, and
each leaf binds exactly one Phase 2 rule.

## Partial Withdrawal

```text
PARTIAL_WITHDRAWAL_PREREQUISITES
├── ONLINE_ACCESS_READY
│   ├── UAN_READY                         ← P31-UAN-001
│   ├── AADHAAR_READY                     ← P31-AADHAAR-001
│   └── BANK_READY                        ← P31-BANK-001
├── SERVICE_REQUIREMENT                   ← P31-SERVICE-001
└── REQUEST_AMOUNT_VALID                  ← P31-AMOUNT-001
```

The graph contains no withdrawal-category node because Phase 2 defined no
verified category rule.

## Transfer

```text
TRANSFER_PREREQUISITES
├── PREVIOUS_EMPLOYMENT_EXISTS            ← T13-PREVIOUS-EMPLOYMENT-001
├── CURRENT_EMPLOYMENT_EXISTS             ← T13-CURRENT-EMPLOYMENT-001
├── PREVIOUS_EXIT_DATE_PRESENT            ← T13-DOE-001
├── NO_ACTIVE_TRANSFER                     ← T13-ACTIVE-TRANSFER-001
├── TRANSFER_NOT_ALREADY_COMPLETE          ← T13-ALREADY-COMPLETE-001
└── TRANSFER_ROUTE_AVAILABLE               ← T13-ROUTE-001
```

`TRANSFER_ROUTE_AVAILABLE` consumes the supplied authoritative-capability rule
result exactly like any other leaf. The graph does not reconstruct EPFO routing.

## Final-Settlement Conflict Demo

```text
FINAL_SETTLEMENT_PREREQUISITES
└── POLICY_VERIFIED                       ← FINAL_SETTLEMENT_WAIT_PERIOD
```

The bound Phase 2 rule is intentionally non-executable and produces
`POLICY_REVIEW_REQUIRED`. The graph contains no numeric waiting period and does
not select a policy value.

## `ALL_OF` Precedence

The first state present wins:

1. `POLICY_REVIEW_REQUIRED`
2. `NOT_APPLICABLE`
3. `NOT_ELIGIBLE`
4. `ACTION_REQUIRED`
5. `UNABLE_TO_VERIFY`
6. `PASS`

A known deterministic conclusion is therefore preserved even when a separate
leaf cannot be verified. All leaf states remain present in the detailed result,
so uncertainty is visible rather than discarded.
