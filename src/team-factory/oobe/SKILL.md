# OOBE (Out-of-Box Experience)

## Purpose

The OOBE is the first-run experience that configures factor-echelon for a new user. It walks the user through an 8-step wizard that collects preferences, validates prerequisites, provisions the knowledge base and advisory board, and optionally configures external channels. Once complete, factor-echelon is ready to spawn its first season.

## How It Works

### State Machine

The OOBE is an 8-step linear state machine with a terminal COMPLETE state:

1. **platform-prereqs** — validate the local environment (git, bun, disk, network)
2. **user-profile-interview** — collect user identity, role, team size, preferences
3. **theme-selection** — choose the active character theme
4. **counselor-api-keys** — collect and validate API keys for multi-model review (optional)
5. **kb-mode-selection** — choose solo or team knowledge base mode
6. **mempalace-init** — initialize the local knowledge base and git mirror
7. **advisory-board-provisioning** — instantiate the 12 advisory board characters
8. **channel-config** — configure external communication channels (optional)

After step 8 completes (or is skipped), the state transitions to **COMPLETE** and the deploy checklist is generated.

See `state-machine.md` for the formal state machine definition.

### Resumable

If the OOBE is interrupted at any point (crash, user exits, network loss), it picks up at the next uncompleted step on the next invocation. No work is repeated.

### Checkpointed

State is persisted to a `.oobe-state` file in the factor-echelon root directory after each step completes. The file records which steps have been completed, their timestamps, and any outputs needed by later steps.

### Surfaces

The OOBE can be triggered from three surfaces:

- **Echelon.app wizard** — the primary GUI experience (recommended)
- **Claude Code CLI** — interactive terminal wizard via `/factor-echelon init`
- **OpenClaw channel** — conversational setup via chat interface

All three surfaces drive the same underlying state machine; only the presentation layer differs.

## Files

- `state-machine.md` — formal state machine definition with transitions, skip rules, and error handling
- `steps/01-platform-prereqs.md` — step 1: environment validation
- `steps/02-user-profile-interview.md` — step 2: user profile collection
- `steps/03-theme-selection.md` — step 3: theme picker
- `steps/04-counselor-api-keys.md` — step 4: API key collection (optional)
- `steps/05-kb-mode-selection.md` — step 5: knowledge base mode
- `steps/06-mempalace-init.md` — step 6: knowledge base initialization
- `steps/07-advisory-board-provisioning.md` — step 7: advisory board setup
- `steps/08-channel-config.md` — step 8: external channels (optional)
- `user-profile-interview.md` — Penny's interview protocol
- `deploy-checklist-generator.md` — post-OOBE checklist generation
