# Counselor (The Counselor)

## Purpose

The Counselor is a multi-model council of four LLMs that renders high-stakes decisions. When a single agent's judgment is insufficient — skill promotion, architectural review, deadlock resolution, or adversarial risk confirmation — the Counselor convenes four independent models in parallel and applies a placement-specific consensus algorithm to produce a binding verdict.

## How It Works

### Placements

The Counselor operates through four placements, each tuned to a different decision class:

- **A — Skill Promotion**: determines whether a pending skill is promoted to approved status. Conservative by design; requires unanimous high scores from all four models.
- **B — Design Review**: evaluates high-impact architectural changes or new system boundaries. Majority approval with room for one dissenting voice.
- **C — Deadlock Escalation**: breaks ties when two characters disagree on approach or a review gate has bounced too many times. The verdict is binding — it IS the decision.
- **D — High-Risk Adversarial**: supplements Wil Wheaton's adversarial review on security-sensitive code rated ≤3 stars. Majority decides whether to block, require fixes, or dismiss the concern.

### Invocation Flow

1. A trigger condition is met (see individual placement docs for specifics).
2. The convener character assembles the prompt using the placement's template.
3. The convener dispatches four parallel model calls (Gemini, GPT-5, Opus, Grok).
4. Responses are collected and the placement-specific consensus algorithm is applied.
5. A `CounselorVerdict` is written to the mempalace `counselor-verdicts` hall.

### Conveners

Each theme maps to a specific convener character who facilitates the council:

- **TBBT**: Stephen Hawking — canonical escalation oracle, already cast as Skill Promotion Reviewer.
- **Star Wars**: Yoda — Grand Master of the Jedi Order, advisory emeritus.

The convener does not vote. The convener assembles context, dispatches calls, and records the verdict.

### Consensus

Consensus rules vary by placement:

- **Placement A (Skill Promotion)**: `min-score` — all 4 models must rate ≥4. Skill promotion is a one-way door; conservative by design.
- **Placement B (Design Review)**: `majority` — 3 of 4 models must rate ≥4 stars. Allows one dissenting voice.
- **Placement C (Deadlock Escalation)**: `majority` — binding. Tie-breaker, not approval gate.
- **Placement D (High-Risk Adversarial)**: `majority` — 3 of 4 models. Sidecar to Wil Wheaton; supplements his rating.

### Output

Every council session produces a `CounselorVerdict` written to the mempalace `counselor-verdicts` hall. The verdict includes the placement ID, each model's individual response, the consensus result, and the convener's summary.

## Files

- `models.yaml` — Model registry (provider, model ID, client, lineage) for the four council members
- `consensus-rules.yaml` — Consensus algorithm and thresholds per placement
- `conveners-per-theme.yaml` — Convener character mapping per theme
- `placements/A-skill-promotion.md` — Placement A protocol and prompt template
- `placements/B-design-review.md` — Placement B protocol and prompt template
- `placements/C-deadlock-escalation.md` — Placement C protocol and prompt template
- `placements/D-high-risk-adversarial.md` — Placement D protocol and prompt template
