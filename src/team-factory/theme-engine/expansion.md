# Theme Expansion — Runtime Tag Matching

## Overview

Bundled themes can declare **expansion packs** — secondary themes that extend the character pool of a primary theme. When the primary theme lacks a mapping for a required archetype, the theme engine searches compatible expansions at runtime.

## How Expansion Packs Are Registered

An expansion pack is a standard theme directory (with its own `role-mapping.yaml`) that declares a relationship to a parent theme:

```yaml
# themes/young-sheldon/role-mapping.yaml
meta:
  theme: young-sheldon
  display_name: "Young Sheldon"
  universe: "Young Sheldon (TV Series)"
  expansion_of: tbbt
  tags: [tbbt, big-bang-theory, cooper-family, east-texas]
```

The `expansion_of` field creates an explicit parent-child link. The `tags` field enables fuzzy matching when the relationship is less direct.

## Runtime Tag Matching Algorithm

When an archetype has no mapping in the active theme, the engine searches for an expansion:

### Step 1: Exact Parent Match

Search all registered themes for `meta.expansion_of == <active-theme>`.

- If exactly one expansion is found, use it.
- If multiple expansions match, proceed to tag ranking.

### Step 2: Tag Ranking

When multiple candidate expansions exist, rank them by tag overlap:

1. Collect the active theme's `meta.tags`.
2. For each candidate expansion, count the number of shared tags.
3. The candidate with the highest overlap wins.
4. Ties are broken by alphabetical order of `meta.theme` (deterministic, if arbitrary).

### Step 3: Archetype Lookup in Expansion

Once the best expansion is selected, look up the archetype in its `roles` map:

- If found, return the character assignment.
- If not found, try the next-ranked expansion (if any).
- If no expansion provides a mapping, fall back to the generic identity (see `mapping.md`).

## Bundled Expansion Chains

The current bundled themes and their expansion relationships:

```
tbbt (primary)
  └── young-sheldon (expansion)
```

TBBT covers the core ~33 archetypes. Young Sheldon provides characters for the remaining ~10 archetypes that are typically only needed at enterprise tier.

### Character Universe Blending

When a character comes from an expansion pack, the agent's persona blends both universes:

- **Primary tone**: The active theme's overall tone (e.g., TBBT's Caltech-nerd humor).
- **Character identity**: The expansion character's personality and mannerisms.
- **Context awareness**: The character acknowledges both universes naturally. For example, a Young Sheldon character operating in a TBBT-themed project might reference both East Texas and Pasadena.

## Adding New Expansion Packs

To register a new expansion pack:

1. Create a new directory under `themes/`.
2. Add a `role-mapping.yaml` with the `meta.expansion_of` field pointing to the parent theme.
3. Map any archetypes not covered by the parent theme.
4. The theme engine discovers expansion packs automatically at startup by scanning all theme directories.

No code changes are required — the system is data-driven.
