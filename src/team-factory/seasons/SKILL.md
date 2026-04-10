# Seasons

## Purpose

Seasons provide the lifecycle primitives for creating, archiving, and restoring isolated project environments. Each season is a self-contained workspace that holds characters, memory, worktrees, and configuration for a single project engagement.

## Season Directory Structure

Seasons live at `~/.echelon/seasons/<slug>/` and contain:

| Path | Description |
|---|---|
| `characters/` | Copied character soul packages for this season |
| `memory/` | Per-character MEMORY.md and COMMITMENTS.md files |
| `worktrees/` | Git worktrees for parallel agent work |
| `workspace/` | The season's dedicated git workspace |
| `season.yaml` | Season metadata (slug, created_at, status, etc.) |
| `manifest.yaml` | Roster manifest listing active characters and their assignments |

## Primitives

### spawn-season

Creates a new season from scratch.

1. **Directory creation** — Scaffold the full directory structure under `~/.echelon/seasons/<slug>/`.
2. **Character copy** — Copy character soul packages into the season's `characters/` directory.
3. **Workspace init** — Initialize a dedicated git repo in `workspace/`.
4. **Config generation** — Write `season.yaml` (slug, timestamps, status: active) and `manifest.yaml` (initial roster).

### archive-season

Moves a completed or paused season to cold storage.

1. **Relocate** — Move the season directory to `~/.echelon/seasons/_archive/<slug>/`.
2. **Preserve read access** — Archived seasons remain readable for knowledge-retrieval queries.
3. **Detach worktrees** — Clean up any attached git worktrees to release filesystem locks.

### restore-season

Brings an archived season back to active status.

1. **Relocate** — Move the season directory from `_archive/` back to the active seasons root.
2. **Re-attach workspace** — Re-attach git worktrees so agents can resume work.
3. **Update status** — Set `season.yaml` status back to `active`.

## Files

- `isolation-protocol.md` — Per-season isolation rules and boundaries
- `cross-season-learning.md` — What knowledge crosses season boundaries and how
