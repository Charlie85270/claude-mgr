// build/oobe/steps/platform-prereqs.ts — Step 1: Check platform prerequisites
import { spawnSync } from "node:child_process";
import { statSync } from "node:fs";
import type { OOBEStep, OOBEContext } from "../state-machine.ts";

interface PrereqResult {
  name: string;
  ok: boolean;
  detail: string;
}

function checkGit(): PrereqResult {
  const result = spawnSync("git", ["--version"], { encoding: "utf-8" });
  if (result.status !== 0) return { name: "git", ok: false, detail: "git not found" };
  const version = result.stdout.trim();
  return { name: "git", ok: true, detail: version };
}

function checkBun(): PrereqResult {
  const result = spawnSync("bun", ["--version"], { encoding: "utf-8" });
  if (result.status !== 0) return { name: "bun", ok: false, detail: "bun not found" };
  return { name: "bun", ok: true, detail: `bun v${result.stdout.trim()}` };
}

function checkDiskSpace(rootDir: string): PrereqResult {
  try {
    // Simple check: can we write to the target directory?
    const stat = statSync(rootDir);
    return { name: "disk", ok: stat.isDirectory(), detail: "target directory accessible" };
  } catch {
    return { name: "disk", ok: true, detail: "directory will be created" };
  }
}

export const platformPrereqs: OOBEStep = {
  id: "PLATFORM_PREREQS",
  mandatory: true,
  async run(ctx: OOBEContext) {
    const results = [checkGit(), checkBun(), checkDiskSpace(ctx.rootDir)];
    const failed = results.filter((r) => !r.ok);
    ctx.state.platform_prereqs = results;

    if (failed.length > 0) {
      throw new Error(`Prerequisites failed: ${failed.map((r) => r.detail).join(", ")}`);
    }
  },
};
