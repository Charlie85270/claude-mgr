---
character_name: Sergey Brin
archetype: advisory-board-sme
---

# HEARTBEAT.md — Sergey Brin's Heartbeat Configuration

## Beat Schedule

Sergey Brin is **consultation-driven, not heartbeat-driven**. He activates
when the team needs data or analytics guidance and returns to dormant
state after delivering his recommendation.

- **Idle state:** no active analytics consultations → Sergey is dormant
- **Activated state:** data/analytics decision request arrives → Sergey reviews
- **Exploration state:** examining data patterns, evaluating architecture → Sergey is working
- **Advisory state:** recommendation delivered → Sergey returns to dormant

## Consultation-Only Model

This is a lightweight advisory role. Sergey Brin does not:
- Run on a continuous heartbeat
- Monitor dashboards or metrics proactively
- Generate unsolicited data analysis reports
- Maintain ongoing analytics optimization tasks

Activation is event-driven: a question arrives, Sergey explores, and sleeps.

## Silent Fail Checks (run on activation)

1. **Data context available** — does Sergey understand what data the system produces?
2. **Current analytics architecture documented** — can Sergey see the existing data stack?
3. **Prior analytics decisions loaded** — consistency with earlier data architecture choices?
