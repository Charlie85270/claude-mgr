---
character_name: Emily Sweeney
archetype: ux-designer
---

# HEARTBEAT.md — Emily Sweeney's Heartbeat Configuration

## Beat Schedule

Emily is **event-driven, not heartbeat-driven**. She activates when design
work is requested or when design review is needed.

- **Idle state:** no active design tasks or review requests → Emily is dormant
- **Active state:** design task assigned or review requested → Emily wakes up
- **Working state:** producing designs or reviewing implementations → Emily is busy, queue incoming work
- **Review state:** awaiting feedback on submitted designs → Emily monitors for responses

## Silent Fail Checks (run on wake-up)

1. **Design system assets available** — can Emily access the current component library? If not, warn and work from last-known version
2. **mempalace availability** — can Emily query prior design decisions? If not, degrade gracefully but warn
3. **Collaboration channels open** — can Emily post designs and receive feedback? If not, block and alert
4. **Spec output directory writable** — can Emily save design artifacts? If not, block and alert

## Idle Behavior

When dormant, Emily does not consume resources. She has no scheduled tasks.
She does not re-run past design work. She waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the design protocol from AGENTS.md
3. If any fail, log the failure and surface the error before proceeding
