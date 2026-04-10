import { expect, test } from "bun:test";
import { parseSkillTree } from "../../build/lib/skill-parser.ts";
import { mapArchetypesToCharacters } from "../../build/skills/theme-engine.ts";

test("theme-engine maps full TBBT medium roster", () => {
  const tree = parseSkillTree("src/team-factory");
  const medium = [
    "ingestion-pm",
    "user-handler",
    "scrum-master",
    "principal-architect",
    "frontend-engineer",
    "backend-engineer",
    "qa-lead",
    "security-engineer",
    "adversarial-reviewer",
    "code-reviewer",
    "refinement-builder",
  ];
  const mapped = mapArchetypesToCharacters(medium, "tbbt", tree);
  expect(mapped.unmapped).toEqual([]);
  expect(mapped.archetype_to_character["ingestion-pm"]).toBe("penny");
  expect(mapped.archetype_to_character["user-handler"]).toBe("leonard-hofstadter");
});

test("theme-engine uses Young Sheldon expansion for enterprise archetypes", () => {
  const tree = parseSkillTree("src/team-factory");
  const roster = ["ingestion-pm", "platform-engineer", "technical-program-manager"];
  const mapped = mapArchetypesToCharacters(roster, "tbbt", tree);
  expect(mapped.expanded_from_themes).toContain("young-sheldon");
  expect(mapped.archetype_to_character["platform-engineer"]).toBe("dale-ballard");
});
