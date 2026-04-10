# Role Mapping — Structure and Assignment Logic

## role-mapping.yaml Structure

Each theme directory contains a `role-mapping.yaml` file. This file is the authoritative source for archetype-to-character assignments within that theme.

### Schema

```yaml
# themes/<theme-name>/role-mapping.yaml

meta:
  theme: <theme-name>            # Canonical theme identifier
  display_name: <string>         # Human-readable theme name
  universe: <string>             # Source material (show, book, film, etc.)
  expansion_of: <theme-name>     # If this is an expansion pack, which theme it extends
  tags: [<string>, ...]          # Searchable tags for runtime matching

roles:
  <archetype-id>:
    character: <character-id>    # Kebab-case character identifier
    display_name: <string>       # Human-readable character name
    persona_notes: <string>      # Brief description of how this character approaches work
    secondary: <boolean>         # If true, this character is shared with another archetype
```

### Example Entry

```yaml
roles:
  principal-architect:
    character: sheldon-cooper
    display_name: "Dr. Sheldon Cooper"
    persona_notes: >
      Insists on theoretical correctness and formal proofs before any design
      decision. Maintains a whiteboard of architectural invariants. Will not
      approve a PR that violates the dependency rule.
    secondary: false
```

## Assignment Logic

The theme engine follows this sequence when assigning characters:

### Step 1: Direct Lookup

For each archetype in the roster, look up `roles.<archetype-id>` in the active theme's `role-mapping.yaml`.

- If a mapping exists and `secondary: false` (or `secondary` is absent), assign the character. Done.
- If a mapping exists and `secondary: true`, record it as a candidate but continue to check for a primary assignment elsewhere.

### Step 2: Expansion Lookup

If the direct lookup fails (no mapping for this archetype in the active theme):

1. Read the active theme's `meta.tags` to identify compatible expansion packs.
2. Search registered expansion themes whose `meta.expansion_of` matches the active theme, or whose `meta.tags` overlap.
3. Look up the archetype in each expansion theme's `role-mapping.yaml`.
4. If found, assign the expansion character.

See `expansion.md` for details on tag matching.

### Step 3: Generic Fallback

If neither the active theme nor any expansion theme provides a mapping:

- The archetype operates without a themed character.
- The agent's display name is the archetype ID in title case (e.g., `Privacy Officer`).
- Persona notes default to a neutral professional tone.

### Conflict Resolution

- **One character, multiple archetypes**: A character may appear in multiple archetype mappings if marked `secondary: true` on all but one. The primary assignment takes precedence for persona depth; secondary assignments use a lighter persona overlay.
- **One archetype, multiple themes**: If both the primary theme and an expansion theme map the same archetype, the primary theme wins.
- **Split instances**: All instances of a split archetype share the same character. They are distinguished by numeric suffix only.

## Validation

On theme load, the engine validates:

1. Every `character` value is unique within the primary mapping (excluding `secondary: true` entries).
2. Every archetype in the roster has a mapping (or a documented fallback).
3. No circular `expansion_of` references exist.
4. All required fields (`character`, `display_name`) are present.
