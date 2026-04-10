# Deploy Checklist Generator

## Purpose

After the OOBE completes, generates a personalized deploy checklist summarizing what was configured, what was skipped, and what actions remain before the user can spawn their first season. The checklist gives the user a clear picture of their installation's readiness.

## How It Works

### Generation Trigger

The checklist is generated automatically when the OOBE state machine transitions to the COMPLETE state (after step 8 completes or is skipped). It can also be regenerated on demand via `/factor-echelon checklist`.

### Checklist Sections

The generated checklist contains three sections:

1. **Configured** — lists every OOBE step that completed successfully, with a summary of what was set up:
   - Platform prerequisites: versions detected (git, bun), disk space available
   - User profile: name, timezone, role, team size
   - Theme: which theme was selected
   - Counselor API keys: which models have valid keys (if any)
   - KB mode: solo or team
   - Mempalace: local store path, git mirror path, MCP registration target
   - Advisory board: number of characters provisioned (expected: 12)
   - Channels: which channels were configured (if any)

2. **Skipped** — lists any steps that were skipped or failed with optional status, along with the impact of skipping:
   - Counselor API keys skipped: "Counselor multi-model review is disabled. Provide keys in Settings to enable it."
   - Channel config skipped: "Running in local-only mode. Configure channels in Settings to enable Discord, Slack, or Telegram integration."

3. **Before first season** — action items that must be addressed before spawning the first season:
   - If no Counselor keys: note that Counselor placements will be unavailable
   - If no channels: note that all interaction will be local-only
   - Recommend reviewing `user-profile.yaml` for accuracy
   - Suggest running `/factor-echelon health` to verify system status

### Output Format

The checklist is written to `<rootDir>/deploy-checklist.md` as a markdown file with checkbox syntax:

```markdown
# Deploy Checklist

Generated: 2026-04-10T14:05:00Z

## Configured
- [x] Platform prerequisites — git 2.44.0, bun 1.1.30, 45 GB free
- [x] User profile — Jane, America/Chicago, developer, team of 3
- [x] Theme — TBBT
- [x] KB mode — solo
- [x] Mempalace — local store initialized, git mirror active
- [x] Advisory board — 12/12 characters provisioned

## Skipped
- [ ] Counselor API keys — multi-model review disabled
- [ ] Channel config — local-only mode

## Before First Season
- [ ] Provide Counselor API keys in Settings (optional)
- [ ] Configure channels in Settings (optional)
- [ ] Review user-profile.yaml for accuracy
- [ ] Run /factor-echelon health to verify system status
```

The checklist is also displayed to the user in the OOBE completion screen.

### Inputs

- `.oobe-state` file (completed steps, timestamps, statuses)
- `user-profile.yaml` (user details for the summary)

### Outputs

- `deploy-checklist.md` written to the factor-echelon root directory
- Checklist summary displayed to the user in the OOBE completion screen

### Dependencies

- OOBE state machine must have reached the COMPLETE state
- `.oobe-state` and `user-profile.yaml` must exist on disk
