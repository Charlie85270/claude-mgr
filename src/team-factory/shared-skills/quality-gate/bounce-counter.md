# Bounce Counter

## Purpose

The bounce counter tracks how many times a piece of work has been rejected by the quality gates. It governs the revision loop and determines when to escalate to a counselor.

## Mechanism

1. **Initial state** — The bounce counter starts at **0** when work is first submitted to the quality gates.
2. **Increment** — Each time any gate fails (pass/fail gate returns fail, or a 5-star gate scores below 4), the work bounces back to the originating character for revision. The counter increments by 1.
3. **Resubmission** — After revision, the character resubmits. All gates re-evaluate the updated work.

## Escalation Threshold

When the bounce counter reaches **>= 5**, the work is escalated to **Counselor Placement C** for multi-model review. The character does not receive the work back for another unassisted attempt.

### Counselor Placement C Actions

The counselor may take one of the following actions:

| Action | Description |
|---|---|
| **Override gates** | Approve the work despite gate failures. This is rare and requires explicit justification. |
| **Suggest architectural changes** | Recommend a structural redesign that addresses the root cause of repeated failures. |
| **Reassign the task** | Transfer the task to a different character better suited to the work. |

## Counter Reset

The bounce counter resets to **0** after a successful merge. Prior bounces have no carry-over effect on future submissions by the same character.
