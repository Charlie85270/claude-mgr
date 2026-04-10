// build/skills/theme-engine.ts
import { readFileSync } from "node:fs";
import { load as yamlLoad } from "js-yaml";
import type { SkillTree } from "../lib/skill-parser.ts";

export interface MappedRoster {
  archetype_to_character: Record<string, string>;
  theme: string;
  secondary_assignments: Record<string, string[]>;
  expanded_from_themes: string[];
  unmapped: string[];
}

export function mapArchetypesToCharacters(
  archetypes: string[],
  themeName: string,
  tree: SkillTree,
): MappedRoster {
  const theme = tree.themes[themeName];
  if (!theme) {
    throw new Error(`Unknown theme: ${themeName}`);
  }

  const roleMappingPath = `${theme.path}/role-mapping.yaml`;
  const rawMapping = yamlLoad(readFileSync(roleMappingPath, "utf-8")) as Record<string, unknown>;
  // Support both flat format ({ archetype: { primary: "char" } }) and
  // wrapped format ({ roles: { archetype: { character: "char" } } })
  const roles = (rawMapping.roles ?? rawMapping) as Record<
    string,
    { primary?: string; character?: string; note?: string }
  >;

  const result: MappedRoster = {
    archetype_to_character: {},
    theme: themeName,
    secondary_assignments: {},
    expanded_from_themes: [],
    unmapped: [],
  };

  for (const archetype of archetypes) {
    const mapping = roles[archetype];
    if (mapping) {
      result.archetype_to_character[archetype] = mapping.primary ?? mapping.character ?? "";
    } else {
      const expanded = tryExpansion(archetype, themeName, tree);
      if (expanded) {
        result.archetype_to_character[archetype] = expanded.character;
        if (!result.expanded_from_themes.includes(expanded.theme)) {
          result.expanded_from_themes.push(expanded.theme);
        }
      } else {
        result.unmapped.push(archetype);
      }
    }
  }

  // Handle Wil Wheaton's secondary
  if (archetypes.includes("adversarial-reviewer") && archetypes.includes("developer-advocate")) {
    result.secondary_assignments["wil-wheaton"] = ["developer-advocate"];
  }

  return result;
}

function tryExpansion(
  archetype: string,
  fromTheme: string,
  tree: SkillTree,
): { character: string; theme: string } | null {
  const theme = tree.themes[fromTheme];
  const themeYaml = yamlLoad(readFileSync(`${theme.path}/theme.yaml`, "utf-8")) as Record<
    string,
    unknown
  >;
  const expansion = themeYaml.expansion as { bundled_themes?: string[] } | undefined;
  const bundledThemes = expansion?.bundled_themes ?? [];

  for (const neighborTheme of bundledThemes) {
    const neighbor = tree.themes[neighborTheme];
    if (!neighbor) continue;
    try {
      const rawNeighbor = yamlLoad(
        readFileSync(`${neighbor.path}/role-mapping.yaml`, "utf-8"),
      ) as Record<string, unknown>;
      const neighborRoles = (rawNeighbor.roles ?? rawNeighbor) as Record<
        string,
        { primary?: string; character?: string }
      >;
      if (neighborRoles[archetype]) {
        const char = neighborRoles[archetype].primary ?? neighborRoles[archetype].character ?? "";
        return { character: char, theme: neighborTheme };
      }
    } catch {
      // role-mapping.yaml not found for this theme, skip
    }
  }

  return null;
}
