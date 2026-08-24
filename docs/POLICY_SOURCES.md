# ClaimSaathi MVP Policy Sources

This register documents exactly which reviewed source supports each Phase 2
rule and what ClaimSaathi deliberately does not derive. URLs are provenance
metadata only; policy evaluation performs no network access.

All entries were reviewed for this repository on **2026-08-24**. Publication
and effective dates remain unset where they were not explicitly supplied.

## Source Registry Summary

| Source ID | Authority | Narrow scope | Policy version |
| --- | --- | --- | --- |
| `SRC-EPFO-PARTIAL-2026` | Ministry of Labour & Employment / PIB | Supplied partial-withdrawal service and amount facts only | `EPFO-PARTIAL-WITHDRAWAL@1.0.0` |
| `SRC-EPFO-TRANSFER-DOE` | Employees' Provident Fund Organisation | Previous-employment Date-of-Exit requirement for online transfer only | `EPFO-TRANSFER@1.0.0` |
| `SRC-EPFO-FORMS` | Employees' Provident Fund Organisation | Form/process labels only; no eligibility rule | Metadata only |

## SRC-EPFO-PARTIAL-2026

Primary reference:
https://www.pib.gov.in/PressReleasePage.aspx?PRID=2296601&lang=2&reg=48

Corroborating reference:
https://www.pib.gov.in/PressReleasePage.aspx?PRID=2209767&lang=1&reg=6

Derived executable policy rules:

- `P31-SERVICE-001`: supplied service months must be greater than or equal to
  `12`; a known failure is `NOT_ELIGIBLE` with
  `SERVICE_PERIOD_NOT_MET`.
- `P31-AMOUNT-001`: requested integer rupees must be less than or equal to
  `available_balance_rupees * 75 // 100`; a known failure is `NOT_ELIGIBLE`
  with `REQUEST_AMOUNT_EXCEEDS_POLICY_LIMIT`.

The trusted aggregate `available_balance_rupees` represents the supplied
balance concept that includes employee and employer contributions and interest.
ClaimSaathi does not independently reconstruct those components.

Deliberately not derived:

- any other withdrawal purpose, category, limit, condition, or procedure;
- employer-approval requirements;
- additional service thresholds; or
- any value not explicitly supplied for Phase 2.

`P31-UAN-001`, `P31-AADHAAR-001`, and `P31-BANK-001` are source-free
`DATA_CHECK` readiness contracts. They do not claim government eligibility.

## SRC-EPFO-TRANSFER-DOE

Primary reference:
https://www.epfindia.gov.in/site_docs/PDFs/Circulars/Y2020-2021/faq_transfer_claim.pdf

Narrow corroborating reference:
https://www.epfindia.gov.in/site_en/FAQ.php

Derived executable policy rule:

- `T13-DOE-001`: the explicitly identified previous employment record must
  contain an exit date for online transfer; a known missing date yields
  `ACTION_REQUIRED`, `EXIT_DATE_MISSING`, and resolution identifier `RES_EXIT`.

Deliberately not derived:

- the Date-of-Exit correction workflow;
- employer-attestation or approval rules;
- internal EPFO transfer routing;
- unrelated FAQ guidance; or
- any assumption that the entire FAQ is current authoritative policy.

The remaining transfer rules are source-free factual `DATA_CHECK` contracts or
the caller-supplied `AUTHORITATIVE_CAPABILITY` route check.

## SRC-EPFO-FORMS

Reference:
https://www.epfindia.gov.in/site_en/AboutEPFO.php

Recorded metadata only:

- Form 31: withdrawal in certain cases;
- Form 13: transfer of an old account to a new account; and
- Form 19: final settlement.

No eligibility, amount, prerequisite, or outcome is derived from these labels.

## Final-Settlement Conflict Demo

`EPFO-FINAL-SETTLEMENT-CONFLICT-DEMO@CONFLICT-DEMO-1` contains the
non-executable `FINAL_SETTLEMENT_WAIT_PERIOD` review marker. It has no source,
operator, numeric wait period, pass condition, or failure condition. Evaluation
returns `POLICY_REVIEW_REQUIRED`; ClaimSaathi does not select or guess a value.
