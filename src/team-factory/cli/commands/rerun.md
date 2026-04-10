# Re-Execute Operations

## Purpose

The rerun command family re-executes previously completed steps with updated inputs or different actors. This is useful when upstream data changes (e.g., a PRD is revised), when a gate produced a flawed result, or when a character needs to be swapped out mid-season.

## Commands

### `season reingest <season>`

Re-run the ingestion pipeline for the named season using the current PRD content. This discards the previous plan and generates a new one. Any in-progress tasks from the old plan are cancelled. Completed and merged tasks are unaffected — they remain in the project history. The new plan picks up where completed work left off, avoiding duplicate effort.

### `review rerun <task-id> <gate>`

Re-execute a single review gate for a task. The previous gate result is archived (not deleted) and a new evaluation runs against the current state of the task's worktree. This is useful after the author has addressed feedback but the gate was not automatically re-triggered. The bounce counter is not incremented by a rerun.

### `character recast <season> <archetype> <new-character>`

Swap the character filling a given archetype in a season. The old character's in-progress tasks are reassigned to the new character. Completed tasks retain the original character's attribution. The new character inherits the season context and any relevant KB entries tagged with the archetype.

## Examples

```
season reingest my-feature-season
review rerun TASK-0042 code-review
character recast my-feature-season principal-architect new-sheldon
```

## Error Cases

| Scenario | Behavior |
|---|---|
| Season not found | Error: unknown season slug |
| Season has no previous ingestion | Error: nothing to reingest |
| Task not found | Error: unknown task ID |
| Gate not yet run | Error: gate has no previous result to rerun |
| Archetype not in season roster | Error: archetype not assigned in this season |
| New character same as current | Warning: no change needed (no-op) |
