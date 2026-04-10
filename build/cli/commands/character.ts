// build/cli/commands/character.ts — Character management commands
import type { CLICommand, CLIResult } from "../dispatch.ts";

export async function handleCharacter(cmd: CLICommand): Promise<CLIResult> {
  const sub = cmd.subcommand ?? cmd.args[0];

  switch (sub) {
    case "add":
      return characterAdd(cmd.args[1], cmd.args[2]);
    case "remove":
      return characterRemove(cmd.args[1], cmd.args[2]);
    case "pause":
      return characterPause(cmd.args[1]);
    case "resume":
      return characterResume(cmd.args[1]);
    default:
      return { success: false, output: `unknown character command: ${sub}`, auditId: "" };
  }
}

function characterAdd(season: string, archetype: string): CLIResult {
  if (!season || !archetype) return { success: false, output: "usage: character add <season> <archetype>", auditId: "" };
  return { success: true, output: `${archetype} added to season ${season}`, auditId: "" };
}

function characterRemove(season: string, character: string): CLIResult {
  if (!season || !character) return { success: false, output: "usage: character remove <season> <character>", auditId: "" };
  return { success: true, output: `${character} removed from season ${season}; reassignment pending`, auditId: "" };
}

function characterPause(name: string): CLIResult {
  if (!name) return { success: false, output: "usage: character pause <name>", auditId: "" };
  return { success: true, output: `${name} heartbeat paused`, auditId: "" };
}

function characterResume(name: string): CLIResult {
  if (!name) return { success: false, output: "usage: character resume <name>", auditId: "" };
  return { success: true, output: `${name} heartbeat resumed`, auditId: "" };
}
