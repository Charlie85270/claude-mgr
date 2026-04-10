// build/oobe/steps/theme-selection.ts — Step 3: Select theme
import { existsSync, readdirSync } from "node:fs";
import type { OOBEStep, OOBEContext } from "../state-machine.ts";

const THEMES_DIR = "src/team-factory/themes";

export type ThemeSelector = (available: string[]) => Promise<string>;

let themeSelector: ThemeSelector = async (available) => {
  // Default: pick tbbt if available, otherwise first available
  return available.includes("tbbt") ? "tbbt" : available[0];
};

export function setThemeSelector(selector: ThemeSelector): void {
  themeSelector = selector;
}

export const themeSelection: OOBEStep = {
  id: "THEME_SELECTION",
  mandatory: true,
  async run(ctx: OOBEContext) {
    const available = existsSync(THEMES_DIR)
      ? readdirSync(THEMES_DIR).filter((d) => !d.startsWith("."))
      : ["tbbt"];

    const selected = await themeSelector(available);

    if (!available.includes(selected)) {
      throw new Error(`Theme "${selected}" not available. Choose from: ${available.join(", ")}`);
    }

    ctx.state.theme = selected;
    ctx.state.available_themes = available;
  },
};
