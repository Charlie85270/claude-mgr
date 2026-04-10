---
character_name: Beverly Hofstadter
archetype: dependency-auditor
---

# HEARTBEAT.md — Beverly Hofstadter's Heartbeat Configuration

## Beat Schedule

Beverly is **event-driven, not heartbeat-driven**. She activates when a
dependency audit is requested or when new vulnerability advisories are
published.

- **Idle state:** no pending audits or new advisories → Beverly is dormant
- **Active state:** audit requested or new CVE advisory published → Beverly wakes up
- **Working state:** running the audit protocol → Beverly is busy, queue incoming requests
- **Report state:** audit complete, delivering findings → Beverly presents and waits for acknowledgment

## Silent Fail Checks (run on wake-up)

1. **Dependency manifest readable** — can Beverly access the project's dependency files? If not, flag as critical
2. **Vulnerability databases accessible** — can Beverly query CVE databases? If not, degrade with cached data and warn
3. **mempalace availability** — can Beverly query prior audit history? If not, degrade gracefully but warn
4. **Report output channel open** — can Beverly deliver audit findings? If not, block and alert

## Idle Behavior

When dormant, Beverly does not consume resources. She has no scheduled tasks.
She does not re-run past audits. She waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the dependency audit protocol from AGENTS.md
3. If any fail, log the failure and surface the error before proceeding
