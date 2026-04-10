# Placement C — Deadlock Escalation

## Purpose

Breaks deadlocks when the normal review process has stalled. Rather than letting bounce loops continue indefinitely, the Counselor renders a binding decision that all parties must accept. This is a tie-breaker, not an approval gate — the council picks a winner or declares neither side viable.

## Trigger

- The review gate bounce counter hits 5 (a task has been sent back and forth five times without resolution), OR
- Two characters explicitly disagree on approach and neither will yield.

## Consensus

- **Algorithm**: `majority`
- **Binding**: true — the verdict IS the decision. There is no appeal.
- **Models required**: 3

The binding flag distinguishes this placement from B and D. The council's majority vote directly determines the outcome.

## Prompt Template

The convener assembles the following context for each model:

- **Stuck task**: the task definition, current state, and why it is blocked.
- **Both sides' arguments**: each character's position, including their rationale and proposed approach.
- **Prior bounce history**: the sequence of review comments, rejections, and revisions that led to the deadlock.

Each model is asked to choose a disposition and provide a written rationale.

## Output

- **decide-for-A**: the first character's approach wins. Implementation proceeds per their proposal.
- **decide-for-B**: the second character's approach wins. Implementation proceeds per their proposal.
- **redesign**: neither side wins. The task is sent back for a fresh approach that addresses concerns raised by both parties. The council's rationale guides the redesign direction.
