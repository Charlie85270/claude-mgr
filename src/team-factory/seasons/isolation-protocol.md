# Isolation Protocol

## Purpose

Each season operates as an isolated environment. This document defines the isolation boundaries that prevent seasons from interfering with each other.

## Isolation Rules

### Workspace Isolation

Each season has its own git workspace at `~/.echelon/seasons/<slug>/workspace/`. Agents can only write to the workspace belonging to their active season. No agent may modify files in another season's workspace under any circumstance.

### Channel Isolation

Each season gets its own set of communication channels. A channel name (e.g., Pennys-Apartment) is scoped to the season that owns it. Messages posted in one season's channels are not visible to agents operating in a different season.

### Cron / Schedule Isolation

Background tasks such as orphan cleanup, stale-worktree pruning, and periodic health checks are namespaced per season. A cron job belonging to season A will never act on resources owned by season B.

### Character Scoping

A character's per-session state is scoped to the season:

- **MEMORY.md** — Per-season. A character's memory in one season does not carry over to another.
- **COMMITMENTS.md** — Per-season. Commitments are made within the context of a single season and do not persist across seasons.

### No Shared Mutable State

Seasons share **no** mutable state with each other. The only cross-season resources are read-only or append-only:

| Resource | Access | Notes |
|---|---|---|
| Advisory board | Read-only | All seasons may consult the advisory board |
| Mempalace team wing | Append-only | Available in v0.5+; seasons may append learnings but not modify existing entries |

All other state — workspace files, worktrees, in-flight tasks, review gates — is strictly season-local.
