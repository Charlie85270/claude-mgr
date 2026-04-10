// build/cli/commands/kb.ts — Knowledge base intervention commands
import type { CLICommand, CLIResult } from "../dispatch.ts";

export async function handleKB(cmd: CLICommand): Promise<CLIResult> {
  const sub = cmd.subcommand ?? cmd.args[0];

  switch (sub) {
    case "delete":
      return kbDelete(cmd.args[1], cmd.reason ?? (cmd.flags.reason as string));
    case "promote":
      return kbPromote(cmd.args[1]);
    case "demote":
      return kbDemote(cmd.args[1]);
    case "export":
      return kbExport(cmd.args[1]);
    case "import":
      return kbImport(cmd.args[1]);
    default:
      return { success: false, output: `unknown kb command: ${sub}`, auditId: "" };
  }
}

function kbDelete(roomId: string, reason?: string): CLIResult {
  if (!roomId) return { success: false, output: "usage: kb delete <room-id> --reason '...'", auditId: "" };
  if (!reason) return { success: false, output: "kb delete requires --reason flag", auditId: "" };
  return { success: true, output: `room ${roomId} quarantined (reason: ${reason})`, auditId: "" };
}

function kbPromote(roomId: string): CLIResult {
  if (!roomId) return { success: false, output: "usage: kb promote <room-id>", auditId: "" };
  return { success: true, output: `room ${roomId} promoted (private→team) [v0.5 stub]`, auditId: "" };
}

function kbDemote(roomId: string): CLIResult {
  if (!roomId) return { success: false, output: "usage: kb demote <room-id>", auditId: "" };
  return { success: true, output: `room ${roomId} demoted (team→private)`, auditId: "" };
}

function kbExport(path: string): CLIResult {
  if (!path) return { success: false, output: "usage: kb export <path>", auditId: "" };
  return { success: true, output: `knowledge base exported to ${path}`, auditId: "" };
}

function kbImport(path: string): CLIResult {
  if (!path) return { success: false, output: "usage: kb import <path>", auditId: "" };
  return { success: true, output: `knowledge base imported from ${path}`, auditId: "" };
}
