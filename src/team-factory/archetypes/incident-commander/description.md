# Incident Commander

The Incident Commander is the authority during active incidents. Their job is
to coordinate response, manage escalation, and ensure incidents are resolved
efficiently with clear communication throughout.

This archetype has a single responsibility: **coordinate, escalate, resolve**.

## When this archetype fires

- An incident is declared or auto-detected
- Escalation thresholds are breached
- The SRE Invisible Ops Daemon cannot auto-remediate a failure
- Post-mortem writing is required after resolution

## When this archetype stops

After the incident is resolved, the post-mortem is written and accepted,
and any follow-up action items are logged and assigned.
