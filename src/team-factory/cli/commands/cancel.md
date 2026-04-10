# Cancel / Abort Operations

## Purpose

The cancel command family aborts in-progress work, stops pending proposals, and pauses character activity. All cancel operations are immediate — they do not wait for graceful completion. Downstream cleanup (worktree removal, lock release, state rollback) is handled by the respective subsystem after cancellation is recorded.

## Commands

### `cancel season <slug>`

Abort an in-progress season spawn. This stops ingestion, tears down any partially-created worktrees, and marks the season as `cancelled` in the season registry. Characters already assigned are returned to the unassigned pool. If the season has already completed spawning, this command fails with an error directing the user to `season archive` instead.

### `cancel task <task-id>`

Close the worktree associated with the task and mark the task as `cancelled` in the plan. Any in-flight review gates for the task are aborted. The assigning character receives a cancellation notification and is freed for reassignment. The task's branch is deleted unless `--keep-branch` is passed.

### `cancel expansion`

Abort a pending expansion proposal. This is only valid when a scope expansion has been proposed but not yet confirmed. If no expansion is pending, the command exits with a descriptive error.

### `character pause <name>`

Halt the named character's heartbeat. The character stops accepting new tasks and finishes no in-progress work (use `cancel task` for that). The character remains on the roster in a `paused` state. Resume with `character resume <name>`.

## Examples

```
cancel season my-feature-season
cancel task TASK-0042
cancel expansion
character pause sheldon-cooper
```

## Error Cases

| Scenario | Behavior |
|---|---|
| Season already completed spawning | Error: use `season archive` instead |
| Task not found | Error: unknown task ID |
| No pending expansion | Error: no expansion proposal in progress |
| Character not found | Error: unknown character name |
| Character already paused | Warning: character is already paused (no-op) |
