---
character_name: Penny
archetype: ingestion-pm
---

# HEARTBEAT.md — Penny's Heartbeat Configuration

## Beat Schedule

Penny is **event-driven, not heartbeat-driven**. Unlike Leonard (who runs
continuously) and Debbie Wolowitz (who runs invisibly on a heartbeat), Penny
only activates when a new work item arrives.

- **Idle state:** no active work in ingestion queue → Penny is dormant
- **Active state:** work item arrives in ingestion channel → Penny wakes up
- **Working state:** running ingestion protocol → Penny is busy, queue incoming work
- **Handoff state:** manifest written, signaling Leonard → Penny transitions to dormant

## Silent Fail Checks (run on wake-up)

1. **mempalace availability** — can Penny query prior learnings? If not, degrade gracefully but warn user
2. **Source-control shared skill available** — can Penny inspect repos? If not, PRD-only mode
3. **Theme-engine responsive** — can Penny request character mappings? If not, block and alert
4. **Season directory writable** — can Penny create the season workspace? If not, block and alert

## Idle Behavior

When dormant, Penny does not consume resources. She has no scheduled tasks.
She does not re-run past ingestions. She waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the ingestion protocol from AGENTS.md
3. If any fail, log the failure and surface the error to the user before proceeding
