// tests/smoke/parity.test.ts
// Verify all three adapters ship the same content, even if packaged differently
import { expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CLAUDE_CODE_SKILL = "dist/claude-code/skill";
const OPENCLAW_SKILL = "dist/openclaw/skill";
// Echelon packs per-theme; use tbbt as the reference
const ECHELON_TBBT = "dist/echelon/tbbt";

function collectFiles(root: string, prefix = ""): Set<string> {
  const result = new Set<string>();
  if (!existsSync(root)) return result;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      for (const sub of collectFiles(join(root, entry.name), relPath)) {
        result.add(sub);
      }
    } else {
      result.add(relPath);
    }
  }
  return result;
}

test("parity: both targets ship the same set of skill files", () => {
  const claudeFiles = collectFiles(CLAUDE_CODE_SKILL);
  const openclawFiles = collectFiles(OPENCLAW_SKILL);
  expect(claudeFiles.size).toBe(openclawFiles.size);
  expect([...claudeFiles].sort()).toEqual([...openclawFiles].sort());
});

test("parity: Penny's SOUL.md is identical between targets", () => {
  const claude = readFileSync(`${CLAUDE_CODE_SKILL}/themes/tbbt/characters/penny/SOUL.md`, "utf-8");
  const openclaw = readFileSync(`${OPENCLAW_SKILL}/themes/tbbt/characters/penny/SOUL.md`, "utf-8");
  expect(claude).toBe(openclaw);
});

test("parity: all 43 archetypes present in both targets", () => {
  const claudeArchetypes = readdirSync(`${CLAUDE_CODE_SKILL}/archetypes`).filter(
    (n) => !n.startsWith("_"),
  );
  const openclawArchetypes = readdirSync(`${OPENCLAW_SKILL}/archetypes`).filter(
    (n) => !n.startsWith("_"),
  );
  expect(claudeArchetypes.length).toBe(43);
  expect(openclawArchetypes.length).toBe(43);
  expect(claudeArchetypes.sort()).toEqual(openclawArchetypes.sort());
});

test("parity: TBBT + Young Sheldon characters present in both targets", () => {
  const claudeChars = readdirSync(`${CLAUDE_CODE_SKILL}/themes/tbbt/characters`);
  const openclawChars = readdirSync(`${OPENCLAW_SKILL}/themes/tbbt/characters`);
  expect(claudeChars.sort()).toEqual(openclawChars.sort());
  expect(claudeChars.length).toBeGreaterThanOrEqual(30);
});

test("parity: Echelon tbbt characters match other targets", () => {
  const claudeChars = readdirSync(`${CLAUDE_CODE_SKILL}/themes/tbbt/characters`);
  const echelonChars = readdirSync(`${ECHELON_TBBT}/characters`);
  expect(echelonChars.sort()).toEqual(claudeChars.sort());
});

test("parity: Echelon archetypes match other targets", () => {
  const claudeArchetypes = readdirSync(`${CLAUDE_CODE_SKILL}/archetypes`).filter(
    (n) => !n.startsWith("_"),
  );
  const echelonArchetypes = readdirSync(`${ECHELON_TBBT}/archetypes`).filter(
    (n) => !n.startsWith("_"),
  );
  expect(echelonArchetypes.length).toBe(43);
  expect(echelonArchetypes.sort()).toEqual(claudeArchetypes.sort());
});

test("parity: Penny's SOUL.md is identical across all 3 targets", () => {
  const claude = readFileSync(`${CLAUDE_CODE_SKILL}/themes/tbbt/characters/penny/SOUL.md`, "utf-8");
  const openclaw = readFileSync(`${OPENCLAW_SKILL}/themes/tbbt/characters/penny/SOUL.md`, "utf-8");
  const echelon = readFileSync(`${ECHELON_TBBT}/characters/penny/SOUL.md`, "utf-8");
  expect(claude).toBe(openclaw);
  expect(claude).toBe(echelon);
});
