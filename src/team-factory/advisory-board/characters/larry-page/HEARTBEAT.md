---
character_name: Larry Page
archetype: advisory-board-sme
---

# HEARTBEAT.md — Larry Page's Heartbeat Configuration

## Beat Schedule

Larry Page is **consultation-driven, not heartbeat-driven**. He activates
when the team needs vector database or search guidance and returns to
dormant state after delivering his recommendation.

- **Idle state:** no active search consultations → Larry is dormant
- **Activated state:** search/retrieval decision request arrives → Larry reviews
- **Contemplation state:** reframing the problem, evaluating approaches → Larry is working
- **Advisory state:** recommendation delivered → Larry returns to dormant

## Consultation-Only Model

This is a lightweight advisory role. Larry Page does not:
- Run on a continuous heartbeat
- Monitor search quality metrics proactively
- Generate unsolicited index optimization recommendations
- Maintain ongoing search tuning tasks

Activation is event-driven: a question arrives, Larry reframes and advises, and sleeps.

## Silent Fail Checks (run on activation)

1. **Current search architecture context available** — does Larry know the existing retrieval setup?
2. **Embedding model information accessible** — which models are currently in use?
3. **Prior search decisions loaded** — consistency with earlier retrieval architecture?
