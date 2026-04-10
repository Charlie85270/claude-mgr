# Step 6: Mempalace Initialization

## Purpose

Initializes the knowledge base by setting up the mempalace local storage backend, creating the directory structure, establishing the git mirror, and registering the MCP server with the target platform.

## How It Works

### Initialization Sequence

1. **Install mempalace** — if the mempalace package is not already installed, install it via bun. Verifies the installed version meets the minimum requirement.
2. **Create local store** — creates the directory tree at `<rootDir>/knowledge-base/local/` following the wing/hall/room taxonomy defined in `shared-skills/kb-interface/schema.yaml`. The initial structure includes the `private-<user-id>` wing with all standard halls.
3. **Create kb-git mirror** — initializes a git repository at `<rootDir>/knowledge-base/git-mirror/` that tracks changes to the local store. This enables version history, diff-based review of knowledge evolution, and backup/restore.
4. **Register MCP** — registers the mempalace MCP server with the user's target platform (Claude Code, Echelon.app, or OpenClaw) so that agents can access the knowledge base through the standard MCP tool interface.

### Directory Structure Created

```
<rootDir>/knowledge-base/
  local/
    private-<user-id>/
      learnings/
      patterns/
      decisions/
      reviews/
        adversarial/
        code/
        security/
      skills/
      counselor-verdicts/
  git-mirror/
    .git/
```

### Inputs

- `user_name` from `user-profile.yaml` (for wing naming)
- `kb_mode` from `user-profile.yaml` (solo for v0.1)

### Outputs

- Knowledge base directory structure on disk
- Initialized git mirror repository
- MCP server registration in the platform's configuration

### Dependencies

- Step 5 (kb-mode-selection) must have completed
- Bun runtime (validated in step 1)
- At least 1 GB disk space (validated in step 1)

## Step Properties

| Property  | Value |
|-----------|-------|
| Required  | Yes   |
| Skippable | No    |
| Retryable | Yes   |
| Blocking  | Yes   |
