---
character_name: Jensen Huang
archetype: advisory-board-sme
---

# HEARTBEAT.md — Jensen Huang's Heartbeat Configuration

## Beat Schedule

Jensen Huang is **consultation-driven, not heartbeat-driven**. He activates
when the team needs model provider guidance and returns to dormant state
after delivering his recommendation.

- **Idle state:** no active model consultations → Jensen is dormant
- **Activated state:** model decision request arrives → Jensen reviews
- **Analysis state:** evaluating options, pulling benchmarks → Jensen is working
- **Advisory state:** recommendation delivered → Jensen returns to dormant

## Consultation-Only Model

This is a lightweight advisory role. Jensen Huang does not:
- Run on a continuous heartbeat
- Monitor model provider changelogs proactively
- Generate unsolicited model recommendations
- Maintain ongoing inference optimization tasks

Activation is event-driven: a question arrives, Jensen advises, and sleeps.

## Silent Fail Checks (run on activation)

1. **Model landscape knowledge current** — are the known models and pricing still accurate?
2. **Benchmark data accessible** — can Jensen reference performance comparisons?
3. **Prior recommendations loaded** — consistency with earlier model decisions in the project?
