import { expect, test, describe } from "bun:test";
import { spawnSeason } from "../../build/runtime/season-manager.ts";
import { provisionChannels, archiveChannels } from "../../build/multi-season/channel-multiplex.ts";
import { enforceSeasonIsolation } from "../../build/multi-season/isolation-enforcer.ts";
import { setActiveSeason, getActiveSeason, clearActiveSeason } from "../../build/multi-season/context-switcher.ts";

describe("multi-season", () => {
  const tmpRoot = () => `/tmp/factor-echelon-multi-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  test("provision channels creates per-season set", () => {
    const channels = provisionChannels("season-01-alpha");
    expect(channels.primary).toBe("#season-01-alpha-pennys-apartment");
    expect(channels.leonards_office).toBe("#season-01-alpha-leonards-office");
    expect(channels.review_gates).toBe("#season-01-alpha-gates");
  });

  test("archive channels adds suffix", () => {
    const channels = provisionChannels("season-01-alpha");
    const archived = archiveChannels(channels);
    expect(archived.primary).toContain("-archived");
  });

  test("isolation: character in season A cannot access season B", async () => {
    const root = tmpRoot();
    const s1 = await spawnSeason({ slug: "alpha", theme: "tbbt", tier: "medium", roster: [], rootDir: root });
    const s2 = await spawnSeason({ slug: "beta", theme: "tbbt", tier: "medium", roster: [], rootDir: root });

    const result = enforceSeasonIsolation(s1.seasonId, `${s2.path}/manifest.yaml`);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cross-season");
  });

  test("isolation: character can access own season", async () => {
    const root = tmpRoot();
    const s1 = await spawnSeason({ slug: "alpha", theme: "tbbt", tier: "medium", roster: [], rootDir: root });

    const result = enforceSeasonIsolation(s1.seasonId, `${s1.path}/manifest.yaml`);
    expect(result.allowed).toBe(true);
  });

  test("isolation: advisory board is shared across seasons", async () => {
    const root = tmpRoot();
    const s1 = await spawnSeason({ slug: "alpha", theme: "tbbt", tier: "medium", roster: [], rootDir: root });

    const result = enforceSeasonIsolation(s1.seasonId, `${root}/advisory-board/steve-jobs/SOUL.md`);
    expect(result.allowed).toBe(true);
  });

  test("context switcher: set and get active season", () => {
    const root = tmpRoot();
    const { mkdirSync } = require("node:fs");
    mkdirSync(root, { recursive: true });

    setActiveSeason("season-01-alpha", root);
    expect(getActiveSeason(root)).toBe("season-01-alpha");

    setActiveSeason("season-02-beta", root);
    expect(getActiveSeason(root)).toBe("season-02-beta");
  });

  test("context switcher: clear active season", () => {
    const root = tmpRoot();
    const { mkdirSync } = require("node:fs");
    mkdirSync(root, { recursive: true });

    setActiveSeason("season-01-alpha", root);
    clearActiveSeason(root);
    expect(getActiveSeason(root)).toBeNull();
  });

  test("context switcher: returns null when no context set", () => {
    const root = tmpRoot();
    expect(getActiveSeason(root)).toBeNull();
  });

  test("two seasons run concurrently without interference", async () => {
    const root = tmpRoot();
    const s1 = await spawnSeason({ slug: "project-alpha", theme: "tbbt", tier: "medium", roster: [], rootDir: root });
    const s2 = await spawnSeason({ slug: "project-beta", theme: "tbbt", tier: "large", roster: [], rootDir: root });

    expect(s1.success).toBe(true);
    expect(s2.success).toBe(true);
    expect(s1.seasonId).not.toBe(s2.seasonId);

    // Each has isolated channels
    const ch1 = provisionChannels(s1.seasonId);
    const ch2 = provisionChannels(s2.seasonId);
    expect(ch1.primary).not.toBe(ch2.primary);

    // Cross-season access is denied
    expect(enforceSeasonIsolation(s1.seasonId, `${s2.path}/workspace/`).allowed).toBe(false);
    expect(enforceSeasonIsolation(s2.seasonId, `${s1.path}/workspace/`).allowed).toBe(false);
  });
});
