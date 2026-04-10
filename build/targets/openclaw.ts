// build/targets/openclaw.ts
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { SkillTree } from "../lib/skill-parser.ts";

const OUTPUT_DIR = "dist/openclaw";

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

export function buildOpenClaw(tree: SkillTree, options: BuildOptions): BuildResult {
  const output = options.outputRoot ?? OUTPUT_DIR;
  const errors: string[] = [];

  // Clean output directory
  if (existsSync(output)) {
    rmSync(output, { recursive: true });
  }
  mkdirSync(output, { recursive: true });

  // Copy src/team-factory/ into output/skill/
  try {
    cpSync(options.sourceRoot, join(output, "skill"), { recursive: true });
  } catch (e) {
    errors.push(`copy skill: ${(e as Error).message}`);
    return { success: false, outputPath: output, errors };
  }

  // Copy openclaw.json config from adapter template
  try {
    const config = readFileSync(join(options.adapterRoot, "openclaw.json"), "utf-8");
    writeFileSync(join(output, "openclaw.json"), config);
  } catch (e) {
    errors.push(`copy config: ${(e as Error).message}`);
    return { success: false, outputPath: output, errors };
  }

  // Copy install.sh and preserve executable bit
  try {
    copyFileSync(join(options.adapterRoot, "install.sh"), join(output, "install.sh"));
    // Preserve executable permission
    const { chmodSync } = require("node:fs");
    chmodSync(join(output, "install.sh"), 0o755);
  } catch (e) {
    errors.push(`copy install script: ${(e as Error).message}`);
    return { success: false, outputPath: output, errors };
  }

  // Write character index (same as Claude Code target for parity)
  const characterIndex: Record<string, { theme: string; archetype: string | null }> = {};
  for (const [themeName, theme] of Object.entries(tree.themes)) {
    for (const charName of Object.keys(theme.characters)) {
      characterIndex[charName] = { theme: themeName, archetype: null };
    }
  }
  writeFileSync(join(output, "character-index.json"), JSON.stringify(characterIndex, null, 2));

  return { success: true, outputPath: output, errors: [] };
}
