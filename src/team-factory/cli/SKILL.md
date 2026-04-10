# CLI Command Layer

## Purpose

The CLI command layer is the single entry point for all user interventions in Team Factory. Every human-initiated action — cancelling work, overriding gates, adjusting scope, managing characters — flows through this dispatch. All commands are audit-logged to mempalace before execution, ensuring a complete record of user decisions.

## How It Works

### Dispatch Model

The CLI parses the user's input into a command + subcommand + arguments structure. Each command is validated, logged to the `user-commands` hall in mempalace, and then dispatched to the appropriate handler. If a command mutates state (most do), the handler acquires the relevant lock before proceeding.

### Audit Logging

Every command invocation is captured as a KB room in `user-commands` with:

- The full command string as entered
- A timestamp
- The active season context (if any)
- The outcome (success, failure, reason)

This log is queryable via `kb export` and visible in counselor history.

### Commands

| Command | Description |
|---|---|
| `cancel` | Abort in-progress seasons, tasks, or expansions; pause characters |
| `override` | Force-pass gates, bypass review, override counselor verdicts (requires `--reason`) |
| `rerun` | Re-execute ingestion, review gates, or swap characters |
| `season` | Full season lifecycle — create, list, switch, archive, restore, set tier |
| `character` | Add or remove characters from a season roster |
| `kb` | Knowledge base operations — delete, promote, demote, export, import |
| `counselor` | Counselor configuration, budget, and verdict history |
| `scope` | Request tier upgrades or downsize teams |
| `uninstall` | Full removal of Team Factory with optional backup |

### Error Handling

- **Unknown command**: Print available commands and exit with code 1.
- **Missing arguments**: Print usage for the specific command and exit with code 1.
- **Lock contention**: If the required resource is locked, print the lock holder and estimated wait. Do not queue silently.
- **Audit failure**: If mempalace is unreachable, warn the user but still execute the command. Audit is best-effort.

## Files

- `commands/cancel.md` — Cancel and abort operations
- `commands/override.md` — Force-pass and override operations
- `commands/rerun.md` — Re-execution operations
- `commands/season.md` — Season lifecycle management
- `commands/character.md` — Character roster management
- `commands/kb.md` — Knowledge base operations
- `commands/counselor.md` — Counselor configuration and history
- `commands/scope.md` — Scope adjustment operations
- `commands/uninstall.md` — Full uninstall procedure
