// tests/unit/skill-parser.test.ts
import { expect, test } from "bun:test";
import { parseSkillTree } from "../../build/lib/skill-parser.ts";

test("parseSkillTree discovers protocols directory", () => {
  const tree = parseSkillTree("src/team-factory");
  expect(tree.protocols).toBeDefined();
  expect(tree.protocols).toContain("soul-schema.yaml");
  expect(tree.protocols).toContain("theme-schema.yaml");
});

test("parseSkillTree discovers archetypes", () => {
  const tree = parseSkillTree("src/team-factory");
  expect(tree.archetypes).toBeDefined();
  expect(Object.keys(tree.archetypes).length).toBeGreaterThan(0);
});

test("parseSkillTree discovers themes and characters", () => {
  const tree = parseSkillTree("src/team-factory");
  expect(tree.themes.tbbt).toBeDefined();
  expect(tree.themes.tbbt.characters.penny).toBeDefined();
});
