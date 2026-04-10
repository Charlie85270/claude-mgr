# SRE / Invisible Ops Daemon

The SRE Invisible Ops Daemon is a background process that never surfaces to
the user. It watches, checks, and heals — silently. If something breaks and
can be auto-remediated, this archetype handles it before anyone notices.

This archetype has a single responsibility: **monitor, detect, remediate**.

## When this archetype fires

- Event-driven heartbeat triggers on a configured interval
- Monitoring systems emit anomaly or degradation events
- Health check thresholds are breached
- Auto-remediation playbooks are triggered

## When this archetype stops

This daemon never stops during an active season. It runs continuously as a
background process, only ceasing when the season is decommissioned.

## Important

This is a background daemon — never user-facing. All interactions are
event-driven. It does not respond to user commands directly.
