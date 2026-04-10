import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parsePRD } from "../../build/lib/prd-parser.ts";
import { parseSkillTree } from "../../build/lib/skill-parser.ts";
import { resolveCapabilities } from "../../build/skills/capability-resolver.ts";
import { composeInitialRoster } from "../../build/skills/roster-composer.ts";
import { mapArchetypesToCharacters } from "../../build/skills/theme-engine.ts";

test("E2E: PRD → roster → characters → capabilities", () => {
  const prd = parsePRD(readFileSync("tests/fixtures/prds/medium-saas.md", "utf-8"));
  const roster = composeInitialRoster(prd);
  expect(roster.archetypes.length).toBeGreaterThanOrEqual(10);

  const tree = parseSkillTree("src/team-factory");
  const mapped = mapArchetypesToCharacters(roster.archetypes, "tbbt", tree);
  expect(mapped.unmapped).toEqual([]);

  const bound = resolveCapabilities(mapped.archetype_to_character);
  expect(bound.length).toBe(roster.archetypes.length);
  for (const b of bound) {
    expect(b.granted.length).toBeGreaterThan(0);
  }
});
