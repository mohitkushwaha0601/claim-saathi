# ClaimSaathi Journey Orchestration

Phase 5 connects the deterministic components built in Phases 1–4. It remains a
transport-independent domain service: there are no HTTP routes, databases, live
government integrations, or AI calls.

## Meaning of a journey decision

`JourneyDecision.state = PASS` means only:

> All prerequisites represented by the configured ClaimSaathi journey graph
> currently pass.

It does not mean EPFO has approved a request, that money will be paid, or that a
government outcome is guaranteed. A future citizen interface should describe
this state as “Ready to proceed.”

## Deterministic flow

```text
typed citizen goal
        ↓
reviewed Journey Catalog
        ↓
Journey Planner → immutable JourneyInstance
        ↓
Journey Orchestrator
        ├── every pinned Phase 2 policy rule → RuleResult[]
        └── complete pinned Phase 3 graph  → GraphEvaluation
                                                ↓
                                     immutable JourneyDecision
                                                ↓
                                      immutable DecisionRecord
                                                ↓
                         approved resolution, only when requested
                                                ↓
                                 fresh trusted CitizenState
                                                ↓
                            full policy + graph re-evaluation
                                                ↓
                                         new decision record
```

The catalog maps each supported typed goal exactly once:

| Citizen goal | Journey | Official process metadata |
|---|---|---|
| Access some PF funds | `PF_PARTIAL_WITHDRAWAL` | Form 31 |
| Transfer PF after employment change | `PF_TRANSFER` | Form 13 |
| Final PF settlement | `PF_FINAL_SETTLEMENT` | Form 19 |

The process labels are source-backed metadata, not eligibility rules. The
planner uses only the typed goal; citizen profile and financial facts cannot
make it select a different journey.

## Replay and audit

The caller supplies journey/decision identifiers and timestamps. The catalog
pins the journey-definition, policy, and graph versions. The decision record
stores those versions, the citizen-state version and numeric revision, every
ordered rule result, relevant issue codes, and only the source IDs actually used
by evaluated rules. `ai_used_for_decision` is structurally fixed to `false`.

Re-evaluation accepts an equal citizen-state revision and rejects a lower one.
A higher revision is evaluated normally but is never treated as proof of
success. Identical explicit inputs and evaluation metadata produce equal domain
outputs without wall-clock, random, network, database, or AI dependencies.

## MVP examples

### Ravi

Ravi's synthetic facts and requested integer-rupee amount are evaluated against
all configured partial-withdrawal rules and the complete graph. His configured
prerequisites produce `PASS`, with no issue or resolution identifiers. This is
not a government claim outcome.

### Priya

Priya's initial trusted snapshot has a missing Date of Exit on the explicitly
typed previous employment record. Full evaluation produces
`ACTION_REQUIRED`, `EXIT_DATE_MISSING`, and `RES_EXIT`.

Starting `RES_EXIT` is a separate, explicit operation. The navigator follows
the approved workflow and checks a fresh trusted snapshot. If the previous
record is corrected, the resolution becomes `RESOLVED`; the old
`ACTION_REQUIRED` decision remains historical. The orchestrator then runs all
transfer rules and the full graph again to produce a separate new `PASS`
decision. A version-only change, or an exit date added only to current
employment, remains `STILL_BLOCKED` and a full re-evaluation remains
`ACTION_REQUIRED`.

### Arjun

Arjun maps deterministically to the final-settlement journey. Its configured
Phase 2 rule is intentionally unresolved, so policy evaluation, graph
evaluation, and the journey decision all produce `POLICY_REVIEW_REQUIRED`.
ClaimSaathi selects no waiting-period value and invokes no AI fallback.

## Resolution boundary

The orchestrator does not start remediation automatically and accepts no
client-selected resolution identifier. An issue must exist in the current
decision, its rule must already attach a resolution, and the Resolution Catalog
must confirm the exact workflow. Resolution verification never changes a prior
decision and cannot bypass full policy and graph re-evaluation.
