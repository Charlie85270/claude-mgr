import { expect, test, describe } from "bun:test";
import { MempalaceBackend } from "../../build/kb/mempalace-backend.ts";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import type { KBConfig } from "../../build/kb/kb-interface.ts";

describe("E2E KB: capture → retrieve → mirror", () => {
  test("capture on merge, retrieve on next task", async () => {
    const backend = new MempalaceBackend();
    await backend.init({
      mode: "solo",
      backend: "mempalace",
      localPath: `/tmp/factor-echelon-e2e-${Date.now()}`,
    });

    // Simulate post-merge capture
    const room = await backend.capture({
      wing: "season-test-01",
      hall: "learnings",
      content: "Always validate input before database insert to prevent injection",
      tags: ["security", "database", "backend"],
      metadata: {
        character: "sheldon-cooper",
        archetype: "backend-engineer",
        source_task: "implement-user-registration",
      },
    });
    expect(room.id).toBeDefined();
    expect(room.metadata.character).toBe("sheldon-cooper");

    // Simulate pre-task retrieval
    const results = await backend.query({
      wing: "season-test-01",
      hall: "learnings",
      semantic_query: "how to prevent injection attacks on database writes",
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content).toContain("validate input");
  });

  test("multiple halls coexist without interference", async () => {
    const backend = new MempalaceBackend();
    await backend.init({
      mode: "solo",
      backend: "mempalace",
      localPath: `/tmp/factor-echelon-e2e-multi-${Date.now()}`,
    });

    await backend.capture({
      wing: "season-test-01",
      hall: "learnings",
      content: "CSS grid works well for 2D layouts",
      tags: ["frontend"],
    });
    await backend.capture({
      wing: "season-test-01",
      hall: "patterns",
      content: "Use retry with exponential backoff",
      tags: ["resilience"],
    });
    await backend.capture({
      wing: "season-test-01",
      hall: "decisions",
      content: "Chose SQLite over PostgreSQL for local-first storage",
      tags: ["database", "architecture"],
    });
    await backend.capture({
      wing: "season-test-01",
      hall: "reviews",
      subhall: "security",
      content: "Reject PRs with raw SQL string concatenation",
      tags: ["security"],
    });
    await backend.capture({
      wing: "season-test-01",
      hall: "skills",
      subhall: "pending",
      content: "Auto-generate migration rollback scripts",
      tags: ["database", "automation"],
    });

    // Each hall query returns only its own items
    const learnings = await backend.query({ hall: "learnings" });
    expect(learnings.length).toBe(1);
    expect(learnings[0].content).toContain("CSS grid");

    const patterns = await backend.query({ hall: "patterns" });
    expect(patterns.length).toBe(1);

    const decisions = await backend.query({ hall: "decisions" });
    expect(decisions.length).toBe(1);

    const securityReviews = await backend.query({ hall: "reviews", subhall: "security" });
    expect(securityReviews.length).toBe(1);

    const pendingSkills = await backend.query({ hall: "skills", subhall: "pending" });
    expect(pendingSkills.length).toBe(1);

    // Cross-hall query with only tags
    const dbRelated = await backend.query({ tags: ["database"] });
    expect(dbRelated.length).toBe(2); // decisions + pending skill
  });

  test("git mirror reflects captures", async () => {
    const mirrorPath = `/tmp/factor-echelon-mirror-${Date.now()}`;
    const backend = new MempalaceBackend();
    await backend.init({
      mode: "solo",
      backend: "mempalace",
      localPath: `/tmp/factor-echelon-e2e-mirror-${Date.now()}`,
      gitMirrorPath: mirrorPath,
    });

    // Capture should create a commit in the mirror
    const room = await backend.capture({
      wing: "season-test-01",
      hall: "learnings",
      content: "Mirror test: this should appear in git",
      tags: ["mirror-test"],
    });

    // Verify the mirror directory exists and has git history
    expect(existsSync(mirrorPath)).toBe(true);
    const logResult = spawnSync("git", ["log", "--oneline"], {
      cwd: mirrorPath,
      encoding: "utf-8",
    });
    expect(logResult.status).toBe(0);
    // Should have at least 2 commits: init + capture
    const commits = logResult.stdout.trim().split("\n");
    expect(commits.length).toBeGreaterThanOrEqual(2);
    expect(logResult.stdout).toContain("capture: learnings");
  });

  test("delete + recapture lifecycle", async () => {
    const backend = new MempalaceBackend();
    await backend.init({
      mode: "solo",
      backend: "mempalace",
      localPath: `/tmp/factor-echelon-e2e-lifecycle-${Date.now()}`,
    });

    const room = await backend.capture({
      wing: "season-test-01",
      hall: "learnings",
      content: "This will be deleted and replaced",
      tags: ["lifecycle"],
    });
    const id = room.id;

    // Delete it
    await backend.delete(id, "outdated");
    const gone = await backend.getById(id);
    expect(gone).toBeNull();

    // Recapture with updated content
    const room2 = await backend.capture({
      wing: "season-test-01",
      hall: "learnings",
      content: "Updated insight replacing the deleted one",
      tags: ["lifecycle", "v2"],
    });
    expect(room2.id).not.toBe(id);

    const results = await backend.query({ tags: ["lifecycle"] });
    expect(results.length).toBe(1);
    expect(results[0].content).toContain("Updated insight");
  });
});
