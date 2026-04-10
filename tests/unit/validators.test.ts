// tests/unit/validators.test.ts
import { expect, test } from "bun:test";
import { parseSkillTree } from "../../build/lib/skill-parser.ts";
import { validateSkillTree } from "../../build/lib/validators.ts";

test("validateSkillTree passes for valid src/", () => {
  const tree = parseSkillTree("src/team-factory");
  const result = validateSkillTree(tree);
  expect(result.valid).toBe(true);
  expect(result.errors).toEqual([]);
});

test("validateSkillTree fails if character missing SOUL.md", () => {
  const fakeTree = {
    protocols: ["soul-schema.yaml"],
    archetypes: {},
    themes: {
      tbbt: {
        path: "fake",
        theme_yaml: "theme.yaml",
        characters: {
          broken: {
            path: "fake/broken",
            soul_files: ["AGENTS.md"],
          },
        },
      },
    },
    shared_skills: [],
  };
  // biome-ignore lint/suspicious/noExplicitAny: intentional fake fixture for negative test
  const result = validateSkillTree(fakeTree as any);
  expect(result.valid).toBe(false);
  expect(result.errors.some((e) => e.includes("SOUL.md"))).toBe(true);
});
