# Force / Override Operations

## Purpose

The override command family lets the user bypass automated decisions when human judgment takes precedence. Every override command requires a `--reason` flag — overrides without justification are rejected. The reason string is stored in the audit log and attached to the affected entity's metadata, making override history fully traceable.

## Commands

### `review override <task-id> <gate> --reason "..."`

Force-pass a specific review gate for a task. The gate is marked as `override-pass` rather than `pass`, preserving the distinction in gate history. Valid gate names: `architecture-review`, `code-review`, `qa-review`, `security-review`, `adversarial-review`, `ui-functionality-review`, `refinement`. If all required gates are now passing (including this override), the task proceeds to merge authority.

### `merge force <task-id> --reason "..."`

Bypass all gates and merge the task immediately. This skips any failing or pending gates and proceeds directly to merge. The merge is tagged as `force-merge` in the commit metadata. This is the most powerful override and should be used sparingly — counselor verdicts and gate failures exist for good reasons.

### `counselor override <verdict-id> --reason "..."`

Override a counselor verdict with the user's decision. The verdict is marked as `user-overridden` and the user's reason is stored alongside the original verdict. Downstream actions that were blocked by the verdict proceed using the user's chosen direction.

### `roster assign <character> <secondary-archetype>`

Assign a secondary archetype to an existing character, expanding their role. The character retains their primary archetype and gains the capabilities of the secondary. This does not change task assignment priority — the primary archetype still governs scheduling. Use this when a small team needs characters to cover more ground.

## Examples

```
review override TASK-0042 security-review --reason "False positive on dependency scan"
merge force TASK-0015 --reason "Hotfix for production outage"
counselor override VERDICT-003 --reason "Accepted risk for timeline"
roster assign sheldon-cooper code-reviewer
```

## Error Cases

| Scenario | Behavior |
|---|---|
| Missing `--reason` flag | Error: overrides require `--reason` |
| Empty reason string | Error: reason must be non-empty |
| Unknown task or verdict ID | Error: entity not found |
| Gate name invalid | Error: unknown gate, list valid gates |
| Character not on roster | Error: character must exist in active season |
| Task already merged | Error: cannot override a completed task |
