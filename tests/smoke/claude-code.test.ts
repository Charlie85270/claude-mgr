// tests/smoke/claude-code.test.ts
import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = "dist/claude-code";

test("smoke: dist/claude-code/ exists after build", () => {
  expect(existsSync(DIST_DIR)).toBe(true);
});

test("smoke: plugin.json is valid JSON and has required fields", () => {
  const content = readFileSync(join(DIST_DIR, "plugin.json"), "utf-8");
  const manifest = JSON.parse(content);
  expect(manifest.name).toBe("factor-echelon");
  expect(manifest.version).toBeDefined();
  expect(manifest.claudeCode).toBeDefined();
});

test("smoke: character-index contains Penny", () => {
  const content = readFileSync(join(DIST_DIR, "character-index.json"), "utf-8");
  const index = JSON.parse(content);
  expect(index.penny).toBeDefined();
  expect(index.penny.theme).toBe("tbbt");
});

test("smoke: Penny's SOUL.md is present in skill/", () => {
  const soulPath = join(DIST_DIR, "skill/themes/tbbt/characters/penny/SOUL.md");
  expect(existsSync(soulPath)).toBe(true);
  const content = readFileSync(soulPath, "utf-8");
  expect(content).toContain("character_name: Penny");
  expect(content).toContain("Who I Am");
});

test("smoke: ingestion-pm archetype is present in skill/", () => {
  const archetypePath = join(DIST_DIR, "skill/archetypes/ingestion-pm/archetype.yaml");
  expect(existsSync(archetypePath)).toBe(true);
});

test("smoke: protocols directory is present", () => {
  expect(existsSync(join(DIST_DIR, "skill/protocols/soul-schema.yaml"))).toBe(true);
  expect(existsSync(join(DIST_DIR, "skill/protocols/theme-schema.yaml"))).toBe(true);
});
