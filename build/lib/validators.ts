// build/lib/validators.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { load as yamlLoad } from "js-yaml";
import {
  ArchetypeYamlSchema,
  CapabilitiesYamlSchema,
  REQUIRED_CHARACTER_FILES,
  ThemeYamlSchema,
} from "./schemas.ts";
import type { SkillTree } from "./skill-parser.ts";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSkillTree(tree: SkillTree): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate archetypes
  for (const [name, archetype] of Object.entries(tree.archetypes)) {
    const yamlPath = join(archetype.path, "archetype.yaml");
    try {
      const content = readFileSync(yamlPath, "utf-8");
      const parsed = yamlLoad(content);
      ArchetypeYamlSchema.parse(parsed);
    } catch (e) {
      errors.push(`archetype ${name}: ${(e as Error).message}`);
    }

    const capPath = join(archetype.path, "capabilities.yaml");
    try {
      const content = readFileSync(capPath, "utf-8");
      const parsed = yamlLoad(content);
      CapabilitiesYamlSchema.parse(parsed);
    } catch (e) {
      errors.push(`archetype ${name} capabilities: ${(e as Error).message}`);
    }
  }

  // Validate themes
  for (const [themeName, theme] of Object.entries(tree.themes)) {
    if (!theme.theme_yaml) {
      errors.push(`theme ${themeName}: missing theme.yaml`);
      continue;
    }
    const yamlPath = join(theme.path, "theme.yaml");
    try {
      const content = readFileSync(yamlPath, "utf-8");
      const parsed = yamlLoad(content);
      ThemeYamlSchema.parse(parsed);
    } catch (e) {
      errors.push(`theme ${themeName}: ${(e as Error).message}`);
    }

    // Validate characters
    for (const [charName, character] of Object.entries(theme.characters)) {
      for (const required of REQUIRED_CHARACTER_FILES) {
        if (!character.soul_files.includes(required)) {
          errors.push(`character ${themeName}/${charName}: missing ${required}`);
        }
      }
      // Validate SOUL.md frontmatter
      if (character.soul_files.includes("SOUL.md")) {
        try {
          const soulPath = join(character.path, "SOUL.md");
          const content = readFileSync(soulPath, "utf-8");
          const parsed = matter(content);
          if (!parsed.data.character_name) {
            errors.push(`${themeName}/${charName}/SOUL.md: missing character_name frontmatter`);
          }
          if (!parsed.data.archetype) {
            errors.push(`${themeName}/${charName}/SOUL.md: missing archetype frontmatter`);
          }
        } catch (e) {
          errors.push(`${themeName}/${charName}/SOUL.md: ${(e as Error).message}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateSeasonManifest(manifestPath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = readFileSync(manifestPath, "utf-8");
    const data = yamlLoad(content) as Record<string, unknown>;

    // Required fields per roster-manifest-schema.yaml
    const required = ["season_id", "season_slug", "theme", "tier", "roster", "channels", "user_context"];
    for (const field of required) {
      if (!(field in data)) {
        errors.push(`missing required field: ${field}`);
      }
    }

    // Validate season_id pattern
    if (typeof data.season_id === "string" && !/^season-\d{2,}-/.test(data.season_id)) {
      errors.push(`season_id must match pattern season-NN-<slug>, got: ${data.season_id}`);
    }

    // Validate tier
    const validTiers = ["medium", "large", "enterprise"];
    if (data.tier && !validTiers.includes(data.tier as string)) {
      errors.push(`tier must be one of ${validTiers.join(", ")}, got: ${data.tier}`);
    }

    // Validate roster entries
    if (Array.isArray(data.roster)) {
      for (let i = 0; i < data.roster.length; i++) {
        const entry = data.roster[i] as Record<string, unknown>;
        if (!entry.archetype) errors.push(`roster[${i}]: missing archetype`);
        if (!entry.character) errors.push(`roster[${i}]: missing character`);
        if (!entry.capabilities) errors.push(`roster[${i}]: missing capabilities`);
      }
    }
  } catch (e) {
    errors.push(`failed to parse manifest: ${(e as Error).message}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
