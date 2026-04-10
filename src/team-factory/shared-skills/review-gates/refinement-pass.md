# Refinement Pass Gate

## Owner

**Leslie Winkle** — refinement-builder

## Type

Pass/fail

## Trigger

This gate runs only after all 6 parallel gates (Architecture, Code, QA, Security, Adversarial, UI Functionality) have passed. It does not execute if any parallel gate is still pending or has failed.

## Focus Areas

- Final integration check after all parallel gate feedback has been addressed
- Clean build verification — the merged result compiles and bundles without errors or warnings
- Full test suite execution — all unit, integration, and end-to-end tests pass
- Task acceptance criteria validation — the original task requirements are fully met by the submission

## Pass Criteria

A submission passes the refinement pass when:

- The project builds cleanly with no errors and no new warnings introduced by the submission.
- All tests pass — unit, integration, and end-to-end. No tests are skipped, disabled, or marked as expected-failure as a result of the submission.
- The original task's acceptance criteria are met. Every requirement listed in the task description is addressed by the submitted changes.
- Changes introduced during the parallel gate review cycle (in response to gate feedback) have not introduced new issues or regressions.
- The final diff is internally consistent — no contradictory changes, no partial implementations, and no TODO markers for work that should have been completed.

## Fail Signals

A submission fails the refinement pass when any of the following are detected:

- **Build failures**: The project does not compile, bundle, or otherwise build successfully after the changes are applied.
- **Test failures**: One or more tests fail, or tests have been disabled/skipped to hide failures.
- **Unmet acceptance criteria**: The task description specifies requirements that are not addressed or only partially addressed by the submission.
- **Integration issues**: Changes that passed individual gate reviews conflict with each other when combined, producing errors that were not visible in isolation.
- **Incomplete revisions**: Feedback from parallel gates was only partially addressed — some findings were fixed while others were ignored or deferred without justification.

## Escalation Rules

- On fail, the submission bounces back to the original assignee with specific refinement findings, including build logs, failing test output, or unmet criteria references.
- The assignee addresses the findings and resubmits. The refinement pass re-runs after the resubmission (parallel gates do not re-run unless the changes are substantial enough to warrant it).
- If this gate fails 5 times on the same submission, the issue escalates to the Counselor for mediation.

## Example Scenarios

### Pass

A developer submits a new API endpoint. During the parallel gates, the architecture review requested a dependency inversion, the code review requested better naming, and the security review requested input sanitization. The developer addressed all three and resubmitted. The refinement pass verifies: the project builds cleanly, all 247 tests pass, the endpoint meets every acceptance criterion from the task, and the revisions are internally consistent. The refinement pass passes.

### Fail — Build Failure

A developer addresses feedback from the code review by extracting a shared utility, but introduces a missing import in one of the consuming modules. The project fails to build. The refinement pass fails, pointing to the build error and the specific file.

### Fail — Unmet Acceptance Criteria

A task requires three new CLI commands: `init`, `sync`, and `status`. The submission implements `init` and `sync` but the `status` command is absent. The refinement pass fails, listing the unmet requirement.

### Fail — Integration Conflict

During parallel reviews, the developer added input validation (per security review) and refactored the function signature (per code review). The validation code references the old parameter name. The build passes but a test fails due to the mismatch. The refinement pass fails, identifying the inconsistency between the two revisions.
