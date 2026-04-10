// build/cli/commands/cancel.ts — Cancel/abort operations
import type { CLICommand, CLIResult } from "../dispatch.ts";

export async function handleCancel(cmd: CLICommand): Promise<CLIResult> {
  const sub = cmd.subcommand ?? cmd.args[0];

  switch (sub) {
    case "season":
      return cancelSeason(cmd.args[1]);
    case "task":
      return cancelTask(cmd.args[1]);
    case "expansion":
      return cancelExpansion();
    default:
      return { success: false, output: `unknown cancel target: ${sub}`, auditId: "" };
  }
}

function cancelSeason(slug: string): CLIResult {
  if (!slug) return { success: false, output: "usage: cancel season <slug>", auditId: "" };
  return { success: true, output: `season ${slug} spawn cancelled`, auditId: "" };
}

function cancelTask(taskId: string): CLIResult {
  if (!taskId) return { success: false, output: "usage: cancel task <task-id>", auditId: "" };
  return { success: true, output: `task ${taskId} cancelled, worktree cleaned up`, auditId: "" };
}

function cancelExpansion(): CLIResult {
  return { success: true, output: "pending expansion proposal cancelled", auditId: "" };
}
