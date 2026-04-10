// build/expansion/mid-season-spawn.ts — Spawn a new character into a live season
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ExpansionProposal } from "./proposal-flow.ts";

export interface MidSeasonSpawnInput {
  seasonPath: string;
  theme: string;
  proposal: ExpansionProposal;
}

export interface MidSeasonSpawnResult {
  success: boolean;
  characterPath: string | null;
  error?: string;
}

export function midSeasonSpawn(input: MidSeasonSpawnInput): MidSeasonSpawnResult {
  const { seasonPath, theme, proposal } = input;
  const characterName = proposal.suggested_character ?? proposal.archetype;
  const charDir = join(seasonPath, "characters", characterName);

  if (existsSync(charDir)) {
    return { success: false, characterPath: null, error: `Character ${characterName} already exists in season` };
  }

  // Try to copy from theme source
  const themeSrc = join("src/team-factory/themes", theme, "characters", characterName);
  if (existsSync(themeSrc)) {
    cpSync(themeSrc, charDir, { recursive: true });
  } else {
    // Create a minimal soul package for the new archetype
    mkdirSync(charDir, { recursive: true });
    writeFileSync(
      join(charDir, "SOUL.md"),
      [
        "---",
        `character_name: ${characterName}`,
        `archetype: ${proposal.archetype}`,
        "---",
        "",
        "# Who I Am",
        "",
        `I am ${characterName}, a ${proposal.archetype} added mid-season.`,
        "",
        `## Why I'm Here`,
        "",
        proposal.rationale,
        "",
      ].join("\n"),
    );
    writeFileSync(join(charDir, "AGENTS.md"), `# Agents\n\nMid-season addition: ${proposal.archetype}\n`);
    writeFileSync(join(charDir, "HEARTBEAT.md"), `# Heartbeat\n\nJoined mid-season.\n`);
    writeFileSync(join(charDir, "MEMORY.seed.md"), `# Memory Seed\n\nNew team member.\n`);
  }

  // Update the season manifest
  const manifestPath = join(seasonPath, "manifest.yaml");
  if (existsSync(manifestPath)) {
    let manifest = readFileSync(manifestPath, "utf-8");
    const rosterEntry = [
      `  - character: "${characterName}"`,
      `    archetype: "${proposal.archetype}"`,
      `    capabilities: []`,
      `    mid_season_addition: true`,
    ].join("\n");
    manifest = manifest.replace(/^roster:$/m, `roster:\n${rosterEntry}`);
    writeFileSync(manifestPath, manifest);
  }

  return { success: true, characterPath: charDir };
}
