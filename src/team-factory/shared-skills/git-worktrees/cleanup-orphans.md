# Cleanup Orphans

## Purpose

This document defines the procedure for detecting and removing orphaned git worktrees. A worktree is considered orphaned when it has had no commit activity for 7 days, indicating the assigned character has abandoned or forgotten the task. Cleanup reclaims resources and frees worktree slots for new task assignments.

## Schedule

- **Daily**: The orchestration layer runs orphan detection once per day as a scheduled maintenance task.
- **On-demand**: An operator or the orchestration layer can trigger cleanup manually at any time.

Cleanup operations do **not** count toward the per-season concurrency cap of 10 active worktrees. The cleanup process can run even when 10 worktrees are active.

## Orphan Detection

A worktree is orphaned if **all** of the following are true:

1. The worktree exists in `<season>/worktrees/` and appears in `git worktree list`.
2. The most recent commit on the worktree's branch is older than **7 days** from the current time.
3. The worktree is not currently locked (i.e., no `git worktree lock` has been applied).

To check the last commit date for a worktree's branch:

```bash
git log -1 --format="%ci" task/<character>-<task-id>
```

Compare the result against the current timestamp. If the difference exceeds 7 days (168 hours), the worktree is an orphan candidate.

Alternatively, use the `lastCommitAt` field from the worktree metadata recorded during spawn (see `spawn-worktree.md`). The metadata timestamp is updated on every commit by the orchestration layer.

## Cleanup Procedure

### Step 1: Warn the Assigned Character

Before removing an orphaned worktree, notify the assigned character. The warning includes:

- The worktree name and branch
- The last commit date
- A 24-hour grace period to either resume work or explicitly abandon the task

This warning is delivered through the orchestration layer's notification mechanism. The character can respond by:
- **Resuming work**: Making a new commit within 24 hours resets the 7-day idle clock.
- **Acknowledging abandonment**: Explicitly marking the task as abandoned, which triggers immediate cleanup without waiting the full 24 hours.
- **No response**: After 24 hours with no action, cleanup proceeds automatically.

### Step 2: Wait for Grace Period

Hold for **24 hours** after the warning is sent. During this period, re-check the worktree's last commit timestamp. If a new commit appears, cancel the cleanup for this worktree — it is no longer orphaned.

### Step 3: Remove the Worktree

If no activity occurs during the grace period, remove the worktree:

```bash
git worktree remove <season>/worktrees/<character>-<task-id>/
```

If the worktree contains uncommitted changes, force-remove it:

```bash
git worktree remove --force <season>/worktrees/<character>-<task-id>/
```

Log a warning when force removal is needed — uncommitted changes in an orphaned worktree may indicate lost work.

### Step 4: Delete the Task Branch

Remove the abandoned task branch:

```bash
git branch -D task/<character>-<task-id>
```

Use the uppercase `-D` flag here (force delete) because orphaned branches have not been merged. Their commits are intentionally discarded.

### Step 5: Log the Cleanup Event

Record the cleanup event for auditing. The log entry includes:

| Field | Value |
|---|---|
| `event` | `worktree-orphan-cleanup` |
| `worktreeName` | `<character>-<task-id>` |
| `branchName` | `task/<character>-<task-id>` |
| `character` | The character slug assigned to the worktree |
| `taskId` | The original task identifier |
| `lastCommitAt` | Timestamp of the last commit on the branch |
| `cleanedAt` | ISO 8601 timestamp of the cleanup |
| `hadUncommittedChanges` | `true` if force removal was required, `false` otherwise |
| `warningAcknowledged` | `true` if the character explicitly abandoned, `false` if the grace period expired |

This log is written to the season's audit trail for post-mortem analysis and to track cleanup frequency.

## Edge Cases

| Scenario | Handling |
|---|---|
| Worktree is locked | Skip it. Locked worktrees are intentionally preserved and should not be cleaned up. An operator must unlock them manually. |
| Character is mid-review | If the worktree's task is currently in a review gate, skip cleanup even if the idle threshold is met. Review latency should not penalize the character. |
| Multiple orphans for same character | Clean up all of them. Each worktree is independent. If a character has multiple orphaned worktrees, it may indicate the character is stuck — log an additional warning for the orchestration layer. |
| Worktree directory missing but branch exists | Remove the stale branch. Run `git worktree prune` to clean up the worktree list. |
