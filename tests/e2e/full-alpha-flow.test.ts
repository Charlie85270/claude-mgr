// tests/e2e/full-alpha-flow.test.ts — Complete alpha lifecycle end-to-end
import { expect, test, describe } from "bun:test";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { runOOBE, type OOBEStep, type OOBEStepId } from "../../build/oobe/state-machine.ts";
import { platformPrereqs } from "../../build/oobe/steps/platform-prereqs.ts";
import { userProfileInterview, setProfileProvider } from "../../build/oobe/steps/user-profile-interview.ts";
import { themeSelection, setThemeSelector } from "../../build/oobe/steps/theme-selection.ts";
import { counselorApiKeys } from "../../build/oobe/steps/counselor-api-keys.ts";
import { kbModeSelection } from "../../build/oobe/steps/kb-mode-selection.ts";
import { mempalaceInit } from "../../build/oobe/steps/mempalace-init.ts";
import { advisoryBoardProvisioning } from "../../build/oobe/steps/advisory-board-provisioning.ts";
import { channelConfig } from "../../build/oobe/steps/channel-config.ts";
import { pennyIngest } from "../../build/ingestion/season-spawn.ts";
import { spawnWorktree } from "../../build/runtime/worktree-manager.ts";
import { runReviewPipeline } from "../../build/runtime/review-pipeline.ts";
import { attemptMerge } from "../../build/runtime/merge-authority.ts";
import { archiveSeason } from "../../build/runtime/season-manager.ts";
import { MempalaceBackend } from "../../build/kb/mempalace-backend.ts";
import { Counselor } from "../../build/counselor/counselor.ts";
import { StubModelClient } from "../../build/counselor/models/types.ts";
import { detectGap } from "../../build/expansion/gap-detection.ts";
import { midSeasonSpawn } from "../../build/expansion/mid-season-spawn.ts";
import { performUninstall } from "../../build/cli/commands/uninstall.ts";

function makeSteps(): Record<OOBEStepId, OOBEStep> {
  return {
    PLATFORM_PREREQS: platformPrereqs,
    USER_PROFILE_INTERVIEW: userProfileInterview,
    THEME_SELECTION: themeSelection,
    COUNSELOR_API_KEYS: counselorApiKeys,
    KB_MODE_SELECTION: kbModeSelection,
    MEMPALACE_INIT: mempalaceInit,
    ADVISORY_BOARD_PROVISIONING: advisoryBoardProvisioning,
    CHANNEL_CONFIG: channelConfig,
  };
}

describe("E2E: full alpha lifecycle", () => {
  test("install → OOBE → season → task → review → merge → expand → archive → uninstall", async () => {
    const tmpRoot = `/tmp/factor-echelon-e2e-full-${Date.now()}`;

    // Step 1: OOBE
    setProfileProvider(async () => ({
      name: "E2E User", timezone: "UTC", role: "developer", team_size: 1, preferred_channels: [],
    }));
    setThemeSelector(async () => "tbbt");

    const oobeResult = await runOOBE(tmpRoot, makeSteps());
    expect(oobeResult.completed).toBe(true);
    expect(existsSync(join(tmpRoot, "config.json"))).toBe(true);
    expect(existsSync(join(tmpRoot, "advisory-board"))).toBe(true);
    expect(existsSync(join(tmpRoot, "knowledge-base", "local"))).toBe(true);

    // Step 2: Season spawn via Penny ingestion
    const season = await pennyIngest({
      prdPath: "tests/fixtures/prds/medium-saas.md",
      theme: "tbbt",
      rootDir: tmpRoot,
      askUser: async () => ({}),
    });
    expect(season.success).toBe(true);
    expect(season.season).not.toBeNull();

    // Step 3: Verify characters
    const chars = readdirSync(join(season.season!.path, "characters"));
    expect(chars.length).toBeGreaterThanOrEqual(5);

    // Step 4: Run a task through worktree + review + merge
    const wt = spawnWorktree({
      seasonPath: season.season!.path,
      character: chars[0],
      taskId: "e2e-task-001",
    });
    expect(wt.success).toBe(true);

    // Simulate work
    const srcDir = join(wt.worktree!.path, "src");
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, "e2e.ts"), "export const e2e = true;\n");
    spawnSync("git", ["add", "-A"], { cwd: wt.worktree!.path });
    spawnSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "feat: e2e test"], { cwd: wt.worktree!.path });

    // Review pipeline
    const review = await runReviewPipeline({
      taskId: "e2e-task-001",
      worktreePath: wt.worktree!.path,
      worktreeDiff: "+export const e2e = true;",
      bounceCount: 0,
    });
    expect(review.passed).toBe(true);

    // Merge
    const merge = await attemptMerge({
      seasonPath: season.season!.path,
      worktree: wt.worktree!,
      reviewResult: review,
      taskDescription: "feat: e2e test file",
    });
    expect(merge.merged).toBe(true);

    // Step 5: KB capture
    const kb = new MempalaceBackend();
    await kb.init({ mode: "solo", backend: "mempalace", localPath: join(tmpRoot, "kb-test") });
    const room = await kb.capture({
      wing: season.season!.seasonId,
      hall: "learnings",
      content: "E2E test completed successfully",
      tags: ["e2e", "test"],
    });
    expect(room.id).toBeDefined();

    // Step 6: Counselor invocation (stub models)
    const counselor = new Counselor([
      new StubModelClient("gemini", "gemini-family", 5),
      new StubModelClient("gpt5", "gpt-family", 4),
      new StubModelClient("opus", "claude-family", 5),
      new StubModelClient("grok", "grok-family", 4),
    ]);
    const verdict = await counselor.invoke({
      placement: "C",
      convener: "stephen-hawking",
      prompt_context: { system: "Resolve deadlock.", user: "Two approaches proposed." },
    });
    expect(verdict.consensus).toBeDefined();
    expect(verdict.consensus.approved).toBe(true);

    // Step 7: Mid-season expansion
    const gap = detectGap(
      "new_role_needed",
      "need iOS mobile development",
      ["user request"],
      { archetypes: chars, tier: "large" },
    );
    if (gap) {
      const expansion = midSeasonSpawn({
        seasonPath: season.season!.path,
        theme: "tbbt",
        proposal: {
          archetype: gap.suggested_archetype,
          rationale: gap.description,
          split_trigger: gap.trigger,
          suggested_character: null,
          estimated_impact: "Adds mobile capability",
        },
      });
      expect(expansion.success).toBe(true);
    }

    // Step 8: Archive season
    await archiveSeason(season.season!.path, tmpRoot);
    const archivedPath = join(tmpRoot, "seasons", "_archive", season.season!.seasonId);
    expect(existsSync(archivedPath)).toBe(true);

    // Step 9: Uninstall
    const uninstall = await performUninstall({ rootDir: tmpRoot });
    expect(uninstall.success).toBe(true);
    expect(existsSync(tmpRoot)).toBe(false);
  }, 30000); // 30s timeout for full lifecycle
});
