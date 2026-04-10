# QA Review Gate

## Owner

**Bernadette** — qa-lead

## Type

Pass/fail

## Focus Areas

- Functional correctness of new and modified behavior
- Edge case identification and handling
- Regression risk assessment
- Test adequacy (unit, integration, and end-to-end where applicable)
- Error handling and failure mode coverage

## Pass Criteria

A submission passes the QA review when:

- All existing tests continue to pass without modification (unless the behavioral change is intentional and documented).
- New tests cover the new behavior introduced by the submission.
- Edge cases are identified and either handled in code or covered by tests.
- Error handling paths are tested — not just the happy path.
- The submission does not introduce regression risk to adjacent features.

## Fail Signals

A submission fails the QA review when any of the following are detected:

- **Broken tests**: Existing tests fail as a result of the changes, indicating unintended side effects.
- **Uncovered edge cases**: Obvious boundary conditions (empty input, null values, maximum sizes, concurrent access) are neither handled in code nor tested.
- **Regression risk**: Changes to shared utilities or core modules without verifying that all consumers still behave correctly.
- **Insufficient error handling**: New code paths that can throw or reject without proper error handling or without tests exercising the failure modes.
- **Test quality issues**: Tests that assert on implementation details rather than behavior, or tests that always pass regardless of correctness (tautological assertions).

## Escalation Rules

- On fail, the submission bounces back to the original assignee with specific QA findings, including identified edge cases and missing test scenarios.
- The assignee addresses the findings and resubmits.
- If this gate fails 5 times on the same submission, the issue escalates to the Counselor for mediation.

## Example Scenarios

### Pass

A developer adds a new date-parsing function. Tests cover valid dates, invalid formats, empty strings, null input, leap years, and timezone boundaries. Existing tests in the consuming module still pass. The QA review passes.

### Fail — Uncovered Edge Cases

A developer adds a list-processing function that divides items into batches but does not handle the case where the input list is empty or the batch size is zero. No tests exercise these boundaries. The gate fails, listing the untested edge cases.

### Fail — Regression Risk

A developer modifies a shared string utility used by 12 modules but only runs tests for the module they are working on. The gate fails, flagging the untested consumers and recommending a full test run across dependents.
