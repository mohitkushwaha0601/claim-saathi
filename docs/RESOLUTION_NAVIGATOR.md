# ClaimSaathi Resolution Navigator

## The problem

For the MVP transfer journey, a missing Date of Exit produces the deterministic
issue `EXIT_DATE_MISSING`. The traditional experience can become:

```text
error → search FAQ → leave portal → return later → start again
```

## ClaimSaathi's Phase 4 flow

```text
EXIT_DATE_MISSING
        ↓
approved RES_EXIT workflow
        ↓
conditional official Mark Exit guidance
        ↓
WAITING_FOR_UPDATE
        ↓
recheck fresh trusted CitizenState
        ↓
RESOLVED or STILL_BLOCKED
        ↓
later full journey re-evaluation in Phase 5
```

`RES_EXIT@1` contains four reviewed steps: review the missing record, follow the
official Mark Exit route subject to EPFO's applicable 60-day condition, wait for
the trusted record to change, and recheck that record.

ClaimSaathi does not calculate whether the 60-day condition has elapsed and does
not claim the external self-service process is available to a particular
citizen. `CITIZEN_ACTION_REQUIRED` means only that the citizen should review or
follow the approved external guidance subject to its official prerequisites.

## How success is proved

The navigator never trusts a citizen or frontend `resolved=true` signal. It
reloads a fresh, versioned `CitizenState` and runs the allowlisted
`PREVIOUS_EMPLOYMENT_EXIT_DATE_PRESENT` verifier. The verifier succeeds only
when exactly one explicitly typed `PREVIOUS` employment record exists and its
`exit_date` is non-null. It does not pick the first record or treat an exit date
on current employment as success.

The checked state version is recorded for audit, but a higher version is not
evidence by itself. If the required fact is still missing or the previous record
is ambiguous, the instance becomes `STILL_BLOCKED`.

## Prototype boundary

The hackathon prototype does not connect to or modify EPFO records. Tests use
synthetic citizen snapshots to simulate a later trusted record update. Phase 4
does not re-run policy rules or prerequisite graphs after a resolution; that
coordination is reserved for the Phase 5 Journey Orchestrator.
