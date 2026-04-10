# Knowledge Base Operations

## Purpose

The kb command family provides direct user access to the knowledge base. These commands handle destructive operations (delete), visibility changes (promote/demote), and bulk data movement (export/import). Day-to-day KB reads and writes happen automatically through skills; these commands are for administrative intervention.

## Commands

### `kb delete <room-id> --reason "..."`

Quarantine a knowledge entry. The room is not permanently deleted — it is moved to a `quarantined` subhall with the reason attached as metadata. This preserves the audit trail while removing the entry from active query results. Quarantined rooms can be restored by re-capturing them manually.

### `kb promote <room-id>`

Promote a room from a private wing to the team-shared wing. This makes the knowledge entry visible to all characters across all seasons. Only available in team mode. **Stubbed for v0.5** — the command is recognized and validated but returns a "not yet implemented" message.

### `kb demote <room-id>`

Demote a room from the team-shared wing back to the originating private wing. The room's original wing is stored in its metadata at promotion time. If the original wing cannot be determined, the command fails with an error.

### `kb export <path>`

Export the full knowledge base to the specified path as a structured JSON archive. The export includes all wings, halls, rooms, and metadata. The output file can be used for backup, migration, or external analysis. If the path already exists, the command prompts for overwrite confirmation.

### `kb import <path>`

Import a previously exported knowledge base archive. Rooms are merged with existing content — duplicates (matched by room ID) are skipped. New rooms are added to their original wings and halls. The import is atomic: if any room fails to write, the entire import is rolled back.

## Examples

```
kb delete ROOM-0099 --reason "Outdated pattern, no longer applicable"
kb promote ROOM-0055
kb demote ROOM-0055
kb export ./backup/kb-2026-04-10.json
kb import ./backup/kb-2026-04-10.json
```

## Error Cases

| Scenario | Behavior |
|---|---|
| Room not found | Error: unknown room ID |
| Delete without `--reason` | Error: reason is required for delete |
| Promote in solo mode | Error: promote requires team mode |
| Promote (v0.1-v0.4) | Info: not yet implemented, available in v0.5 |
| Demote with unknown origin | Error: original wing not recorded, cannot demote |
| Export path not writable | Error: cannot write to the specified path |
| Import file not found | Error: archive not found at path |
| Import rollback triggered | Warning: import failed, all changes rolled back |
