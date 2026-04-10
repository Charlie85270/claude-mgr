# Quality Gate

## Purpose

The quality gate system enforces a multi-reviewer approval process before any work is merged. It runs seven gates in a two-phase flow: six gates execute in parallel, followed by a single refinement pass. Leonard (user-handler archetype) serves as the sole merge authority.

## How It Works

### Phase 1 — Parallel Gates (6 gates)

Six gates run concurrently. Each gate evaluates a different dimension of the submitted work:

| Gate | Scoring Type | Pass Condition |
|---|---|---|
| `architecture-review` | Pass/fail | Must pass |
| `code-review` | Pass/fail | Must pass |
| `qa-review` | Pass/fail | Must pass |
| `security-review` | Pass/fail | Must pass |
| `adversarial-review` | 5-star | Score >= 4 |
| `ui-functionality-review` | 5-star | Score >= 4 |

### Phase 2 — Refinement Pass

After all six gates pass, a refinement pass runs. The refinement pass is itself pass/fail. It checks for consistency across the gate feedback and ensures all requested changes have been addressed.

### Bounce Counter

When any gate fails, the work bounces back to the originating character for revision. A bounce counter tracks the number of rejections. If the counter reaches 5, the work escalates to Counselor Placement C for multi-model review.

### Merge Authority

Leonard is the sole merge authority per season. All merges are serialized in FIFO order. Leonard reviews aggregated gate results and the overall rating before authorizing a merge.

## Files

- `rating-system.md` — Hybrid rating scheme (pass/fail and 5-star) with overall score calculation
- `bounce-counter.md` — Bounce mechanism, escalation thresholds, and counselor override rules
- `merge-authority.md` — Leonard's merge role, serialization, and post-merge knowledge capture
