// build/cli/commands/counselor.ts — Counselor management commands
import type { CLICommand, CLIResult } from "../dispatch.ts";

export async function handleCounselor(cmd: CLICommand): Promise<CLIResult> {
  const sub = cmd.subcommand ?? cmd.args[0];

  switch (sub) {
    case "config":
      return counselorConfig(cmd.flags.model as string, cmd.args[1]);
    case "budget":
      return counselorBudget();
    case "history":
      return counselorHistory(cmd.args[1]);
    default:
      return { success: false, output: `unknown counselor command: ${sub}`, auditId: "" };
  }
}

function counselorConfig(model: string, version: string): CLIResult {
  if (!model || !version) return { success: false, output: "usage: counselor config --model <name> <version>", auditId: "" };
  return { success: true, output: `counselor model ${model} updated to ${version}`, auditId: "" };
}

function counselorBudget(): CLIResult {
  return { success: true, output: "counselor budget: $0.00 / $50.00 this month (0 invocations)", auditId: "" };
}

function counselorHistory(placement: string): CLIResult {
  if (!placement) return { success: false, output: "usage: counselor history <placement>", auditId: "" };
  return { success: true, output: `counselor history for placement ${placement}: 0 verdicts`, auditId: "" };
}
