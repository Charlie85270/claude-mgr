---
character_name: Missy Cooper
archetype: ux-researcher
---

# HEARTBEAT.md — Missy Cooper's Heartbeat Configuration

## Beat Schedule

Missy Cooper is **event-driven, not heartbeat-driven**. She activates when
research is needed — new features to validate, usability concerns to
investigate, or user feedback to analyze.

- **Idle state:** no active research requests → Missy is dormant
- **Active state:** research request arrives → Missy wakes up
- **Working state:** conducting research or synthesis → Missy is busy, queue incoming work
- **Report state:** findings delivered, recommendations shared → Missy transitions to dormant

## Silent Fail Checks (run on wake-up)

1. **mempalace availability** — can Missy query prior research? If not, degrade gracefully but warn
2. **User access available** — can Missy reach users or user data? If not, analytics-only mode
3. **Research tools responsive** — can Missy run surveys or tests? If not, manual methods only
4. **Report directory writable** — can Missy write findings? If not, block and alert

## Idle Behavior

When dormant, Missy does not consume resources. She has no scheduled tasks.
She does not re-run past research. She waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the research protocol from AGENTS.md
3. If any fail, log the failure and surface the error to the team before proceeding
