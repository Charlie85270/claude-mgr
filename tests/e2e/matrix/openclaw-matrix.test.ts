// tests/e2e/matrix/openclaw-matrix.test.ts — OpenClaw target E2E
import { expect, test, describe } from "bun:test";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist/openclaw";

describe("OpenClaw target matrix", () => {
  test("build produces valid bundle structure", () => {
    expect(existsSync(DIST)).toBe(true);
    expect(existsSync(join(DIST, "openclaw.json"))).toBe(true);
    expect(existsSync(join(DIST, "install.sh"))).toBe(true);
    expect(existsSync(join(DIST, "skill"))).toBe(true);
  });

  test("install.sh is executable", () => {
    const stat = statSync(join(DIST, "install.sh"));
    const isExecutable = (stat.mode & 0o111) !== 0;
    expect(isExecutable).toBe(true);
  });

  test("all 43 archetypes present", () => {
    const archetypes = readdirSync(join(DIST, "skill", "archetypes")).filter((d) => !d.startsWith("_"));
    expect(archetypes.length).toBe(43);
  });

  test("character index covers all TBBT characters", () => {
    const { readFileSync } = require("node:fs");
    const index = JSON.parse(readFileSync(join(DIST, "character-index.json"), "utf-8"));
    expect(Object.keys(index).length).toBeGreaterThanOrEqual(30);
  });

  test("shared skills present", () => {
    const skills = readdirSync(join(DIST, "skill", "shared-skills"));
    expect(skills).toContain("kb-interface");
    expect(skills).toContain("review-gates");
  });
});
