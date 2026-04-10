# Placement A — Skill Promotion

## Purpose

Determines whether a pending skill is promoted to approved status. Skill promotion is a one-way door: once approved, a skill enters the shared registry and becomes available to all agents. The Counselor applies the most conservative consensus rule here to prevent premature or low-quality skills from polluting the shared skill surface.

## Trigger

A character discovers a reusable skill candidate and requests promotion from `pending` to `approved`. The request is routed to the Counselor rather than handled by a single reviewer.

## Consensus

- **Algorithm**: `min-score`
- **Threshold**: all 4 models must rate >= 4
- **Models required**: 4

All four council members must independently score the skill at 4 or above. A single low score blocks promotion.

## Prompt Template

The convener assembles the following context for each model:

- **Skill definition**: the full skill spec (name, description, inputs, outputs, dependencies).
- **Usage examples**: concrete invocations showing the skill in action.
- **Risk assessment**: potential failure modes, scope creep concerns, overlap with existing skills.

Each model is asked to return a numeric score (1-5) and a written rationale.

## Output

- **approve**: skill is promoted from `pending` to `approved` in the skill registry. The verdict is recorded in the mempalace `counselor-verdicts` hall.
- **reject**: skill stays in `pending` status. Each model's rationale is attached as notes for the requesting character to address before re-submission.
