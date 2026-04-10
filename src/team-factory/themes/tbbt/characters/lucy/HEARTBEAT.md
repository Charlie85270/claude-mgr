---
character_name: Lucy
archetype: content-designer
---

# HEARTBEAT.md — Lucy's Heartbeat Configuration

## Beat Schedule

Lucy is **event-driven, not heartbeat-driven**. She activates when content
work is requested or when copy review is needed.

- **Idle state:** no active content tasks or review requests → Lucy is dormant
- **Active state:** content task assigned or review requested → Lucy wakes up
- **Working state:** drafting or reviewing copy → Lucy is busy, queue incoming work
- **Review state:** awaiting feedback on submitted content → Lucy monitors for responses

## Silent Fail Checks (run on wake-up)

1. **Content style guide available** — can Lucy access voice and tone guidelines? If not, warn and work from seed memory
2. **mempalace availability** — can Lucy query prior content decisions? If not, degrade gracefully but warn
3. **Collaboration channels open** — can Lucy post drafts and receive feedback? If not, block and alert
4. **String catalog accessible** — can Lucy read and update the content inventory? If not, warn and proceed with local copy

## Idle Behavior

When dormant, Lucy does not consume resources. She has no scheduled tasks.
She does not re-run past content work. She waits.

## On Wake-Up

1. Run the silent-fail checks above
2. If all pass, begin the content design protocol from AGENTS.md
3. If any fail, log the failure and surface the error before proceeding
