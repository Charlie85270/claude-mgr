import { expect, test, describe } from "bun:test";
import { existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { spawnSeason } from "../../build/runtime/season-manager.ts";
import { spawnWorktree, listWorktrees, mergeWorktree } from "../../build/runtime/worktree-manager.ts";

describe("worktree-manager", () => {
  const tmpRoot = () => `/tmp/factor-echelon-wt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  async function setupSeason() {
    const root = tmpRoot();
    const season = await spawnSeason({
      slug: "wt-test",
      theme: "tbbt",
      tier: "medium",
      roster: [],
      rootDir: root,
    });
    return season;
  }

  test("spawnWorktree creates a worktree directory", async () => {
    const season = await setupSeason();
    const result = spawnWorktree({
      seasonPath: season.path,
      character: "stuart-bloom",
      taskId: "task-001",
    });
    expect(result.success).toBe(true);
    expect(result.worktree).toBeDefined();
    expect(result.worktree!.branch).toBe("task/stuart-bloom-task-001");
    expect(existsSync(result.worktree!.path)).toBe(true);
  });

  test("listWorktrees returns spawned worktrees", async () => {
    const season = await setupSeason();
    spawnWorktree({ seasonPath: season.path, character: "stuart-bloom", taskId: "task-001" });
    spawnWorktree({ seasonPath: season.path, character: "alex-jensen", taskId: "task-002" });

    const list = listWorktrees(season.path);
    expect(list.length).toBe(2);
  });

  test("spawnWorktree rejects when at max capacity", async () => {
    const season = await setupSeason();
    // Spawn 10 worktrees
    for (let i = 0; i < 10; i++) {
      const r = spawnWorktree({ seasonPath: season.path, character: "char", taskId: `t${i}` });
      expect(r.success).toBe(true);
    }
    // 11th should fail
    const r11 = spawnWorktree({ seasonPath: season.path, character: "char", taskId: "t10" });
    expect(r11.success).toBe(false);
    expect(r11.error).toContain("max");
  });

  test("mergeWorktree integrates changes into workspace", async () => {
    const season = await setupSeason();
    const wt = spawnWorktree({
      seasonPath: season.path,
      character: "stuart-bloom",
      taskId: "merge-test",
    });
    expect(wt.success).toBe(true);

    // Make a change in the worktree
    writeFileSync(join(wt.worktree!.path, "hello.txt"), "hello world\n");
    spawnSync("git", ["add", "-A"], { cwd: wt.worktree!.path });
    spawnSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "add hello"], { cwd: wt.worktree!.path });

    // Merge back
    const merge = mergeWorktree(season.path, wt.worktree!, "feat: add hello");
    expect(merge.success).toBe(true);

    // Verify file is in workspace
    expect(existsSync(join(season.path, "workspace/hello.txt"))).toBe(true);
  });
});
