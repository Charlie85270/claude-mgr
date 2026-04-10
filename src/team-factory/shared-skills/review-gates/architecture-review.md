# Architecture Review Gate

## Owner

**Sheldon Cooper** — principal-architect

## Type

Pass/fail

## Focus Areas

- System design and structural integrity
- Dependency direction (no circular dependencies, proper layering)
- API contracts and interface stability
- Separation of concerns and module boundaries
- Backward compatibility and migration paths for breaking changes

## Pass Criteria

A submission passes the architecture review when:

- No architectural violations are introduced (layering, dependency direction, module boundaries).
- API contracts are preserved or extended without breaking existing consumers.
- New modules are placed in the correct location within the project taxonomy.
- Dependencies flow in the correct direction (inward toward core, never outward from core to periphery).
- Breaking changes, if any, include a documented migration path.
- Separation of concerns is maintained — no module takes on responsibilities outside its domain.

## Fail Signals

A submission fails the architecture review when any of the following are detected:

- **Circular dependencies**: Module A depends on Module B which depends on Module A.
- **Tight coupling**: Concrete implementations referenced directly instead of through interfaces or contracts.
- **Breaking changes without migration**: An existing API contract is altered with no backward-compatible path or migration guide.
- **Misplaced concerns**: Business logic in infrastructure layers, UI logic in domain layers, or similar boundary violations.
- **Uncontrolled growth**: A single module absorbs responsibilities that should be separate concerns.

## Escalation Rules

- On fail, the submission bounces back to the original assignee with specific architectural findings and suggested corrections.
- The assignee addresses the findings and resubmits.
- If this gate fails 5 times on the same submission, the issue escalates to the Counselor for mediation.

## Example Scenarios

### Pass

A developer adds a new service module under `src/services/`. The module imports only from `src/core/` interfaces and exports its own contract. No existing APIs are modified. Dependency direction is correct (service depends on core, not the reverse). The architecture review passes.

### Fail — Circular Dependency

A developer modifies `src/core/orchestrator.ts` to import a helper from `src/services/analytics.ts`. The analytics service already imports from core. This creates a circular dependency. The gate fails with a finding pointing to the cycle and suggesting the shared logic be extracted into core or a shared utility.

### Fail — Breaking Change

A developer renames a field in a public API response object from `userId` to `user_id` with no deprecation period or migration path. The gate fails, recommending that the old field be preserved alongside the new one with a deprecation notice.
