import { expect, test, describe } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  spawnSeason,
  archiveSeason,
  restoreSeason,
  listSeasons,
} from "../../build/runtime/season-manager.ts";

describe("season-manager", () => {
  const tmpRoot = () => `/tmp/factor-echelon-season-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  test("spawnSeason creates directory structure with manifest", async () => {
    const root = tmpRoot();
    const result = await spawnSeason({
      slug: "test-project",
      theme: "tbbt",
      tier: "medium",
      roster: [
        { archetype: "ingestion-pm", character: "penny", capabilities: ["source-control:read"] },
      ],
      rootDir: root,
    });
    expect(result.success).toBe(true);
    expect(result.seasonId).toBe("season-01-test-project");

    // Directory structure
    expect(existsSync(join(result.path, "season.yaml"))).toBe(true);
    expect(existsSync(join(result.path, "manifest.yaml"))).toBe(true);
    expect(existsSync(join(result.path, "workspace"))).toBe(true);
    expect(existsSync(join(result.path, "characters"))).toBe(true);
    expect(existsSync(join(result.path, "memory"))).toBe(true);
    expect(existsSync(join(result.path, "worktrees"))).toBe(true);
  });

  test("spawnSeason copies character soul packages", async () => {
    const root = tmpRoot();
    const result = await spawnSeason({
      slug: "char-test",
      theme: "tbbt",
      tier: "large",
      roster: [
        { archetype: "ingestion-pm", character: "penny", capabilities: ["source-control:read"] },
      ],
      rootDir: root,
    });
    expect(result.success).toBe(true);
    expect(existsSync(join(result.path, "characters/penny/SOUL.md"))).toBe(true);
    expect(existsSync(join(result.path, "characters/penny/AGENTS.md"))).toBe(true);
    expect(existsSync(join(result.path, "characters/penny/HEARTBEAT.md"))).toBe(true);
  });

  test("spawnSeason writes valid season.yaml", async () => {
    const root = tmpRoot();
    const result = await spawnSeason({
      slug: "yaml-test",
      theme: "tbbt",
      tier: "enterprise",
      roster: [],
      rootDir: root,
    });
    const content = readFileSync(join(result.path, "season.yaml"), "utf-8");
    expect(content).toContain("season_id: season-01-yaml-test");
    expect(content).toContain("theme: tbbt");
    expect(content).toContain("tier: enterprise");
    expect(content).toContain("state: active");
  });

  test("spawnSeason auto-increments season IDs", async () => {
    const root = tmpRoot();
    const r1 = await spawnSeason({ slug: "first", theme: "tbbt", tier: "medium", roster: [], rootDir: root });
    const r2 = await spawnSeason({ slug: "second", theme: "tbbt", tier: "medium", roster: [], rootDir: root });
    expect(r1.seasonId).toBe("season-01-first");
    expect(r2.seasonId).toBe("season-02-second");
  });

  test("archiveSeason moves to _archive and updates state", async () => {
    const root = tmpRoot();
    const spawn = await spawnSeason({ slug: "archive-test", theme: "tbbt", tier: "medium", roster: [], rootDir: root });
    await archiveSeason(spawn.path, root);

    expect(existsSync(spawn.path)).toBe(false);
    const archivedPath = join(root, "seasons", "_archive", "season-01-archive-test");
    expect(existsSync(archivedPath)).toBe(true);

    const archivedContent = readFileSync(join(archivedPath, "season.yaml"), "utf-8");
    expect(archivedContent).toContain("state: archived");
    expect(archivedContent).toContain("archived_at:");
  });

  test("restoreSeason moves back and updates state", async () => {
    const root = tmpRoot();
    const spawn = await spawnSeason({ slug: "restore-test", theme: "tbbt", tier: "medium", roster: [], rootDir: root });
    await archiveSeason(spawn.path, root);
    await restoreSeason("season-01-restore-test", root);

    const restoredPath = join(root, "seasons", "season-01-restore-test");
    expect(existsSync(restoredPath)).toBe(true);

    const restoredContent = readFileSync(join(restoredPath, "season.yaml"), "utf-8");
    expect(restoredContent).toContain("state: active");
    expect(restoredContent).not.toContain("archived_at:");
  });

  test("listSeasons returns active seasons", async () => {
    const root = tmpRoot();
    await spawnSeason({ slug: "a", theme: "tbbt", tier: "medium", roster: [], rootDir: root });
    await spawnSeason({ slug: "b", theme: "tbbt", tier: "medium", roster: [], rootDir: root });
    const seasons = listSeasons(root);
    expect(seasons.length).toBe(2);
    expect(seasons).toContain("season-01-a");
    expect(seasons).toContain("season-02-b");
  });
});
