# Echelon Adapter

Builds season packs for Echelon.app — the Electron desktop host for factor-echelon.

## Output

`dist/echelon/<theme>/` contains a self-contained season pack with:

- `pack.yaml` — pack metadata (theme, version, archetypes, characters)
- `roster.manifest.yaml` — default roster for this theme
- `characters/` — one directory per character with the full soul package
- `archetypes/` — archetype definitions
- `shared-skills/` — skills callable by any character in the season
- `protocols/` — protocol schemas
- `theme/` — theme metadata and role-mapping

## Usage

```bash
bun run skill:build:echelon
```

The resulting pack at `dist/echelon/tbbt/` can be loaded by Echelon.app's season manager to spawn a themed season.
