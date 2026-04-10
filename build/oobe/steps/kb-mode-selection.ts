// build/oobe/steps/kb-mode-selection.ts — Step 5: Select KB mode (solo vs team)
import type { OOBEStep, OOBEContext } from "../state-machine.ts";

export type KBModeSelector = () => Promise<"solo" | "team">;

let modeSelector: KBModeSelector = async () => "solo"; // v0.1 default

export function setKBModeSelector(selector: KBModeSelector): void {
  modeSelector = selector;
}

export const kbModeSelection: OOBEStep = {
  id: "KB_MODE_SELECTION",
  mandatory: true,
  async run(ctx: OOBEContext) {
    const mode = await modeSelector();
    ctx.state.kb_mode = mode;

    if (mode === "team") {
      // Team mode is v0.5+ — warn and set a flag
      ctx.state.kb_team_mode_deferred = true;
    }
  },
};
