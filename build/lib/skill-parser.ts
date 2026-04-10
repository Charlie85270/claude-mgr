// build/lib/skill-parser.ts
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export interface SkillTree {
  protocols: string[];
  archetypes: Record<string, ArchetypeNode>;
  themes: Record<string, ThemeNode>;
  shared_skills: string[];
}

export interface ArchetypeNode {
  path: string;
  files: string[];
}

export interface ThemeNode {
  path: string;
  theme_yaml: string | null;
  characters: Record<string, CharacterNode>;
}

export interface CharacterNode {
  path: string;
  soul_files: string[];
}

export function parseSkillTree(rootPath: string): SkillTree {
  if (!existsSync(rootPath)) {
    throw new Error(`Skill root does not exist: ${rootPath}`);
  }

  return {
    protocols: discoverProtocols(join(rootPath, "protocols")),
    archetypes: discoverArchetypes(join(rootPath, "archetypes")),
    themes: discoverThemes(join(rootPath, "themes")),
    shared_skills: discoverSharedSkills(join(rootPath, "shared-skills")),
  };
}

function discoverProtocols(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((f) => f.endsWith(".yaml") || f.endsWith(".md"));
}

function discoverArchetypes(path: string): Record<string, ArchetypeNode> {
  if (!existsSync(path)) return {};
  const result: Record<string, ArchetypeNode> = {};
  for (const dir of readdirSync(path)) {
    const fullPath = join(path, dir);
    if (!statSync(fullPath).isDirectory()) continue;
    if (dir.startsWith("_")) continue;
    result[dir] = {
      path: fullPath,
      files: readdirSync(fullPath),
    };
  }
  return result;
}

function discoverThemes(path: string): Record<string, ThemeNode> {
  if (!existsSync(path)) return {};
  const result: Record<string, ThemeNode> = {};
  for (const dir of readdirSync(path)) {
    const fullPath = join(path, dir);
    if (!statSync(fullPath).isDirectory()) continue;
    const charactersPath = join(fullPath, "characters");
    const characters: Record<string, CharacterNode> = {};
    if (existsSync(charactersPath)) {
      for (const charDir of readdirSync(charactersPath)) {
        const charPath = join(charactersPath, charDir);
        if (!statSync(charPath).isDirectory()) continue;
        characters[charDir] = {
          path: charPath,
          soul_files: readdirSync(charPath),
        };
      }
    }
    result[dir] = {
      path: fullPath,
      theme_yaml: existsSync(join(fullPath, "theme.yaml")) ? "theme.yaml" : null,
      characters,
    };
  }
  return result;
}

function discoverSharedSkills(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((d) => {
    const fullPath = join(path, d);
    return statSync(fullPath).isDirectory();
  });
}
