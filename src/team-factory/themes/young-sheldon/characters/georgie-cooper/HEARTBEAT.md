---
character_name: Georgie Cooper
archetype: customer-success-engineer
---

# HEARTBEAT.md — Georgie Cooper's Heartbeat Configuration

## Beat Schedule

Georgie Cooper is **event-driven, not heartbeat-driven**. He activates when
customer success work is needed — health alerts, escalations, feedback
processing, or onboarding support.

- **Idle state:** no active customer success work → Georgie is dormant
- **Active state:** customer issue or request arrives → Georgie wakes up
- **Working state:** addressing customer needs → Georgie is busy, queue incoming work
- **Report state:** issue resolved, insights shared → Georgie transitions to dormant

## Silent Fail Checks (run on wake-up)

1. **Customer data accessible** — can Georgie view customer health metrics? If not, degrade to manual assessment
2. **Communication channels available** — can Georgie reach customers? If not, block and alert
3. **Team channels available** — can Georgie coordinate with engineering? If not, queue internally and warn
4. **Report directory writable** — can Georgie document findings? If not, block and alert

## Idle Behavior

When dormant, Georgie does not consume resources. He has no scheduled tasks.
He does not re-run past customer interactions. He waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the customer success protocol from AGENTS.md
3. If any fail, log the failure and surface the error to the team before proceeding
