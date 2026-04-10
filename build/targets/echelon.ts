// build/targets/echelon.ts — Echelon season pack builder
// Produces dist/echelon/<theme>/ with a self-contained season pack
// that Echelon.app's season-manager can load to spawn a themed season.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { SkillTree } from "../lib/skill-parser.ts";

const OUTPUT_DIR = "dist/echelon";

export interface BuildOptions {
  sourceRoot: string;
  adapterRoot: string;
  outputRoot?: string;
}

export interface BuildResult {
  success: boolean;
  outputPath: string;
  themes: string[];
  errors: string[];
}

export function buildEchelon(tree: SkillTree, options: BuildOptions): BuildResult {
  const output = options.outputRoot ?? OUTPUT_DIR;
  const errors: string[] = [];
  const builtThemes: string[] = [];

  // Clean output directory
  if (existsSync(output)) {
    rmSync(output, { recursive: true });
  }
  mkdirSync(output, { recursive: true });

  // Build one season pack per theme
  for (const [themeName, theme] of Object.entries(tree.themes)) {
    const themePack = join(output, themeName);
    mkdirSync(themePack, { recursive: true });

    // Copy characters with full soul packages
    const charsDir = join(themePack, "characters");
    mkdirSync(charsDir, { recursive: true });
    for (const [charName, char] of Object.entries(theme.characters)) {
      try {
        cpSync(char.path, join(charsDir, charName), { recursive: true });
      } catch (e) {
        errors.push(`copy character ${charName}: ${(e as Error).message}`);
      }
    }

    // Copy archetypes
    const archetypesDir = join(themePack, "archetypes");
    mkdirSync(archetypesDir, { recursive: true });
    for (const [archName, arch] of Object.entries(tree.archetypes)) {
      try {
        cpSync(arch.path, join(archetypesDir, archName), { recursive: true });
      } catch (e) {
        errors.push(`copy archetype ${archName}: ${(e as Error).message}`);
      }
    }

    // Copy shared skills
    const sharedSkillsDir = join(themePack, "shared-skills");
    const sharedSkillsSrc = join(options.sourceRoot, "shared-skills");
    if (existsSync(sharedSkillsSrc)) {
      try {
        cpSync(sharedSkillsSrc, sharedSkillsDir, { recursive: true });
      } catch (e) {
        errors.push(`copy shared-skills: ${(e as Error).message}`);
      }
    }

    // Copy protocols
    const protocolsDir = join(themePack, "protocols");
    const protocolsSrc = join(options.sourceRoot, "protocols");
    if (existsSync(protocolsSrc)) {
      try {
        cpSync(protocolsSrc, protocolsDir, { recursive: true });
      } catch (e) {
        errors.push(`copy protocols: ${(e as Error).message}`);
      }
    }

    // Copy theme metadata (theme.yaml, role-mapping.yaml)
    const themeDir = join(themePack, "theme");
    mkdirSync(themeDir, { recursive: true });
    for (const file of ["theme.yaml", "role-mapping.yaml"]) {
      const src = join(theme.path, file);
      if (existsSync(src)) {
        try {
          cpSync(src, join(themeDir, file));
        } catch (e) {
          errors.push(`copy theme file ${file}: ${(e as Error).message}`);
        }
      }
    }

    // Build character list for pack.yaml
    const characterEntries = Object.entries(theme.characters).map(([name, char]) => ({
      name,
      theme: themeName,
      soul_files: char.soul_files,
    }));

    // Build archetype list for pack.yaml
    const archetypeEntries = Object.entries(tree.archetypes).map(([name]) => ({
      name,
      tier: "large" as const,
      display_name: name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

    // Emit pack.yaml
    const packYaml = buildPackYaml(themeName, archetypeEntries, characterEntries, tree.shared_skills);
    writeFileSync(join(themePack, "pack.yaml"), packYaml);

    // Emit default roster.manifest.yaml (stub — populated when Plan 07 OOBE runs)
    const rosterManifest = buildDefaultRosterManifest(themeName, characterEntries);
    writeFileSync(join(themePack, "roster.manifest.yaml"), rosterManifest);

    // Write character-index.json (consistent with other targets)
    const characterIndex: Record<string, { theme: string; archetype: string | null }> = {};
    for (const charName of Object.keys(theme.characters)) {
      characterIndex[charName] = { theme: themeName, archetype: null };
    }
    writeFileSync(join(themePack, "character-index.json"), JSON.stringify(characterIndex, null, 2));

    builtThemes.push(themeName);
  }

  if (errors.length > 0) {
    return { success: false, outputPath: output, themes: builtThemes, errors };
  }

  return { success: true, outputPath: output, themes: builtThemes, errors: [] };
}

function buildPackYaml(
  theme: string,
  archetypes: { name: string; tier: string; display_name: string }[],
  characters: { name: string; theme: string; soul_files: string[] }[],
  sharedSkills: string[],
): string {
  const lines = [
    `# pack.yaml — Echelon season pack for ${theme}`,
    `# Auto-generated by build/targets/echelon.ts`,
    ``,
    `pack_version: "0.1.0"`,
    `theme: "${theme}"`,
    `tier_default: "large"`,
    ``,
    `archetypes:`,
  ];
  for (const a of archetypes) {
    lines.push(`  - name: "${a.name}"`);
    lines.push(`    tier: "${a.tier}"`);
    lines.push(`    display_name: "${a.display_name}"`);
  }
  lines.push(``);
  lines.push(`characters:`);
  for (const c of characters) {
    lines.push(`  - name: "${c.name}"`);
    lines.push(`    theme: "${c.theme}"`);
    lines.push(`    soul_files:`);
    for (const f of c.soul_files) {
      lines.push(`      - "${f}"`);
    }
  }
  if (sharedSkills.length > 0) {
    lines.push(``);
    lines.push(`shared_skills:`);
    for (const s of sharedSkills) {
      lines.push(`  - "${s}"`);
    }
  }
  lines.push(``);
  lines.push(`metadata:`);
  lines.push(`  built_at: "${new Date().toISOString()}"`);
  lines.push(`  build_target: "echelon"`);
  lines.push(``);
  return lines.join("\n");
}

function buildDefaultRosterManifest(
  theme: string,
  characters: { name: string; theme: string; soul_files: string[] }[],
): string {
  const lines = [
    `# roster.manifest.yaml — default roster for ${theme}`,
    `# Auto-generated by build/targets/echelon.ts`,
    `# This is a starter manifest; Penny's OOBE customizes it per user.`,
    ``,
    `season_id: "season-01-${theme}"`,
    `season_slug: "${theme}-default"`,
    `theme: "${theme}"`,
    `tier: "large"`,
    ``,
    `roster:`,
  ];
  for (const c of characters) {
    lines.push(`  - character: "${c.name}"`);
    lines.push(`    archetype: "TBD"  # mapped by theme-engine at spawn time`);
    lines.push(`    capabilities: []`);
  }
  lines.push(``);
  lines.push(`channels:`);
  lines.push(`  primary: "#${theme}-general"`);
  lines.push(`  review_gates: "#${theme}-gates"`);
  lines.push(`  escalation: "#${theme}-escalation"`);
  lines.push(``);
  lines.push(`user_context:`);
  lines.push(`  user_id: "default"`);
  lines.push(`  interview_summary: "Default roster — customize via Penny's OOBE"`);
  lines.push(``);
  return lines.join("\n");
}
