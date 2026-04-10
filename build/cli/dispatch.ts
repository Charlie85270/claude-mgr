// build/cli/dispatch.ts — Main CLI dispatch layer
import { logAudit } from "./audit-log.ts";
import { handleCancel } from "./commands/cancel.ts";
import { handleOverride } from "./commands/override.ts";
import { handleRerun } from "./commands/rerun.ts";
import { handleSeason } from "./commands/season.ts";
import { handleCharacter } from "./commands/character.ts";
import { handleKB } from "./commands/kb.ts";
import { handleCounselor } from "./commands/counselor.ts";
import { handleUninstall } from "./commands/uninstall.ts";

export interface CLICommand {
  name: string;
  subcommand?: string;
  args: string[];
  flags: Record<string, string | boolean>;
  reason?: string;
  seasonId?: string;
}

export interface CLIResult {
  success: boolean;
  output: string;
  auditId: string;
}

type CommandHandler = (cmd: CLICommand) => Promise<CLIResult>;

const HANDLERS: Record<string, CommandHandler> = {
  cancel: handleCancel,
  override: handleOverride,
  rerun: handleRerun,
  season: handleSeason,
  character: handleCharacter,
  kb: handleKB,
  counselor: handleCounselor,
  uninstall: handleUninstall,
};

export async function dispatch(cmd: CLICommand): Promise<CLIResult> {
  const handler = HANDLERS[cmd.name];
  if (!handler) {
    return { success: false, output: `unknown command: ${cmd.name}`, auditId: "" };
  }

  const result = await handler(cmd);

  const auditId = logAudit({
    command: cmd.name,
    args: cmd.args,
    flags: cmd.flags,
    reason: cmd.reason,
    result: result.success ? "success" : "failure",
    output: result.output,
    season_id: cmd.seasonId,
  });

  return { ...result, auditId };
}
