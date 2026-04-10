# Step 1: Platform Prerequisites

## Purpose

Validates that the local environment meets the minimum requirements to run factor-echelon. This is the first OOBE step and must pass before any other setup proceeds.

## How It Works

### Checks

The following checks are performed in order:

1. **Git installed** — verifies `git --version` returns a version ≥ 2.30. Required for KB git mirror, season archival, and version tracking.
2. **Bun installed** — verifies `bun --version` returns a version ≥ 1.0. Required as the JavaScript runtime for all factor-echelon tooling.
3. **Disk space** — verifies at least 1 GB of free disk space on the volume containing the factor-echelon root directory. Required for the knowledge base, advisory board soul packages, and season workspaces.
4. **Network connectivity** — verifies that a lightweight HTTP request to a known endpoint succeeds. Required for API key validation (step 4) and optional channel configuration (step 8). A warning (not a failure) is issued if the network is unreachable, since some steps can function offline.

### Inputs

None. All checks rely on the local environment.

### Outputs

- A `prereqs` object recording each check's result (tool name, version found, pass/fail).
- Stored in `.oobe-state` under the step's completion record for diagnostic reference.

### Dependencies

None. This step has no dependencies on other steps or external services.

## Step Properties

| Property  | Value     |
|-----------|-----------|
| Required  | Yes       |
| Skippable | No        |
| Retryable | Yes       |
| Blocking  | Yes — all subsequent steps depend on a passing result |
