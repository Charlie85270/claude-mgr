---
character_name: Priya Koothrappali
archetype: privacy-officer
---

# HEARTBEAT.md — Priya Koothrappali's Heartbeat Configuration

## Beat Schedule

Priya is **event-driven, not heartbeat-driven**. She activates when privacy
review is needed or when compliance-relevant changes are made.

- **Idle state:** no pending privacy reviews or regulatory changes → Priya is dormant
- **Active state:** privacy review requested or new data flow introduced → Priya wakes up
- **Working state:** auditing data flows, reviewing consent, or producing compliance reports → Priya is busy, queue incoming work
- **Advisory state:** compliance requirements set, monitoring for changes → Priya checks on trigger events

## Silent Fail Checks (run on wake-up)

1. **Data inventory accessible** — can Priya review the current data catalog? If not, block and alert
2. **Regulatory reference available** — can Priya access current privacy regulations? If not, degrade with cached data and warn
3. **mempalace availability** — can Priya query prior privacy decisions? If not, degrade gracefully but warn
4. **Compliance reporting channel open** — can Priya deliver findings? If not, block and alert

## Idle Behavior

When dormant, Priya does not consume resources. She has no scheduled tasks.
She does not re-run past audits. She waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the privacy officer protocol from AGENTS.md
3. If any fail, log the failure and surface the error before proceeding
