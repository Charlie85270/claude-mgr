# Step 4: Counselor API Keys

## Purpose

Collects and validates API keys for the four language models used by the Counselor multi-model review council. The Counselor dispatches code and architecture reviews to multiple models and synthesizes their verdicts, so it needs working credentials for each.

## How It Works

### Models

| Model            | Provider   | Key Format        |
|------------------|------------|-------------------|
| Gemini Pro       | Google     | `AIza...`         |
| GPT-5            | OpenAI     | `sk-...`          |
| Claude Opus 4.6  | Anthropic  | `sk-ant-...`      |
| Grok             | xAI        | `xai-...`         |

### Validation

Each key is validated with a minimal test call (a short prompt that returns a predictable token count). Validation confirms:

- The key is syntactically correct
- The key authenticates successfully
- The model responds within a reasonable timeout (10 seconds)

Keys that fail validation are reported with the specific error. The user can retry or skip the failing key.

### Storage

Valid keys are stored in the operating system's native keychain:

- **macOS**: Keychain Access
- **Linux**: libsecret / GNOME Keyring
- **Windows**: Credential Manager

Keys are never written to disk in plaintext. The `.oobe-state` file records only whether each key was provided and validated, not the key values themselves.

### Inputs

- Up to 4 API keys (interactive, one per model)

### Outputs

- Keys stored in OS keychain under the `factor-echelon` service namespace
- Validation results recorded in `.oobe-state`

### Dependencies

- Step 3 (theme-selection) must have completed
- Network connectivity (checked in step 1)

## Step Properties

| Property  | Value                                                                 |
|-----------|-----------------------------------------------------------------------|
| Required  | No                                                                    |
| Skippable | Yes — Counselor placements are disabled until keys are provided later in Settings |
| Retryable | Yes                                                                   |
| Blocking  | No                                                                    |
