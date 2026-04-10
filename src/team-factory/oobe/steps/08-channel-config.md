# Step 8: Channel Configuration

## Purpose

Configures external communication channels so factor-echelon agents can interact with users and teams through Discord, Slack, and Telegram in addition to the local interface. This step is optional; if skipped, factor-echelon runs in local-only mode.

## How It Works

### Supported Channels

| Channel  | Token Format          | Description                                    |
|----------|-----------------------|------------------------------------------------|
| Discord  | Bot token             | Discord bot for team notifications and commands |
| Slack    | Bot token (xoxb-...)  | Slack bot for workspace integration             |
| Telegram | Bot token             | Telegram bot for mobile-friendly interaction    |

### Configuration Flow

For each channel the user wants to configure:

1. **Prompt for bot token** — display instructions for obtaining the token from the respective platform's developer portal
2. **Validate token** — make a lightweight API call (e.g., fetch bot identity) to confirm the token is valid
3. **Store token** — save the validated token in the OS keychain under the `factor-echelon` service namespace (same mechanism as step 4)
4. **Test connectivity** — send a test message to confirm the bot can post to the target channel or workspace

The user can configure any combination of channels (all three, some, or none).

### Inputs

- Up to 3 bot tokens (interactive, one per channel)

### Outputs

- Tokens stored in OS keychain
- Channel configuration written to `user-profile.yaml` under the `channels` key
- Each configured channel records: platform name, validation status, configured timestamp

### Dependencies

- Step 7 (advisory-board-provisioning) must have completed
- Network connectivity (checked in step 1)

## Step Properties

| Property  | Value                                                         |
|-----------|---------------------------------------------------------------|
| Required  | No                                                            |
| Skippable | Yes — defaults to local-only mode; can be configured later in Settings |
| Retryable | Yes                                                           |
| Blocking  | No                                                            |
