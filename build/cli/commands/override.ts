// build/cli/commands/override.ts — Force/override operations (require reason)
import type { CLICommand, CLIResult } from "../dispatch.ts";

export async function handleOverride(cmd: CLICommand): Promise<CLIResult> {
  if (!cmd.reason && !cmd.flags.reason) {
    return { success: false, output: "override commands require --reason flag", auditId: "" };
  }

  const sub = cmd.subcommand ?? cmd.args[0];
  const reason = cmd.reason ?? (cmd.flags.reason as string);

  switch (sub) {
    case "review":
      return overrideReview(cmd.args[1], cmd.args[2], reason);
    case "merge":
      return overrideMerge(cmd.args[1], reason);
    case "counselor":
      return overrideCounselor(cmd.args[1], reason);
    case "roster":
      return overrideRoster(cmd.args[1], cmd.args[2], reason);
    default:
      return { success: false, output: `unknown override target: ${sub}`, auditId: "" };
  }
}

function overrideReview(taskId: string, gate: string, reason: string): CLIResult {
  return { success: true, output: `gate ${gate} force-passed for task ${taskId} (reason: ${reason})`, auditId: "" };
}

function overrideMerge(taskId: string, reason: string): CLIResult {
  return { success: true, output: `task ${taskId} force-merged, all gates bypassed (reason: ${reason})`, auditId: "" };
}

function overrideCounselor(verdictId: string, reason: string): CLIResult {
  return { success: true, output: `counselor verdict ${verdictId} overridden (reason: ${reason})`, auditId: "" };
}

function overrideRoster(character: string, archetype: string, reason: string): CLIResult {
  return { success: true, output: `${character} assigned secondary role ${archetype} (reason: ${reason})`, auditId: "" };
}
