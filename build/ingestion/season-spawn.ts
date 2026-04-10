// build/ingestion/season-spawn.ts — Penny's full ingestion protocol
// Orchestrates: PRD refinement → roster composition → theme mapping → season spawn
import { readFileSync } from "node:fs";
import { parsePRD } from "../lib/prd-parser.ts";
import { parseSkillTree } from "../lib/skill-parser.ts";
import { composeInitialRoster } from "../skills/roster-composer.ts";
import { resolveCapabilities } from "../skills/capability-resolver.ts";
import { mapArchetypesToCharacters } from "../skills/theme-engine.ts";
import { refineUntilConfident, type AskUser } from "./prd-refinement-loop.ts";
import { spawnSeason, type SeasonSpawnResult } from "../runtime/season-manager.ts";
import { buildHandoffArtifact } from "./handoff.ts";

export interface IngestInput {
  prdPath: string;
  theme: string;
  rootDir: string;
  askUser: AskUser;
  tier?: "medium" | "large" | "enterprise";
  slug?: string;
}

export interface IngestResult {
  success: boolean;
  season: SeasonSpawnResult | null;
  handoff: Record<string, unknown> | null;
  errors: string[];
}

export async function pennyIngest(input: IngestInput): Promise<IngestResult> {
  const errors: string[] = [];

  // 1. Read and refine PRD
  const rawPrd = readFileSync(input.prdPath, "utf-8");
  let parsed;
  try {
    const { refined } = await refineUntilConfident(rawPrd, input.askUser);
    parsed = refined;
  } catch (e) {
    // Fall back to direct parse if refinement fails
    parsed = parsePRD(rawPrd);
    errors.push(`PRD refinement: ${(e as Error).message}`);
  }

  // 2. Compose initial roster
  const roster = composeInitialRoster(parsed);

  // 3. Map archetypes to theme characters
  const tree = parseSkillTree("src/team-factory");
  const mapped = mapArchetypesToCharacters(roster.archetypes, input.theme, tree);

  // 4. Resolve capabilities
  const bound = resolveCapabilities(mapped.archetype_to_character);

  // 5. Build roster entries for season spawn (use mapped character names)
  const rosterEntries = bound.map((b) => ({
    archetype: b.archetype,
    character: b.character,
    capabilities: b.granted,
  }));

  // 6. Determine slug
  const slug = input.slug ?? parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);

  // 7. Spawn season
  const season = await spawnSeason({
    slug,
    theme: input.theme,
    tier: input.tier ?? "large",
    roster: rosterEntries,
    rootDir: input.rootDir,
  });

  if (!season.success) {
    return { success: false, season, handoff: null, errors: [...errors, ...season.errors] };
  }

  // 8. Build handoff artifact
  const handoff = buildHandoffArtifact({
    seasonId: season.seasonId,
    slug,
    theme: input.theme,
    tier: input.tier ?? "large",
    roster: rosterEntries,
    prdTitle: parsed.title,
  });

  return { success: true, season, handoff, errors };
}
