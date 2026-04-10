// tests/smoke/openclaw.test.ts
import { expect, test } from "bun:test";
import { existsSync, statSync } from "node:fs";

const DIST = "dist/openclaw";

test("smoke(openclaw): dist/openclaw exists after build", () => {
  expect(existsSync(DIST)).toBe(true);
});

test("smoke(openclaw): bundle contains openclaw.json", () => {
  expect(existsSync(`${DIST}/openclaw.json`)).toBe(true);
});

test("smoke(openclaw): bundle contains install.sh", () => {
  expect(existsSync(`${DIST}/install.sh`)).toBe(true);
});

test("smoke(openclaw): skill directory is populated", () => {
  expect(existsSync(`${DIST}/skill/archetypes/ingestion-pm/archetype.yaml`)).toBe(true);
  expect(existsSync(`${DIST}/skill/themes/tbbt/characters/penny/SOUL.md`)).toBe(true);
});

test("smoke(openclaw): install.sh is executable", () => {
  const stat = statSync(`${DIST}/install.sh`);
  expect((stat.mode & 0o111) !== 0).toBe(true);
});
