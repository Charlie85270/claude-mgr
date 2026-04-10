# Counselor Management

## Purpose

The counselor command family configures the multi-model counselor system, monitors its cost, and queries its decision history. The counselor provides second-opinion verdicts at key decision points (escalations, ambiguous gates, architectural disputes). These commands give the user visibility and control over that process.

## Commands

### `counselor config --model <name> <version>`

Swap the model used at a specific counselor placement. The placement is inferred from the model name's registration, or can be specified explicitly with `--placement`. Valid placements correspond to the counselor placement points defined in the orchestration layer (e.g., Placement A, B, C). The new model takes effect on the next counselor invocation — in-flight verdicts are not interrupted.

### `counselor budget`

Display the current cost usage for counselor invocations. Output includes:

- Total spend across all placements
- Per-placement breakdown (placement name, model, invocation count, total cost)
- Budget cap (if configured) and remaining allowance
- Projected spend for the remainder of the active season

### `counselor history <placement>`

Query past verdicts for a given counselor placement. Output is a chronological list of verdicts, each showing:

- Verdict ID
- Timestamp
- The question or context that triggered the verdict
- The counselor's decision
- Whether it was overridden by the user (and if so, the override reason)
- Cost of the invocation

Results can be filtered with `--since <date>` and `--season <slug>`.

## Examples

```
counselor config --model claude-opus-4-0820 --placement C
counselor budget
counselor history C
counselor history B --since 2026-03-01 --season oauth2-login
```

## Error Cases

| Scenario | Behavior |
|---|---|
| Unknown model name | Error: model not recognized, list available models |
| Invalid placement | Error: unknown placement, list valid placements |
| No budget data available | Info: no counselor invocations recorded yet |
| No verdicts for placement | Info: no verdicts found for the specified placement |
| Invalid date format for `--since` | Error: expected ISO 8601 date format |
