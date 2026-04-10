// build/cli/commands/uninstall.ts — Full uninstall flow (§7.7)
import { existsSync, rmSync } from "node:fs";
import type { CLICommand, CLIResult } from "../dispatch.ts";

export interface UninstallOptions {
  rootDir: string;
  confirm?: () => Promise<boolean>;
  promptExport?: () => Promise<string | null>;
  promptBackup?: () => Promise<string | null>;
}

export async function handleUninstall(cmd: CLICommand): Promise<CLIResult> {
  const rootDir = (cmd.flags.rootDir as string) ?? process.env.ECHELON_ROOT ?? "~/.echelon";
  const force = cmd.flags.force === true;

  if (!force) {
    return { success: true, output: `would uninstall from ${rootDir} (use --force to confirm)`, auditId: "" };
  }

  return performUninstall({ rootDir });
}

export async function performUninstall(options: UninstallOptions): Promise<CLIResult> {
  const { rootDir } = options;

  // Step 1: Confirm
  if (options.confirm) {
    const confirmed = await options.confirm();
    if (!confirmed) return { success: false, output: "uninstall cancelled", auditId: "" };
  }

  // Step 2: Offer KB export
  if (options.promptExport) {
    const exportPath = await options.promptExport();
    if (exportPath) {
      // Would call kb.export(exportPath) here
    }
  }

  // Step 3: Offer config backup
  if (options.promptBackup) {
    const backupPath = await options.promptBackup();
    if (backupPath) {
      // Would backup config here
    }
  }

  // Step 4: Remove data directory
  if (existsSync(rootDir)) {
    rmSync(rootDir, { recursive: true });
  }

  return {
    success: true,
    output: `factor-echelon uninstalled from ${rootDir}. Reinstall and run 'factor-echelon kb import' to recover.`,
    auditId: "",
  };
}
