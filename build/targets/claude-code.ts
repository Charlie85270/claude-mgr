// build/targets/claude-code.ts
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { SkillTree } from "../lib/skill-parser.ts";

const OUTPUT_DIR = "dist/claude-code";

export interface BuildOptions {
  sourceRoot: string;
  adapterRoot: string;
  outputRoot?: string;
}

export interface BuildResult {
  success: boolean;
  outputPath: string;
  errors: string[];
}

export function buildClaudeCode(tree: SkillTree, options: BuildOptions): BuildResult {
  const output = options.outputRoot ?? OUTPUT_DIR;
  const errors: string[] = [];

  // Clean output directory
  if (existsSync(output)) {
    rmSync(output, { recursive: true });
  }
  mkdirSync(output, { recursive: true });

  // Copy src/team-factory/ into output
  try {
    cpSync(options.sourceRoot, join(output, "skill"), { recursive: true });
  } catch (e) {
    errors.push(`copy skill: ${(e as Error).message}`);
    return { success: false, outputPath: output, errors };
  }

  // Copy plugin.json manifest from adapter template
  try {
    const manifestTemplate = readFileSync(join(options.adapterRoot, "plugin.json"), "utf-8");
    writeFileSync(join(output, "plugin.json"), manifestTemplate);
  } catch (e) {
    errors.push(`copy manifest: ${(e as Error).message}`);
    return { success: false, outputPath: output, errors };
  }

  // Write character index for fast lookup
  const characterIndex: Record<string, { theme: string; archetype: string | null }> = {};
  for (const [themeName, theme] of Object.entries(tree.themes)) {
    for (const charName of Object.keys(theme.characters)) {
      characterIndex[charName] = { theme: themeName, archetype: null };
    }
  }
  writeFileSync(join(output, "character-index.json"), JSON.stringify(characterIndex, null, 2));

  return { success: true, outputPath: output, errors: [] };
}
