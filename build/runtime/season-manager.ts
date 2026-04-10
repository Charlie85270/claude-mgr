// build/runtime/season-manager.ts
// Season lifecycle: spawn, archive, restore
// Seasons live at <rootDir>/seasons/<slug>/
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { dump as yamlDump, load as yamlLoad } from "js-yaml";

export interface SpawnSeasonInput {
  slug: string;
  theme: string;
  tier: "medium" | "large" | "enterprise";
  roster: Array<{
    archetype: string;
    character: string;
    capabilities: string[];
  }>;
  rootDir: string;
  userContext?: Record<string, unknown>;
}

export interface SeasonSpawnResult {
  success: boolean;
  seasonId: string;
  path: string;
  errors: string[];
}

export async function spawnSeason(input: SpawnSeasonInput): Promise<SeasonSpawnResult> {
  const seasonsDir = join(input.rootDir, "seasons");
  mkdirSync(seasonsDir, { recursive: true });

  // Determine next season ID
  const existing = readdirSync(seasonsDir).filter((n) => n.startsWith("season-"));
  const nextN = existing.length + 1;
  const seasonId = `season-${nextN.toString().padStart(2, "0")}-${input.slug}`;
  const seasonPath = join(seasonsDir, seasonId);

  if (existsSync(seasonPath)) {
    return { success: false, seasonId, path: seasonPath, errors: ["season already exists"] };
  }

  const errors: string[] = [];

  mkdirSync(seasonPath);
  mkdirSync(join(seasonPath, "characters"));
  mkdirSync(join(seasonPath, "memory"));
  mkdirSync(join(seasonPath, "worktrees"));

  // Initialize workspace as git repo
  const workspacePath = join(seasonPath, "workspace");
  mkdirSync(workspacePath);
  spawnSync("git", ["init"], { cwd: workspacePath });
  spawnSync("git", ["config", "user.email", "season@factor-echelon.local"], { cwd: workspacePath });
  spawnSync("git", ["config", "user.name", "factor-echelon"], { cwd: workspacePath });
  spawnSync("git", ["config", "commit.gpgsign", "false"], { cwd: workspacePath });
  writeFileSync(join(workspacePath, ".gitkeep"), "");
  spawnSync("git", ["add", "."], { cwd: workspacePath });
  spawnSync("git", ["commit", "-m", `init: season ${seasonId}`], { cwd: workspacePath });

  // Write season.yaml
  writeFileSync(
    join(seasonPath, "season.yaml"),
    yamlDump({
      season_id: seasonId,
      season_slug: input.slug,
      theme: input.theme,
      tier: input.tier,
      state: "active",
      created_at: new Date().toISOString(),
    }),
  );

  // Write manifest.yaml
  writeFileSync(
    join(seasonPath, "manifest.yaml"),
    yamlDump({
      season_id: seasonId,
      season_slug: input.slug,
      theme: input.theme,
      tier: input.tier,
      roster: input.roster,
      channels: { primary: `#${seasonId}-pennys-apartment` },
      user_context: input.userContext ?? {},
    }),
  );

  // Copy character soul packages for each roster entry
  for (const entry of input.roster) {
    const srcCharPath = join("src/team-factory/themes", input.theme, "characters", entry.character);
    const dstCharPath = join(seasonPath, "characters", entry.character);
    if (existsSync(srcCharPath)) {
      cpSync(srcCharPath, dstCharPath, { recursive: true });
    } else {
      errors.push(`character not found: ${entry.character}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, seasonId, path: seasonPath, errors };
  }

  return { success: true, seasonId, path: seasonPath, errors: [] };
}

export async function archiveSeason(
  seasonPath: string,
  rootDir: string,
): Promise<{ success: boolean; error?: string }> {
  const archiveDir = join(rootDir, "seasons", "_archive");
  mkdirSync(archiveDir, { recursive: true });
  const slug = seasonPath.split("/").pop()!;

  // Update season.yaml state
  const seasonYamlPath = join(seasonPath, "season.yaml");
  if (existsSync(seasonYamlPath)) {
    const data = yamlLoad(readFileSync(seasonYamlPath, "utf-8")) as Record<string, unknown>;
    data.state = "archived";
    data.archived_at = new Date().toISOString();
    writeFileSync(seasonYamlPath, yamlDump(data));
  }

  renameSync(seasonPath, join(archiveDir, slug));
  return { success: true };
}

export async function restoreSeason(
  archivedSlug: string,
  rootDir: string,
): Promise<{ success: boolean; error?: string }> {
  const archivePath = join(rootDir, "seasons", "_archive", archivedSlug);
  const restoredPath = join(rootDir, "seasons", archivedSlug);

  if (!existsSync(archivePath)) {
    return { success: false, error: `archived season not found: ${archivedSlug}` };
  }

  // Update season.yaml state
  const seasonYamlPath = join(archivePath, "season.yaml");
  if (existsSync(seasonYamlPath)) {
    const data = yamlLoad(readFileSync(seasonYamlPath, "utf-8")) as Record<string, unknown>;
    data.state = "active";
    delete data.archived_at;
    writeFileSync(seasonYamlPath, yamlDump(data));
  }

  renameSync(archivePath, restoredPath);
  return { success: true };
}

export function listSeasons(rootDir: string): string[] {
  const seasonsDir = join(rootDir, "seasons");
  if (!existsSync(seasonsDir)) return [];
  return readdirSync(seasonsDir).filter((n) => n.startsWith("season-"));
}
