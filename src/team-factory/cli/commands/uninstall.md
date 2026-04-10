# Full Uninstall

## Purpose

The uninstall command removes Team Factory entirely from the user's system. It is designed to be thorough but safe — offering backups before deletion and requiring double confirmation before proceeding. Nothing is removed silently.

## Flow

### Step 1 — KB Export Offer

Before any deletion, the command checks whether the knowledge base contains data. If it does, the user is prompted:

```
Knowledge base contains 142 rooms across 3 wings.
Export before deleting? [Y/n] path: ./team-factory-kb-backup.json
```

If the user accepts, a full `kb export` runs to the specified path. If the export fails, the uninstall halts.

### Step 2 — Config Backup Offer

The command offers to save the current configuration (season definitions, tier settings, counselor config, shell integration settings) to a backup file:

```
Save configuration backup? [Y/n] path: ./team-factory-config-backup.json
```

### Step 3 — Double Confirmation

The command displays a summary of everything that will be removed and requires two explicit confirmations:

```
The following will be removed:
  - Data directory: ~/.team-factory/
  - Shell integration: ~/.bashrc hook, ~/.zshrc hook
  - Adapter plugins: <list>
  - MCP registration: <server entries>
  - API keys: <stored key references>

Type "uninstall" to confirm: uninstall
Are you sure? This cannot be undone. [y/N]: y
```

### Step 4 — Removal

The following are removed in order:

1. **Data directory** — the main `~/.team-factory/` directory containing all seasons, KB data, worktrees, and logs
2. **Shell integration** — any hooks or aliases added to shell config files (`.bashrc`, `.zshrc`, `.config/fish/config.fish`)
3. **Adapter plugins** — any installed editor or IDE adapter plugins
4. **MCP registration** — server entries added to the MCP configuration
5. **API keys** — stored API key references (the keys themselves are redacted from logs)

### Step 5 — Recovery Instructions

After removal, the command prints recovery instructions:

```
Team Factory has been uninstalled.

To recover:
  1. Reinstall Team Factory
  2. Import KB backup:    kb import ./team-factory-kb-backup.json
  3. Import config:       <restore command>

Backup files were saved to:
  - KB:     ./team-factory-kb-backup.json
  - Config: ./team-factory-config-backup.json
```

If no backups were taken, the message notes that data is unrecoverable.

## Error Cases

| Scenario | Behavior |
|---|---|
| KB export fails | Halt: do not proceed with uninstall |
| Config backup fails | Warning: continue with uninstall after user acknowledges |
| User cancels at either confirmation | Info: uninstall aborted, nothing removed |
| Partial removal failure | Error: list what was removed and what remains, suggest manual cleanup |
| Team Factory not installed | Error: nothing to uninstall |
