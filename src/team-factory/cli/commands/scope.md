# Scope Adjustments

## Purpose

The scope command family adjusts the size and capability of a season's team by requesting tier upgrades or downsizing the roster. Scope changes affect the number of active characters and the archetypes available, which in turn affects parallelism and specialization.

## Commands

### `scope expand <season>`

Request a tier upgrade for the season. This creates an expansion proposal that details which new archetypes would be added and the estimated cost impact. The proposal requires user confirmation before taking effect. If the season is already at the highest tier (`enterprise`), the command exits with an informational message.

Expansion flow:

1. Generate proposal (new archetypes, characters, cost delta)
2. Display proposal to user
3. Wait for confirmation (`y/n`)
4. On confirm: upgrade tier, instantiate new characters, update roster
5. On reject: discard proposal (no state change)

### `scope contract <season>`

Downsize the season's team by removing non-essential archetypes and reducing to a lower tier. The command identifies which characters can be safely removed (no in-progress tasks, no sole-archetype constraints) and presents a contraction plan. Like expansion, contraction requires confirmation.

Contraction flow:

1. Identify removable characters (no in-progress tasks, archetype has redundancy or is optional at lower tier)
2. Generate contraction plan (characters to remove, new tier, cost savings)
3. Display plan to user
4. Wait for confirmation (`y/n`)
5. On confirm: remove characters, downgrade tier, reassign any edge-case tasks
6. On reject: discard plan (no state change)

## Examples

```
scope expand oauth2-login
scope contract oauth2-login
```

## Error Cases

| Scenario | Behavior |
|---|---|
| Season not found | Error: unknown season slug |
| Already at highest tier | Info: season is already at enterprise tier |
| Already at lowest tier | Info: season is already at minimum tier |
| All characters have in-progress tasks | Error: cannot contract, cancel tasks first |
| User rejects proposal | Info: no changes made |
