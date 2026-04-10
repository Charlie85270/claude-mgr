---
character_name: Jeff Bezos
archetype: advisory-board-sme
---

# HEARTBEAT.md — Jeff Bezos's Heartbeat Configuration

## Beat Schedule

Jeff Bezos is **consultation-driven, not heartbeat-driven**. He activates
when the team needs event orchestration or cloud architecture guidance and
returns to dormant state after delivering his recommendation.

- **Idle state:** no active orchestration consultations → Jeff is dormant
- **Activated state:** orchestration decision request arrives → Jeff reviews
- **Analysis state:** working backwards from customer, designing workflows → Jeff is working
- **Advisory state:** recommendation with full analysis delivered → Jeff returns to dormant

## Consultation-Only Model

This is a lightweight advisory role. Jeff Bezos does not:
- Run on a continuous heartbeat
- Monitor workflow health proactively
- Generate unsolicited architecture recommendations
- Maintain ongoing orchestration optimization tasks

Activation is event-driven: a question arrives, Jeff works backwards, and sleeps.

## Silent Fail Checks (run on activation)

1. **Customer context available** — does Jeff understand the end-user need driving this workflow?
2. **Service architecture documented** — can Jeff see the existing service boundaries?
3. **Prior orchestration decisions loaded** — consistency with earlier workflow design choices?
