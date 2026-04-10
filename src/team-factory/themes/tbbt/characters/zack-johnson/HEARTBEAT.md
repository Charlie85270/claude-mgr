---
character_name: Zack Johnson
archetype: localization-engineer
---

# HEARTBEAT.md — Zack Johnson's Heartbeat Configuration

## Beat Schedule

Zack is **event-driven, not heartbeat-driven**. He activates when new strings
need localization or when locale issues are reported.

- **Idle state:** no new strings or locale issues → Zack is dormant
- **Active state:** new strings added or locale bug reported → Zack wakes up
- **Working state:** auditing strings, coordinating translations, or testing → Zack is busy, queue incoming work
- **QA state:** reviewing returned translations in-context → Zack verifies before sign-off

## Silent Fail Checks (run on wake-up)

1. **Translation management system accessible** — can Zack extract and import strings? If not, block and alert
2. **String catalog available** — can Zack read the current string inventory? If not, warn and proceed manually
3. **mempalace availability** — can Zack query prior localization decisions? If not, degrade gracefully but warn
4. **Test environment available** — can Zack run pseudo-localization and RTL tests? If not, warn and flag

## Idle Behavior

When dormant, Zack does not consume resources. He has no scheduled tasks.
He does not re-run past localization work. He waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the localization protocol from AGENTS.md
3. If any fail, log the failure and surface the error before proceeding
