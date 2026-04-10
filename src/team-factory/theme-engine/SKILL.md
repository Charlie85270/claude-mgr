# Theme Engine

## Purpose

The Theme Engine maps functional archetypes to themed character identities. Every agent in the system has a dual identity: its **archetype** (what it does) and its **character** (who it is). The theme engine manages this mapping.

## How It Works

### Archetype-to-Character Mapping

Each theme provides a `role-mapping.yaml` file that maps archetypes to characters from that theme's universe. When the roster composer finalizes the team, the theme engine looks up each archetype in the active theme's mapping and assigns the corresponding character.

Example: In the TBBT theme, `principal-architect` maps to `sheldon-cooper`. The agent receives Sheldon's persona, speech patterns, and behavioral quirks — while retaining the full technical capability of the principal-architect archetype.

### Theme Selection

- The user selects a theme at project initialization.
- If no theme is selected, the system defaults to `tbbt` (The Big Bang Theory).
- The theme can be changed mid-project, though this re-assigns all character identities.

### Expansion Fallback

Not every theme covers all 43 archetypes. When an archetype is needed but the active theme has no mapping for it, the theme engine uses an **expansion fallback**:

1. Check if the active theme has a registered expansion pack (e.g., TBBT expands to Young Sheldon).
2. Look up the archetype in the expansion pack's `role-mapping.yaml`.
3. If found, assign the expansion character. The agent's persona blends the expansion theme's universe with the primary theme's tone.
4. If no expansion mapping exists either, fall back to a generic identity: the archetype name is used as-is with a neutral persona.

### Character Consistency

Once a character is assigned to an archetype, that assignment is stable for the life of the project. The theme engine does not re-roll characters between sprints. If a split trigger creates multiple instances of an archetype, each instance receives the same character identity but with a numeric suffix (e.g., `sheldon-cooper-01`, `sheldon-cooper-02`).

## Files

- `mapping.md` — Structure and assignment logic for `role-mapping.yaml`
- `expansion.md` — Runtime tag-matching for bundled expansion themes
- `synthesis.md` — Custom theme synthesis (deferred to v1)
