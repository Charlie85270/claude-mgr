# Step 5: KB Mode Selection

## Purpose

Selects the knowledge base operating mode. The knowledge base can run in solo mode (single user, local storage) or team mode (shared storage with access controls). Team mode is planned for v0.5+, so in v0.1 this step confirms solo mode and sets the flag.

## How It Works

### Modes

| Mode | Availability | Description                                                  |
|------|-------------|--------------------------------------------------------------|
| Solo | v0.1+       | Single-user local knowledge base. All wings are private.     |
| Team | v0.5+       | Multi-user shared knowledge base with team-shared wing and access controls. |

### v0.1 Behavior

In v0.1, the step:

1. Informs the user that solo mode is the only available mode
2. Explains what team mode will offer when available
3. Confirms the selection (solo)
4. Writes `kb_mode: solo` to `user-profile.yaml`

The user cannot select team mode in v0.1. If team mode is requested, the step displays a message explaining the planned availability and proceeds with solo mode.

### Inputs

- User confirmation (interactive)

### Outputs

- `kb_mode` field written to `user-profile.yaml`

### Dependencies

- Step 4 (counselor-api-keys) must have completed or been skipped

## Step Properties

| Property  | Value |
|-----------|-------|
| Required  | Yes   |
| Skippable | No    |
| Retryable | Yes   |
| Blocking  | Yes   |
