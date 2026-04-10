# OOBE State Machine

## Purpose

Formal definition of the OOBE state machine. Describes all states, transitions, checkpoint semantics, skip rules, and error handling.

## States

There are 8 active states plus a terminal state:

| State | Name                        | Required | Description                              |
|-------|-----------------------------|----------|------------------------------------------|
| 1     | platform-prereqs            | Yes      | Validate local environment               |
| 2     | user-profile-interview      | Yes      | Collect user identity and preferences    |
| 3     | theme-selection             | Yes      | Choose the active character theme        |
| 4     | counselor-api-keys          | No       | Collect API keys for multi-model review  |
| 5     | kb-mode-selection           | Yes      | Choose solo or team KB mode              |
| 6     | mempalace-init              | Yes      | Initialize knowledge base and git mirror |
| 7     | advisory-board-provisioning | Yes      | Instantiate advisory board characters    |
| 8     | channel-config              | No       | Configure external channels              |
| —     | COMPLETE                    | —        | Terminal state; OOBE finished            |

## Transitions

The state machine is strictly linear. Each step, upon completion, transitions to the next:

```
platform-prereqs → user-profile-interview → theme-selection → counselor-api-keys
→ kb-mode-selection → mempalace-init → advisory-board-provisioning → channel-config
→ COMPLETE
```

There are no branches or conditional paths. Optional steps that are skipped still transition forward normally.

## Checkpoint Semantics

After each step completes (or is explicitly skipped), the `.oobe-state` file is updated:

```yaml
current_step: 3
completed_steps:
  - step: platform-prereqs
    completed_at: "2026-04-10T14:00:00Z"
    status: passed
  - step: user-profile-interview
    completed_at: "2026-04-10T14:02:30Z"
    status: passed
```

On resume, the state machine reads `.oobe-state`, skips all completed steps, and begins execution at the first uncompleted step. A step is considered complete only after its entry appears in `completed_steps` with a `passed` or `skipped` status.

## Skip Rules

Two steps are optional and may be skipped by the user:

- **Step 4 (counselor-api-keys)** — if skipped, the Counselor multi-model review council is disabled. Users can provide keys later via Settings. The system logs a reminder that Counselor placements require API keys.
- **Step 8 (channel-config)** — if skipped, factor-echelon runs in local-only mode (no Discord, Slack, or Telegram integration). Channels can be configured later via Settings.

All other steps (1, 2, 3, 5, 6, 7) are mandatory and cannot be skipped.

## Error Handling

- **Mandatory step failure**: halts the OOBE. The user is shown a diagnostic message and the failing step is recorded in `.oobe-state` with status `failed` and an error reason. On next invocation, the failed step is retried.
- **Optional step failure**: logs the error, records the step as `skipped` with the error reason, and continues to the next step. The user is informed that the step can be retried later in Settings.

## Force Reset

The OOBE can be restarted from scratch by running `/factor-echelon oobe --reset`. This:

1. Archives the current `.oobe-state` to `.oobe-state.bak.<timestamp>`
2. Creates a fresh `.oobe-state` with no completed steps
3. Begins execution at step 1

Force reset does not delete previously provisioned resources (knowledge base, advisory board). Those are overwritten or merged during the new run.
