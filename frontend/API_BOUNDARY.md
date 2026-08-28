# Frontend API boundary

The frontend is a presentation adapter. It may validate transport shape and
display backend-provided results, but it does not calculate eligibility,
prerequisites, amounts, policy outcomes, or government actions.

## Endpoint ownership

| Backend endpoint family | Frontend adapter | Purpose |
| --- | --- | --- |
| `/api/v1/demo/*` | `src/lib/api/demo.ts` | Explicitly synthetic demo personas and events |
| `/api/v1/journeys/*` | `src/lib/api/journeys.ts` | Journey creation, deterministic evaluation, and immutable decision records |
| `/api/v1/journeys/*/trace` | `src/lib/api/traces.ts` | Read-only execution trace for a stored decision |
| `/api/v1/journeys/*/explanations` | `src/lib/api/explanations.ts` | Explanation of an existing decision; never a decision input |
| `/api/v1/resolutions/*` | `src/lib/api/resolutions.ts` | Backend-approved resolution guidance |
| `/api/v1/policy/*` | `src/lib/api/policy.ts` | Reviewed source metadata |

Every government-shaped response must carry `DEMO`, `synthetic_data: true`,
and `real_government_action_performed: false`. The shared guard in
`src/lib/api/contracts.ts` rejects responses that do not carry all three
markers.

Decision states such as `UNABLE_TO_VERIFY` and `POLICY_REVIEW_REQUIRED` are
displayed as valid backend outcomes. The frontend must not replace them with a
guess, retry them as a different outcome, or infer missing policy.
