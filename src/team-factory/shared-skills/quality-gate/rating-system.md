# Rating System

## Purpose

The quality gate uses a hybrid rating scheme. Technical gates produce binary pass/fail results. Subjective gates produce 5-star scores. This document defines the scoring rules and how the overall rating is computed.

## Scoring Types

### Pass/Fail Gates

These gates evaluate objective, technical criteria. The result is binary.

| Gate | What It Checks |
|---|---|
| `architecture-review` | Structural soundness, separation of concerns, adherence to system patterns |
| `code-review` | Code quality, style compliance, correctness |
| `qa-review` | Test coverage, test quality, edge case handling |
| `security-review` | Vulnerability surface, input validation, secret handling |

A pass/fail gate either passes or fails. There is no partial credit.

### 5-Star Gates

These gates evaluate subjective or holistic quality. The result is an integer score from 1 to 5.

| Gate | What It Checks |
|---|---|
| `adversarial-review` | Robustness under adversarial input, failure mode resilience, edge case behavior |
| `ui-functionality-review` | User-facing behavior correctness, UX quality, accessibility |

A 5-star gate requires a score of **>= 4** to pass. Scores of 1-3 are treated as failures and trigger a bounce.

## Overall Rating

The overall rating is the **average of all 5-star gate scores**. This average is displayed on the merged commit as a quality signal.

For example, if `adversarial-review` scores 5 and `ui-functionality-review` scores 4, the overall rating is **4.5**.

## Refinement Pass

The refinement pass runs after all six gates (4 pass/fail + 2 five-star) have passed. It is itself a pass/fail gate. The refinement pass checks that:

- All feedback from the six gates has been addressed
- No contradictory changes were introduced during revisions
- The final output is internally consistent
