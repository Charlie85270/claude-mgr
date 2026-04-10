# Merge Authority

## Purpose

Leonard (user-handler archetype) is the sole merge authority per season. This document defines the merge process, serialization rules, and post-merge behavior.

## Merge Process

### Sole Authority

Leonard is the only entity authorized to execute a merge. No gate, no agent, and no automated process may merge work without Leonard's explicit authorization.

### Serialized Merges

All merges are serialized — one at a time, in **FIFO order**. If multiple pieces of work pass all gates concurrently, they queue for merge in the order their final gate passed. There is no parallel merging.

### Pre-Merge Review

Before authorizing a merge, Leonard reviews:

| Input | Description |
|---|---|
| Aggregated gate results | Pass/fail status from all 4 technical gates and scores from both 5-star gates |
| Overall rating | The averaged 5-star score displayed on the commit |
| Refinement pass result | Pass/fail from the post-gate refinement check |
| Bounce history | Number of bounces the work went through before passing |

### Human-in-the-Loop

Leonard can **block a merge even if all gates pass**. This serves as the human-in-the-loop checkpoint. When Leonard blocks, the work is returned to the character with Leonard's feedback. This does not increment the bounce counter (it is a hold, not a gate failure).

The user may confirm or override Leonard's block decision.

## Post-Merge

After a successful merge, Leonard triggers the **knowledge-capture skill**. This skill records:

- Learnings from the review process (what gates caught, what bounced, what passed)
- Patterns observed in the work (reusable approaches, common mistakes)
- Decisions made during the review (architectural choices, trade-offs)

These learnings are captured into the KB and become available to future knowledge-retrieval queries across all seasons.
