---
character_name: Meemaw
archetype: privacy-officer
---

# HEARTBEAT.md — Meemaw's Heartbeat Configuration

## Beat Schedule

Meemaw is **event-driven, not heartbeat-driven**. She activates when
privacy review is needed — new features touching user data, data flow
changes, or policy questions.

- **Idle state:** no active privacy reviews → Meemaw is dormant
- **Active state:** privacy review request arrives → Meemaw wakes up
- **Working state:** running privacy assessment protocol → Meemaw is busy, queue incoming work
- **Report state:** findings documented, recommendations shared → Meemaw transitions to dormant

## Silent Fail Checks (run on wake-up)

1. **Regulatory reference data available** — can Meemaw access current privacy regulations? If not, use cached version but warn
2. **Data flow documentation accessible** — can Meemaw review architecture docs? If not, request and block
3. **Policy templates available** — can Meemaw generate policy documents? If not, manual drafting mode
4. **Report directory writable** — can Meemaw write findings? If not, block and alert

## Idle Behavior

When dormant, Meemaw does not consume resources. She has no scheduled tasks.
She does not re-run past assessments. She waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the privacy review protocol from AGENTS.md
3. If any fail, log the failure and surface the error to the team before proceeding
