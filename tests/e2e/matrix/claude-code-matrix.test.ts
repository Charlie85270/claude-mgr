// tests/e2e/matrix/claude-code-matrix.test.ts — Claude Code target E2E
import { expect, test, describe } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist/claude-code";

describe("Claude Code target matrix", () => {
  test("build produces valid plugin structure", () => {
    expect(existsSync(DIST)).toBe(true);
    expect(existsSync(join(DIST, "plugin.json"))).toBe(true);
    expect(existsSync(join(DIST, "character-index.json"))).toBe(true);
    expect(existsSync(join(DIST, "skill"))).toBe(true);
  });

  test("plugin.json has correct metadata", () => {
    const manifest = JSON.parse(readFileSync(join(DIST, "plugin.json"), "utf-8"));
    expect(manifest.name).toBe("factor-echelon");
    expect(manifest.version).toBeDefined();
  });

  test("character index covers all TBBT characters", () => {
    const index = JSON.parse(readFileSync(join(DIST, "character-index.json"), "utf-8"));
    expect(Object.keys(index).length).toBeGreaterThanOrEqual(30);
    expect(index.penny).toBeDefined();
    expect(index["sheldon-cooper"]).toBeDefined();
  });

  test("all 43 archetypes present", () => {
    const archetypes = readdirSync(join(DIST, "skill", "archetypes")).filter((d) => !d.startsWith("_"));
    expect(archetypes.length).toBe(43);
  });

  test("shared skills present (KB, worktrees, quality-gate, review-gates)", () => {
    const skills = readdirSync(join(DIST, "skill", "shared-skills"));
    expect(skills).toContain("kb-interface");
    expect(skills).toContain("knowledge-capture");
    expect(skills).toContain("knowledge-retrieval");
    expect(skills).toContain("git-worktrees");
    expect(skills).toContain("quality-gate");
    expect(skills).toContain("review-gates");
  });

  test("counselor config present", () => {
    expect(existsSync(join(DIST, "skill", "counselor", "models.yaml"))).toBe(true);
    expect(existsSync(join(DIST, "skill", "counselor", "consensus-rules.yaml"))).toBe(true);
  });

  test("OOBE and CLI skills present", () => {
    expect(existsSync(join(DIST, "skill", "oobe", "SKILL.md"))).toBe(true);
    expect(existsSync(join(DIST, "skill", "cli", "SKILL.md"))).toBe(true);
  });
});
