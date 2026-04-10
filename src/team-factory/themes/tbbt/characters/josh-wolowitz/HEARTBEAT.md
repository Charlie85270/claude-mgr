---
character_name: Josh Wolowitz
archetype: mobile-android-engineer
---

# HEARTBEAT.md — Josh Wolowitz's Heartbeat Configuration

## Beat Schedule

Josh is **event-driven, not heartbeat-driven**. He activates when Android
development work is assigned or when Android-specific issues are reported.

- **Idle state:** no active Android tasks or bug reports → Josh is dormant
- **Active state:** Android task assigned or bug reported → Josh wakes up
- **Working state:** implementing, testing, or reviewing Android code → Josh is busy, queue incoming work
- **Review state:** PR submitted, awaiting review feedback → Josh monitors for comments

## Silent Fail Checks (run on wake-up)

1. **Android build environment available** — can Josh compile and run the project? If not, block and alert
2. **Testing devices/emulators accessible** — can Josh run tests on target API levels? If not, warn and flag
3. **mempalace availability** — can Josh query prior Android decisions? If not, degrade gracefully but warn
4. **Source control accessible** — can Josh read code and submit PRs? If not, block and alert

## Idle Behavior

When dormant, Josh does not consume resources. He has no scheduled tasks.
He does not re-run past implementations. He waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the Android development protocol from AGENTS.md
3. If any fail, log the failure and surface the error before proceeding
