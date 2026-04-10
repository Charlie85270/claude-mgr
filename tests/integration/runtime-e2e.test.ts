import { expect, test, describe } from "bun:test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { spawnSeason } from "../../build/runtime/season-manager.ts";
import { spawnWorktree } from "../../build/runtime/worktree-manager.ts";
import { runReviewPipeline } from "../../build/runtime/review-pipeline.ts";
import { attemptMerge } from "../../build/runtime/merge-authority.ts";

describe("E2E runtime: season → worktree → review → merge", () => {
  const tmpRoot = () => `/tmp/factor-echelon-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  test("full lifecycle: spawn season → worktree → review → merge", async () => {
    const root = tmpRoot();

    // 1. Spawn a season
    const season = await spawnSeason({
      slug: "runtime-test",
      theme: "tbbt",
      tier: "medium",
      roster: [
        { archetype: "user-handler", character: "leonard-hofstadter", capabilities: ["source-control:admin"] },
        { archetype: "backend-engineer", character: "stuart-bloom", capabilities: ["source-control:write"] },
      ],
      rootDir: root,
    });
    expect(season.success).toBe(true);

    // 2. Spawn a worktree for Stuart
    const wt = spawnWorktree({
      seasonPath: season.path,
      character: "stuart-bloom",
      taskId: "task-001",
    });
    expect(wt.success).toBe(true);
    expect(wt.worktree).toBeDefined();

    // 3. Simulate agent work in the worktree
    const srcDir = join(wt.worktree!.path, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(
      join(srcDir, "greet.ts"),
      'export function greet(name: string): string { return `Hello, ${name}!`; }\n',
    );
    spawnSync("git", ["add", "-A"], { cwd: wt.worktree!.path });
    spawnSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "feat: add greet function"], {
      cwd: wt.worktree!.path,
    });

    // 4. Run review pipeline (stub gates — all pass)
    const review = await runReviewPipeline({
      taskId: "task-001",
      worktreePath: wt.worktree!.path,
      worktreeDiff: '+export function greet(name: string): string { return `Hello, ${name}!`; }',
      bounceCount: 0,
    });
    expect(review.passed).toBe(true);
    expect(review.gateResults.length).toBe(7);

    // 5. Leonard merges
    const merge = await attemptMerge({
      seasonPath: season.path,
      worktree: wt.worktree!,
      reviewResult: review,
      taskDescription: "feat: add greet function",
    });
    expect(merge.merged).toBe(true);
    expect(merge.commitMessage).toContain("feat: add greet function");
    expect(merge.commitMessage).toContain("5.0★");

    // 6. Verify the file is in the workspace main branch
    expect(existsSync(join(season.path, "workspace/src/greet.ts"))).toBe(true);
  });

  test("merge blocked when review fails", async () => {
    const root = tmpRoot();
    const season = await spawnSeason({
      slug: "blocked-test",
      theme: "tbbt",
      tier: "medium",
      roster: [],
      rootDir: root,
    });

    const fakeWorktree = {
      path: "/tmp/fake",
      character: "stuart-bloom",
      taskId: "task-002",
      branch: "task/stuart-bloom-task-002",
      createdAt: new Date(),
    };

    const failedReview = {
      passed: false,
      mustBounce: true,
      escalateToCounselor: false,
      gateResults: [{ gate: "security-review", type: "pass-fail" as const, result: "fail" as const, reviewer: "barry-kripke", notes: "injection" }],
      overallRating: null,
    };

    const merge = await attemptMerge({
      seasonPath: season.path,
      worktree: fakeWorktree,
      reviewResult: failedReview,
      taskDescription: "should not merge",
    });
    expect(merge.merged).toBe(false);
    expect(merge.error).toContain("review gates did not pass");
  });
});
