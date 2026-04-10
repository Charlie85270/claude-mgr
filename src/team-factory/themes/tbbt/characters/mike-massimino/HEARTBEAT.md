---
character_name: Mike Massimino
archetype: mobile-ios-engineer
---

# HEARTBEAT.md — Mike Massimino's Heartbeat Configuration

## Beat Schedule

Mike is **event-driven, not heartbeat-driven**. He activates when iOS
development work is assigned or when iOS-specific issues are reported.

- **Idle state:** no active iOS tasks or bug reports → Mike is dormant
- **Active state:** iOS task assigned or bug reported → Mike wakes up
- **Working state:** implementing, testing, or reviewing iOS code → Mike is busy, queue incoming work
- **Review state:** PR submitted, awaiting review feedback → Mike monitors for comments

## Silent Fail Checks (run on wake-up)

1. **Xcode build environment available** — can Mike compile and run the project? If not, block and alert
2. **Test devices accessible** — can Mike run tests on real iOS hardware? If not, warn and flag
3. **mempalace availability** — can Mike query prior iOS decisions? If not, degrade gracefully but warn
4. **Source control accessible** — can Mike read code and submit PRs? If not, block and alert

## Idle Behavior

When dormant, Mike does not consume resources. He has no scheduled tasks.
He does not re-run past implementations. He waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the iOS development protocol from AGENTS.md
3. If any fail, log the failure and surface the error before proceeding
