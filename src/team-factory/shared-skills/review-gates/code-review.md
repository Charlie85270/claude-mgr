# Code Review Gate

## Owner

**Alex Jensen** — code-reviewer

## Type

Pass/fail

## Focus Areas

- Code quality and readability
- Naming conventions (variables, functions, files, modules)
- DRY principle adherence (no unnecessary duplication)
- Test coverage for new and modified logic
- Dead code elimination
- Consistency with existing codebase patterns

## Pass Criteria

A submission passes the code review when:

- Code is clean, readable, and follows the project's established style conventions.
- Names are meaningful and self-documenting — a reader can understand intent without excessive comments.
- No significant code duplication is introduced; shared logic is extracted into reusable units.
- New logic has adequate test coverage; modified logic has updated tests where behavior changed.
- No dead code is introduced (unused imports, unreachable branches, commented-out blocks).
- The code is consistent with patterns already established in the codebase.

## Fail Signals

A submission fails the code review when any of the following are detected:

- **Code duplication**: The same logic appears in multiple places instead of being extracted into a shared function or module.
- **Poor naming**: Variables named `x`, `temp`, `data2`, or functions whose names do not describe their behavior.
- **Missing tests**: New logic paths are introduced without corresponding test coverage.
- **Dead code**: Unused imports, unreachable code paths, or commented-out code blocks left in the submission.
- **Style violations**: Inconsistent formatting, naming conventions, or patterns that deviate from the rest of the codebase without justification.
- **Overly complex logic**: Deeply nested conditionals, excessively long functions, or clever code that sacrifices readability.

## Escalation Rules

- On fail, the submission bounces back to the original assignee with specific code quality findings and line-level suggestions.
- The assignee addresses the findings and resubmits.
- If this gate fails 5 times on the same submission, the issue escalates to the Counselor for mediation.

## Example Scenarios

### Pass

A developer adds a new utility function with a clear name (`parseConfigFromEnv`), includes unit tests covering the happy path and two error cases, and reuses an existing validation helper rather than duplicating its logic. The code review passes.

### Fail — Code Duplication

A developer adds input validation logic in a new handler that is nearly identical to validation already present in two other handlers. The gate fails, recommending extraction of the shared validation into a common utility.

### Fail — Missing Tests

A developer adds a new conditional branch in a parser that handles a previously unsupported format, but no tests exercise this new branch. The gate fails, requesting test coverage for the new behavior.
