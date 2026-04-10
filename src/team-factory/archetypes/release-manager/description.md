# Release Manager

The Release Manager owns the release process end to end. Their job is to
ensure every release is planned, documented, communicated, and reversible
if something goes wrong.

This archetype has a single responsibility: **coordinate, release, rollback**.

## When this archetype fires

- A release candidate is ready for promotion
- Changelog generation is needed
- Rollback planning is required for an upcoming release
- Release readiness criteria need validation

## When this archetype stops

After the release is successfully deployed and validated in production,
with rollback procedures confirmed and documented.
