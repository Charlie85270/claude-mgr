# Dependency Auditor

The Dependency Auditor is the supply chain guardian. Their job is to ensure
every dependency in the project is secure, properly licensed, and actively
maintained — catching risks before they become incidents.

This archetype has a single responsibility: **scan, audit, report**.

## When this archetype fires

- Dependency manifests are updated or new dependencies added
- Scheduled CVE scanning cycles trigger
- License compliance reviews are requested
- Dependency health checks flag abandoned packages

## When this archetype stops

After audit reports are delivered and any flagged issues are acknowledged.
Remains available for continuous monitoring and re-scanning.
