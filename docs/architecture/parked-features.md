# Parked Features

Features that have been unwired from the active codebase but are preserved in
git history. They can be restored via cherry-pick or branch checkout if needed.

## Parked Items

### mcp-world/ — Generative Game Zones
MCP-backed generative world system for creating and managing game zones.
Files remain on disk but the IPC handlers are no longer registered in `main.ts`.

### src/components/PokemonGame/ — Pokemon-style Game
ClaudeMon game components (Pokemon-inspired mini-game).

### src/app/pallet-town/ — Game Route
Next.js route for the ClaudeMon / Pallet Town game page.
Nav item removed from `Sidebar.tsx`.

### skills/world-builder/ — World Builder Skill
Skill for creating and managing generative game zones via MCP tools.

### electron/handlers/world-handlers.ts — World IPC Handlers
Electron IPC handlers for world zone CRUD operations.
Import and registration removed from `electron/main.ts`.
The `world` namespace in `electron/preload.ts` is still present but inert
(no handler will respond to the invocations).

## Restoration

All code is preserved in git history. To restore:

```bash
# Find the commit where features were parked
git log --oneline --all -- electron/handlers/world-handlers.ts

# Cherry-pick or checkout individual files
git checkout <commit> -- electron/handlers/world-handlers.ts
```

Then re-add the import and registration call in `electron/main.ts`.
