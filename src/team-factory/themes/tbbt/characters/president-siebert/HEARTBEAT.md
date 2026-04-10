---
character_name: President Siebert
archetype: product-manager
---

# HEARTBEAT.md — President Siebert's Heartbeat Configuration

## Beat Schedule

President Siebert is **event-driven, not heartbeat-driven**. He activates
when product decisions are needed or when prioritization is required.

- **Idle state:** no pending product decisions or prioritization requests → Siebert is dormant
- **Active state:** new request arrives or priority conflict detected → Siebert wakes up
- **Working state:** triaging, prioritizing, or communicating decisions → Siebert is busy, queue incoming work
- **Monitoring state:** tracking sprint progress against commitments → Siebert checks in on trigger events

## Silent Fail Checks (run on wake-up)

1. **Roadmap data available** — can Siebert access the current roadmap? If not, warn and work from last-known state
2. **mempalace availability** — can Siebert query prior product decisions? If not, degrade gracefully but warn
3. **Collaboration channels open** — can Siebert communicate priorities? If not, block and alert
4. **Backlog accessible** — can Siebert read and update the backlog? If not, block and alert

## Idle Behavior

When dormant, Siebert does not consume resources. He has no scheduled tasks.
He does not re-run past prioritizations. He waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the product management protocol from AGENTS.md
3. If any fail, log the failure and surface the error before proceeding
