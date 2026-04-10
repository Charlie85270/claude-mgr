---
name: factor-echelon
description: Generates themed AI agent software development teams per project. Drop in a PRD, pick a theme, get a live team ready to build.
---

# factor-echelon

This is the root skill entrypoint for factor-echelon. When a user invokes
the skill (e.g., via `/factor-echelon init` in Claude Code), execution begins
here.

## Initial flow

1. If this is a first-time install, run the OOBE state machine
   (see `oobe/SKILL.md` — added in Plan 7)
2. If already initialized, show available commands:
   - `season new <description>` — spawn a new season
   - `season list` — show active seasons
   - `season archive <slug>` — archive a completed season
3. For season spawn, route to Penny (Ingestion PM) in
   `themes/<active-theme>/characters/penny/`

## Core concepts

- **Seasons** — isolated per-project teams
- **Archetypes** — role blueprints (Ingestion PM, Architect, etc.)
- **Themes** — character casts (TBBT, Star Wars, etc.)
- **Characters** — themed personas with full soul packages
- **Advisory Board** — cross-season specialist SMEs
- **Counselor** — multi-model review council

See `docs/specs/2026-04-08-factor-echelon-design.md` for the full specification.
