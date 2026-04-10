# Placement B — Design Review

## Purpose

Evaluates high-impact architectural changes and new system boundary proposals. When a single reviewer's perspective is insufficient for a decision that affects multiple modules or introduces a new abstraction layer, the Counselor convenes the full council to assess the design from four independent vantage points.

## Trigger

- Sheldon flags an architectural change as high-impact, OR
- A character proposes a new system boundary (new module, new interface, new integration surface).

## Consensus

- **Algorithm**: `majority`
- **Threshold**: 3 of 4 models must rate >= 4 stars
- **Models required**: 3

One dissenting voice is permitted. This balances rigor with pragmatism — architectural decisions often involve reasonable tradeoffs where unanimity is unrealistic.

## Prompt Template

The convener assembles the following context for each model:

- **Design doc**: the full architectural proposal, including motivation, alternatives considered, and chosen approach.
- **Affected modules**: list of modules, interfaces, and data flows impacted by the change.
- **Migration strategy**: how existing code and data will transition to the new design, including rollback plan.

Each model is asked to return a rating (1-5 stars), a disposition, and a written rationale.

## Output

- **approve**: the design is accepted. The verdict is recorded in the mempalace `counselor-verdicts` hall.
- **approve-with-conditions**: the design is accepted contingent on specific changes. Conditions are listed in the verdict and must be addressed before implementation proceeds.
- **reject**: the design is sent back for rework. Each model's rationale is included so the proposer understands the concerns from multiple perspectives.
