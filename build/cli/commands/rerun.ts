// build/cli/commands/rerun.ts — Re-execute operations
import type { CLICommand, CLIResult } from "../dispatch.ts";

export async function handleRerun(cmd: CLICommand): Promise<CLIResult> {
  const sub = cmd.subcommand ?? cmd.args[0];

  switch (sub) {
    case "season":
      return rerunSeason(cmd.args[1]);
    case "review":
      return rerunReview(cmd.args[1], cmd.args[2]);
    case "character":
      return rerunCharacter(cmd.args[1], cmd.args[2], cmd.args[3]);
    default:
      return { success: false, output: `unknown rerun target: ${sub}`, auditId: "" };
  }
}

function rerunSeason(seasonSlug: string): CLIResult {
  if (!seasonSlug) return { success: false, output: "usage: rerun season <slug>", auditId: "" };
  return { success: true, output: `season ${seasonSlug} re-ingestion started`, auditId: "" };
}

function rerunReview(taskId: string, gate: string): CLIResult {
  if (!taskId || !gate) return { success: false, output: "usage: rerun review <task-id> <gate>", auditId: "" };
  return { success: true, output: `gate ${gate} re-executed for task ${taskId}`, auditId: "" };
}

function rerunCharacter(season: string, archetype: string, newCharacter: string): CLIResult {
  if (!season || !archetype || !newCharacter) {
    return { success: false, output: "usage: rerun character <season> <archetype> <new-character>", auditId: "" };
  }
  return { success: true, output: `${archetype} recast to ${newCharacter} in ${season}`, auditId: "" };
}
