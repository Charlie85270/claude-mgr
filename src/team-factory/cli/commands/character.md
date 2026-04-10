# Character Management

## Purpose

The character command family handles manual additions and removals of characters from a season's roster. Normally the roster is populated automatically during season creation based on the tier's archetype template, but these commands allow the user to intervene — adding specialists for unusual requirements or removing characters that are no longer needed.

## Commands

### `character add <season> <archetype>`

Add a character of the given archetype to the season's roster. A new character is instantiated from the archetype template and assigned to the season. If the season already has a character of this archetype, the new character is added as a secondary (the team gains parallel capacity for that role). The character starts in `active` state and is immediately eligible for task assignment.

### `character remove <season> <character>`

Remove a character from the season's roster. Any in-progress tasks assigned to the character are reassigned to another character of the same archetype. If no other character of that archetype exists, the command fails with an error — use `character add` first to ensure coverage, or `cancel task` to drop the work. Completed tasks retain the removed character's attribution.

## Examples

```
character add oauth2-login code-reviewer
character remove oauth2-login sheldon-cooper
```

## Error Cases

| Scenario | Behavior |
|---|---|
| Season not found | Error: unknown season slug |
| Invalid archetype | Error: unknown archetype, list valid archetypes |
| Character not found in season | Error: character is not on this season's roster |
| Removing sole archetype holder with in-progress tasks | Error: reassignment impossible, add replacement first |
| Character is paused | Warning: removing a paused character, tasks will be reassigned |
