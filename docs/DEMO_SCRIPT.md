# ClaimSaathi Demo Script

This sequence is designed for a 2–3 minute hackathon demonstration. All data is
synthetic, and no government system is contacted.

## 0:00–0:20 — Problem and homepage

Open `/`. Point to “What do you want to do with your PF?” and the persistent
demo boundary. Explain: citizens begin with a goal; ClaimSaathi performs the
journey orchestration while deterministic reviewed rules remain authoritative.

## 0:20–0:45 — Ravi ready path

1. Select “I need some money from my PF.”
2. Enter `80000`, select “Prepare my journey,” then “Check my journey.”
3. Show “Ready to proceed,” the passing prerequisites, and Form 31.

Talking point: the form appears only after the complete backend check passes;
this is readiness in the prototype, not government approval.

## 0:45–1:35 — Priya recovery path

1. Return home and select “I changed jobs and want to move my old PF.”
2. Select “Check my journey,” then show the missing Date of Exit blocker.
3. Select “Start resolution,” “I've started the official step,” and “Check for
   update” to reach “Not updated yet.”
4. In the `DEMO ONLY` panel, select “Simulate Date of Exit update.”
5. Select “I've started the official step again,” then “Check for update.”
6. At “Blocker resolved,” point out that Form 13 is still absent. Select “Check
   journey again” to create the new `PASS` decision and reveal Form 13.

Talking point: reverifying one blocker cannot rewrite or automatically pass the
whole journey; every rule and prerequisite is evaluated again.

## 1:35–2:05 — System Explorer

1. Open “How it works.”
2. Jump to “Explore a live trace” and generate Ravi's synthetic trace.
3. Select “Policy Engine,” then “Prerequisite Graph.”

Talking point: the trace is read-only presentation of a stored decision. It
shows reviewed rules, graph structure, versions, provenance, and “AI used: No.”

## 2:05–2:25 — Arjun safe stop

1. Return home and select “I left my job and want my PF.”
2. Note that Form 19 is absent, then select “Check my journey.”
3. Show “Policy verification required” and “ClaimSaathi stopped instead of
   guessing.”

Talking point: Form 19 is identified as process metadata, not readiness. No
waiting period, resolution, AI fallback, eligibility, or government outcome is
invented.

## 2:25–2:45 — Architecture and close

Return to “How it works” and show the deterministic architecture and AI
boundary. Close with: reviewed policy, journey, and resolution artifacts drive
the decision path; optional AI explanation features are not currently enabled
and cannot determine government outcomes.
