# Review Gates

## Purpose

The review gate system enforces quality standards on every work submission before merge. It runs 7 gates on every PR: 6 execute in parallel, and the 7th (refinement) runs sequentially after all parallel gates pass. This ensures that no code reaches the main branch without passing architectural, code quality, QA, security, adversarial, and UI review — followed by a final integration check.

## How It Works

### Gate Execution Model

Gates are divided into two phases:

- **Phase 1 (parallel)**: Architecture, Code, QA, Security, Adversarial, UI Functionality. All 6 run concurrently. Each gate evaluates the submission independently against its focus area.
- **Phase 2 (sequential)**: Refinement. Runs only after all Phase 1 gates pass. Performs a final integration check to confirm the merged result builds, passes all tests, and meets the original task requirements.

Each gate is owned by a specific TBBT character whose archetype matches the gate's focus area.

### Gate Types

- **Pass/fail gates**: Architecture, Code, QA, Security, Refinement. Binary outcome — the submission either meets the criteria or it does not.
- **5-star rating gates**: Adversarial, UI Functionality. Produce a 1-5 rating. A rating of 4 or higher is required to pass.

### Inputs

- **Worktree diff** — the full diff of changes being submitted for review.
- **Task context** — the original task description, acceptance criteria, and any relevant plan context.
- **Character context** — the reviewing character's personality, expertise, and review style (loaded from their character sheet).

### Outputs

- **Aggregated gate results** — a structured result object containing:
  - Per-gate outcome: pass/fail or 5-star rating
  - Per-gate feedback: specific findings, suggestions, and blocking issues
  - Overall verdict: all-pass, or list of failing gates with reasons
  - Refinement result (only present if Phase 1 passed)

### Escalation Rules

When a gate fails, the submission bounces back to the original assignee with the gate's feedback. The assignee addresses the feedback and resubmits. If the same gate fails 5 times on the same submission, the issue escalates to the Counselor for mediation and resolution.

### Gate Owners

| Gate | Owner | Role |
|------|-------|------|
| Architecture Review | Sheldon Cooper | principal-architect |
| Code Review | Alex Jensen | code-reviewer |
| QA Review | Bernadette | qa-lead |
| Security Review | Barry Kripke | appsec-engineer |
| Adversarial Review | Wil Wheaton | adversarial-reviewer |
| UI Functionality Review | Emily Sweeney | ux-designer |
| Refinement Pass | Leslie Winkle | refinement-builder |

### Dependencies

- Character sheets for each gate owner must be loaded before gate execution.
- The worktree diff and task context must be available at review time.
- Phase 2 depends on all Phase 1 gates passing.

## Files

- `architecture-review.md` — Architecture review gate (Sheldon Cooper)
- `code-review.md` — Code quality review gate (Alex Jensen)
- `qa-review.md` — QA review gate (Bernadette)
- `security-review.md` — Security review gate (Barry Kripke)
- `adversarial-review.md` — Adversarial review gate (Wil Wheaton)
- `ui-functionality-review.md` — UI functionality review gate (Emily Sweeney)
- `refinement-pass.md` — Refinement pass gate (Leslie Winkle)
