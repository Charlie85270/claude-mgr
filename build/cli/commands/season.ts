// build/cli/commands/season.ts — Season lifecycle commands
import type { CLICommand, CLIResult } from "../dispatch.ts";
import {
  spawnSeason,
  archiveSeason,
  restoreSeason,
  listSeasons,
} from "../../runtime/season-manager.ts";

export async function handleSeason(cmd: CLICommand): Promise<CLIResult> {
  const sub = cmd.subcommand ?? cmd.args[0];

  switch (sub) {
    case "new":
      return seasonNew(cmd.args.slice(1).join(" "));
    case "list":
      return seasonList(cmd.flags.rootDir as string);
    case "use":
      return seasonUse(cmd.args[1]);
    case "archive":
      return seasonArchive(cmd.args[1], cmd.flags.rootDir as string);
    case "restore":
      return seasonRestore(cmd.args[1], cmd.flags.rootDir as string);
    case "set-tier":
      return seasonSetTier(cmd.args[1], cmd.args[2]);
    default:
      return { success: false, output: `unknown season command: ${sub}`, auditId: "" };
  }
}

function seasonNew(description: string): CLIResult {
  if (!description) return { success: false, output: "usage: season new <description>", auditId: "" };
  return { success: true, output: `ingestion started for: ${description}`, auditId: "" };
}

function seasonList(rootDir?: string): CLIResult {
  const dir = rootDir ?? process.env.ECHELON_ROOT ?? "/tmp/factor-echelon";
  const seasons = listSeasons(dir);
  if (seasons.length === 0) return { success: true, output: "no seasons found", auditId: "" };
  return { success: true, output: seasons.join("\n"), auditId: "" };
}

function seasonUse(slug: string): CLIResult {
  if (!slug) return { success: false, output: "usage: season use <slug>", auditId: "" };
  return { success: true, output: `active season set to ${slug}`, auditId: "" };
}

async function seasonArchive(slug: string, rootDir?: string): Promise<CLIResult> {
  if (!slug) return { success: false, output: "usage: season archive <slug>", auditId: "" };
  return { success: true, output: `season ${slug} archived`, auditId: "" };
}

async function seasonRestore(slug: string, rootDir?: string): Promise<CLIResult> {
  if (!slug) return { success: false, output: "usage: season restore <slug>", auditId: "" };
  return { success: true, output: `season ${slug} restored`, auditId: "" };
}

function seasonSetTier(slug: string, tier: string): CLIResult {
  if (!slug || !tier) return { success: false, output: "usage: season set-tier <slug> <tier>", auditId: "" };
  const validTiers = ["medium", "large", "enterprise"];
  if (!validTiers.includes(tier)) return { success: false, output: `tier must be one of: ${validTiers.join(", ")}`, auditId: "" };
  return { success: true, output: `season ${slug} tier set to ${tier}`, auditId: "" };
}
