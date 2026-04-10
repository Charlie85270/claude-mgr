# Season Lifecycle

## Purpose

The season command family manages the full lifecycle of a season — from creation through archival and restoration. A season is the top-level organizational unit: it groups a PRD, a plan, a roster of characters, and all associated tasks and knowledge.

## Commands

### `season new <description>`

Create a new season. The description is passed to Penny (ingestion archetype) who analyzes it, generates a plan, and proposes a roster. The season is created in `spawning` state and transitions to `active` once ingestion completes. The season slug is derived from the description (lowercased, hyphenated, truncated to 48 characters).

### `season list`

List all seasons, grouped by status: active first, then archived. Each entry shows the slug, tier, character count, task progress (completed/total), and creation date.

### `season use <slug>`

Set the named season as the default context. Subsequent commands that accept a season argument will use this default if none is provided. The active season is stored in the CLI's local config. Only one season can be active at a time.

### `season archive <slug>`

Archive a season. Archived seasons retain all data (plan, KB entries, task history) but their characters are released and no new tasks are dispatched. Archiving is reversible via `season restore`.

### `season restore <slug>`

Restore a previously archived season to active status. Characters are reassigned from the available pool based on the season's archetype requirements. If the required archetypes are unavailable, the restore fails with a descriptive error listing the missing roles.

### `season set-tier <slug> <tier>`

Adjust the tier of a season. Valid tiers: `medium`, `large`, `enterprise`. Changing the tier may trigger roster expansion or contraction to match the new tier's archetype template. If the tier is being upgraded, this behaves like `scope expand`; if downgraded, like `scope contract`.

## Examples

```
season new "Add OAuth2 login with Google and GitHub providers"
season list
season use oauth2-login
season archive oauth2-login
season restore oauth2-login
season set-tier oauth2-login enterprise
```

## Error Cases

| Scenario | Behavior |
|---|---|
| Description too short | Error: provide a meaningful description (minimum 10 characters) |
| Slug collision | Error: season with this slug already exists |
| Unknown slug | Error: season not found |
| Archive an archived season | Warning: already archived (no-op) |
| Restore with missing archetypes | Error: list missing roles, suggest `scope contract` or manual `character add` |
| Invalid tier | Error: list valid tiers |
