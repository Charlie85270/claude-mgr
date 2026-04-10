// build/runtime/worktree-manager.ts
// Per-agent git worktree lifecycle with concurrency cap and orphan cleanup
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

export interface WorktreeSpawnInput {
  seasonPath: string;
  character: string;
  taskId: string;
}

export interface Worktree {
  path: string;
  character: string;
  taskId: string;
  branch: string;
  createdAt: Date;
}

const MAX_CONCURRENT_WORKTREES = 10;
const ORPHAN_THRESHOLD_DAYS = 7;

export function spawnWorktree(
  input: WorktreeSpawnInput,
): { success: boolean; worktree?: Worktree; error?: string } {
  const { seasonPath, character, taskId } = input;
  const workspaceDir = join(seasonPath, "workspace");
  const worktreesDir = join(seasonPath, "worktrees");

  const existing = listWorktrees(seasonPath);
  if (existing.length >= MAX_CONCURRENT_WORKTREES) {
    return { success: false, error: `max ${MAX_CONCURRENT_WORKTREES} concurrent worktrees reached` };
  }

  const wtName = `${character}-${taskId}`;
  const wtPath = join(worktreesDir, wtName);
  const branch = `task/${wtName}`;

  const result = spawnSync("git", ["worktree", "add", "-b", branch, wtPath], {
    cwd: workspaceDir,
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    return { success: false, error: result.stderr };
  }

  return {
    success: true,
    worktree: { path: wtPath, character, taskId, branch, createdAt: new Date() },
  };
}

export function mergeWorktree(
  seasonPath: string,
  worktree: Worktree,
  commitMessage: string,
): { success: boolean; error?: string } {
  const workspaceDir = join(seasonPath, "workspace");

  let result = spawnSync("git", ["checkout", "main"], {
    cwd: workspaceDir,
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    // Try 'master' if 'main' doesn't exist
    result = spawnSync("git", ["checkout", "master"], {
      cwd: workspaceDir,
      encoding: "utf-8",
    });
    if (result.status !== 0) return { success: false, error: "checkout main/master failed" };
  }

  result = spawnSync("git", ["merge", "--no-ff", worktree.branch, "-m", commitMessage], {
    cwd: workspaceDir,
    encoding: "utf-8",
  });
  if (result.status !== 0) return { success: false, error: `merge failed: ${result.stderr}` };

  // Remove the worktree
  spawnSync("git", ["worktree", "remove", worktree.path], {
    cwd: workspaceDir,
    encoding: "utf-8",
  });

  return { success: true };
}

export function listWorktrees(seasonPath: string): Worktree[] {
  const worktreesDir = join(seasonPath, "worktrees");
  if (!existsSync(worktreesDir)) return [];
  return readdirSync(worktreesDir)
    .filter((name) => {
      const path = join(worktreesDir, name);
      return statSync(path).isDirectory();
    })
    .map((name) => {
      const path = join(worktreesDir, name);
      const stat = statSync(path);
      const parts = name.split("-");
      const taskId = parts.pop()!;
      const character = parts.join("-");
      return { path, character, taskId, branch: `task/${name}`, createdAt: stat.birthtime };
    });
}

export function cleanupOrphans(seasonPath: string): string[] {
  const now = Date.now();
  const removed: string[] = [];
  for (const wt of listWorktrees(seasonPath)) {
    const ageMs = now - wt.createdAt.getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays > ORPHAN_THRESHOLD_DAYS) {
      const workspaceDir = join(seasonPath, "workspace");
      spawnSync("git", ["worktree", "remove", "--force", wt.path], { cwd: workspaceDir });
      if (existsSync(wt.path)) {
        rmSync(wt.path, { recursive: true });
      }
      removed.push(wt.path);
    }
  }
  return removed;
}
