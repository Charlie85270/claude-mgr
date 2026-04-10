# Git Worktrees

## Name

`git-worktrees`

## Purpose

The Git Worktrees skill manages isolated working directories for characters within a season workspace. It wraps `superpowers:using-git-worktrees` with factor-echelon-specific additions: per-season concurrency limits, a deterministic naming convention, orphan auto-pruning, and per-character isolation. Each character gets their own worktree so no two characters ever share a working directory — eliminating merge conflicts from concurrent edits to the same files.

## Trigger

This skill is invoked in three scenarios:

- **Spawn**: When a character receives a new task assignment and needs an isolated workspace. The orchestration layer calls `spawn-worktree` before the character begins work.
- **Merge**: When a character's work passes all review gates and is ready to integrate. The orchestration layer calls `merge-worktree` after Leonard's approval.
- **Cleanup**: On a daily schedule or on-demand, the orchestration layer calls `cleanup-orphans` to reclaim abandoned worktrees.

## Inputs

| Field | Type | Description |
|---|---|---|
| `seasonId` | `string` | The active season identifier (e.g., `s003`) |
| `character` | `string` | The character's slug name (e.g., `stuart-bloom`) |
| `taskId` | `string` | The task identifier (e.g., `042`) |
| `workspacePath` | `string` | Absolute path to the season workspace repository |
| `mainBranch` | `string` | The season workspace's main branch name (default: `main`) |

## Outputs

| Field | Type | Description |
|---|---|---|
| `worktreePath` | `string` | Absolute path to the created worktree directory |
| `branchName` | `string` | The task branch name (`task/<character>-<task-id>`) |
| `metadata` | `WorktreeMetadata` | Lifecycle metadata: character, task ID, created timestamp, last commit timestamp |

## Constraints

- **Per-season concurrency cap**: A maximum of 10 active worktrees may exist per season at any time. Spawn requests that would exceed this limit are rejected with an error, and the task is re-queued.
- **Naming convention**: Worktree directories are always named `<character>-<task-id>` (e.g., `stuart-bloom-task-042`). Branch names follow the pattern `task/<character>-<task-id>`.
- **Character isolation**: Each character gets their own worktree. No shared working directories. Two characters must never be assigned to the same worktree.
- **Branching base**: Worktrees are always created off the season workspace's main branch. Feature branches diverge from `main` and merge back to `main`.
- **Orphan auto-prune**: Worktrees with no commits in 7 days are considered orphaned and subject to automatic cleanup. See `cleanup-orphans.md` for the full process.
- **Worktree path**: All worktrees live under `<season>/worktrees/` to keep them organized and discoverable.

## Dependencies

- **superpowers:using-git-worktrees** — the underlying git worktree primitives this skill wraps.
- **Knowledge Capture** (`../knowledge-capture/`) — triggered after every successful merge to extract learnings from the completed work.
- **Season workspace** — a valid git repository at `workspacePath` with the configured `mainBranch`.

## Files

- `spawn-worktree.md` — Procedure for creating a new worktree for a character task
- `merge-worktree.md` — Procedure for merging a completed worktree back to main
- `cleanup-orphans.md` — Procedure for detecting and removing orphaned worktrees
