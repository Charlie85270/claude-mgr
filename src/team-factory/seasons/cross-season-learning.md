# Cross-Season Learning

## Purpose

While seasons are isolated at the workspace level, certain knowledge is designed to flow across season boundaries. This document defines what is shared, what is not, and how a new season benefits from prior ones.

## Shared Across Seasons

| Resource | Mechanism |
|---|---|
| Advisory board consultations | All seasons query the same advisory board (read-only) |
| Mempalace private wing | The user's personal learnings persist across seasons and are always accessible |
| KB interface | All seasons query the same knowledge base; learnings captured in prior seasons are available via knowledge-retrieval |
| Approved skills | Skills that have been promoted through the review process are available to all seasons |

## NOT Shared Across Seasons

| Resource | Reason |
|---|---|
| COMMITMENTS.md | Per-character, per-season; commitments are contextual to the work at hand |
| MEMORY.md | Per-character, per-season; session memory does not carry over |
| Workspace files | Each season has its own git workspace; files do not bleed between seasons |
| Worktrees | Git worktrees are attached to a single season's workspace |
| In-flight review gates | Gate state (pass/fail, bounce counter) belongs to the season where the work was submitted |
| Pending skill candidates | Skill candidates remain season-local until explicitly promoted to approved status |

## How a New Season Benefits from Prior Seasons

1. **Knowledge-retrieval queries** — When an agent queries the KB, results include learnings captured during previous seasons. The knowledge base spans all seasons by design.
2. **Approved skills are pre-loaded** — Any skill that was promoted to approved status in an earlier season is automatically available in the new season's skill registry.
3. **Review rules persist** — Quality gate rules, rating thresholds, and bounce-counter policies are global configuration, not season-scoped. Improvements to the review process carry forward.
