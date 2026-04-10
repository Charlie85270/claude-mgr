// tests/smoke/echelon.test.ts
import { expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist/echelon";

test("smoke(echelon): dist/echelon/ exists after build", () => {
  expect(existsSync(DIST)).toBe(true);
});

test("smoke(echelon): tbbt season pack exists", () => {
  expect(existsSync(join(DIST, "tbbt"))).toBe(true);
  expect(existsSync(join(DIST, "tbbt", "pack.yaml"))).toBe(true);
  expect(existsSync(join(DIST, "tbbt", "roster.manifest.yaml"))).toBe(true);
  expect(existsSync(join(DIST, "tbbt", "character-index.json"))).toBe(true);
});

test("smoke(echelon): pack.yaml contains required fields", () => {
  const content = readFileSync(join(DIST, "tbbt", "pack.yaml"), "utf-8");
  expect(content).toContain('pack_version: "0.1.0"');
  expect(content).toContain('theme: "tbbt"');
  expect(content).toContain('build_target: "echelon"');
  expect(content).toContain("archetypes:");
  expect(content).toContain("characters:");
});

test("smoke(echelon): characters directory has Penny's soul package", () => {
  const pennyDir = join(DIST, "tbbt", "characters", "penny");
  expect(existsSync(pennyDir)).toBe(true);
  expect(existsSync(join(pennyDir, "SOUL.md"))).toBe(true);
  expect(existsSync(join(pennyDir, "AGENTS.md"))).toBe(true);
  expect(existsSync(join(pennyDir, "HEARTBEAT.md"))).toBe(true);
  expect(existsSync(join(pennyDir, "MEMORY.seed.md"))).toBe(true);
});

test("smoke(echelon): archetypes directory is populated", () => {
  const archetypes = readdirSync(join(DIST, "tbbt", "archetypes")).filter(
    (n) => !n.startsWith("_"),
  );
  expect(archetypes.length).toBe(43);
  expect(archetypes).toContain("ingestion-pm");
  expect(archetypes).toContain("backend-engineer");
});

test("smoke(echelon): shared-skills are included", () => {
  expect(existsSync(join(DIST, "tbbt", "shared-skills", "kb-interface"))).toBe(true);
  expect(existsSync(join(DIST, "tbbt", "shared-skills", "knowledge-capture"))).toBe(true);
  expect(existsSync(join(DIST, "tbbt", "shared-skills", "knowledge-retrieval"))).toBe(true);
});

test("smoke(echelon): protocols directory is included", () => {
  expect(existsSync(join(DIST, "tbbt", "protocols", "soul-schema.yaml"))).toBe(true);
  expect(existsSync(join(DIST, "tbbt", "protocols", "echelon-pack-schema.yaml"))).toBe(true);
});

test("smoke(echelon): theme metadata is included", () => {
  expect(existsSync(join(DIST, "tbbt", "theme", "theme.yaml"))).toBe(true);
  expect(existsSync(join(DIST, "tbbt", "theme", "role-mapping.yaml"))).toBe(true);
});

test("smoke(echelon): young-sheldon season pack exists", () => {
  expect(existsSync(join(DIST, "young-sheldon"))).toBe(true);
  expect(existsSync(join(DIST, "young-sheldon", "pack.yaml"))).toBe(true);
  expect(existsSync(join(DIST, "young-sheldon", "characters", "meemaw"))).toBe(true);
});

test("smoke(echelon): character-index contains Penny", () => {
  const content = readFileSync(join(DIST, "tbbt", "character-index.json"), "utf-8");
  const index = JSON.parse(content);
  expect(index.penny).toBeDefined();
  expect(index.penny.theme).toBe("tbbt");
});
