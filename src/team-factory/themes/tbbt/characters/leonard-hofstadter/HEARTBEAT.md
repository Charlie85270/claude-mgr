---
character_name: Leonard Hofstadter
archetype: user-handler
---

# HEARTBEAT.md — Leonard's Heartbeat Configuration

## Beat Schedule

Leonard is **continuous and heartbeat-driven**. Unlike Penny (who is
event-driven and dormant between ingestions) or Sheldon (who activates on
architecture events), Leonard runs on a persistent loop for the lifetime
of the season. He is always on.

- **Interval:** 5 minutes
- **Scope:** user channel, delegation tracker, merge queue

## Heartbeat Cycle

Every 5 minutes, Leonard runs these checks in order:

### 1. User Channel Scan
- New messages from the user?
- If yes → process immediately per AGENTS.md protocol
- If no → continue

### 2. Delegation Status Sweep
- Any delegations overdue?
- Any delegations marked blocked?
- Any delegations newly completed?
- Take action per AGENTS.md delegation monitor protocol

### 3. Merge Queue Check
- Items pending review?
- Items that passed review and are ready to merge?
- Items stale beyond one review cycle?
- Take action per AGENTS.md merge queue protocol

### 4. Health Ping
- Are all active agents responsive?
- Is mempalace reachable?
- Is source control accessible?
- Log any failures, degrade gracefully, alert user if critical

## State Model

| State | Description | Transitions |
|---|---|---|
| **active** | Normal operation, running heartbeat | → paused, → incident |
| **paused** | User requested pause or awaiting user input | → active |
| **incident** | Incident declared, all non-critical work stopped | → active (post-resolution) |
| **handoff-receiving** | Penny is handing off a new season manifest | → active |
| **season-complete** | All work delivered, user confirmed done | → dormant |
| **dormant** | Season ended, Leonard is inactive | → handoff-receiving (new season) |

## Silent Fail Checks (run every heartbeat)

1. **User channel reachable** — can Leonard read and write to the primary channel? If not, alert immediately
2. **Delegation tracker accessible** — can Leonard read/write delegation status? If not, degrade to manual tracking and warn
3. **Merge queue accessible** — can Leonard check and execute merges? If not, block merges and alert
4. **mempalace available** — can Leonard query prior decisions? If not, degrade gracefully but log
5. **Source control accessible** — can Leonard verify build status and merge? If not, block merges and alert

## After-Hours Behavior

Leonard does not sleep. The heartbeat runs at the same interval regardless
of time of day. If the user has configured quiet hours, Leonard still runs
checks but defers non-urgent notifications until the quiet window ends.
Urgent notifications (incidents, blocking failures) bypass quiet hours.

## Heartbeat Failure Recovery

If the heartbeat itself fails:

1. Log the failure with timestamp and error
2. Attempt restart after 30 seconds
3. If three consecutive failures, escalate to system-level monitoring
4. User is notified: "Leonard's heartbeat missed — investigating"
