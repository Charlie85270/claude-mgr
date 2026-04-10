// build/build.ts
import { parseSkillTree } from "./lib/skill-parser.ts";
import { validateSkillTree } from "./lib/validators.ts";
import { buildClaudeCode } from "./targets/claude-code.ts";
import { buildOpenClaw } from "./targets/openclaw.ts";
import { buildEchelon } from "./targets/echelon.ts";

const SOURCE_ROOT = "../src/team-factory";
const CLAUDE_CODE_ADAPTER_ROOT = "../adapters/claude-code";
const OPENCLAW_ADAPTER_ROOT = "../adapters/openclaw";
const ECHELON_ADAPTER_ROOT = "../adapters/echelon";

function main(): number {
  console.log("[factor-echelon] Starting build");

  // Parse
  console.log("[factor-echelon] Parsing src/ tree");
  const tree = parseSkillTree(SOURCE_ROOT);
  console.log(
    `[factor-echelon]   found ${Object.keys(tree.archetypes).length} archetypes, ${
      Object.keys(tree.themes).length
    } themes`,
  );

  // Validate
  console.log("[factor-echelon] Validating");
  const validation = validateSkillTree(tree);
  if (!validation.valid) {
    console.error("[factor-echelon] Validation failed:");
    for (const err of validation.errors) {
      console.error(`  - ${err}`);
    }
    return 1;
  }
  console.log("[factor-echelon]   validation passed");

  // Build Claude Code target
  console.log("[factor-echelon] Building Claude Code plugin");
  const result = buildClaudeCode(tree, {
    sourceRoot: SOURCE_ROOT,
    adapterRoot: CLAUDE_CODE_ADAPTER_ROOT,
    outputRoot: "../dist/claude-code",
  });
  if (!result.success) {
    console.error("[factor-echelon] Build failed:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    return 1;
  }
  console.log(`[factor-echelon]   → ${result.outputPath}`);

  // Build OpenClaw target
  console.log("[factor-echelon] Building OpenClaw bundle");
  const openclawResult = buildOpenClaw(tree, {
    sourceRoot: SOURCE_ROOT,
    adapterRoot: OPENCLAW_ADAPTER_ROOT,
    outputRoot: "../dist/openclaw",
  });
  if (!openclawResult.success) {
    console.error("[factor-echelon] OpenClaw build failed:");
    for (const err of openclawResult.errors) {
      console.error(`  - ${err}`);
    }
    return 1;
  }
  console.log(`[factor-echelon]   → ${openclawResult.outputPath}`);

  // Build Echelon target
  console.log("[factor-echelon] Building Echelon season packs");
  const echelonResult = buildEchelon(tree, {
    sourceRoot: SOURCE_ROOT,
    adapterRoot: ECHELON_ADAPTER_ROOT,
    outputRoot: "../dist/echelon",
  });
  if (!echelonResult.success) {
    console.error("[factor-echelon] Echelon build failed:");
    for (const err of echelonResult.errors) {
      console.error(`  - ${err}`);
    }
    return 1;
  }
  console.log(`[factor-echelon]   → ${echelonResult.outputPath} (${echelonResult.themes.length} themes)`);

  console.log("[factor-echelon] Build complete (3 targets)");
  return 0;
}

process.exit(main());
