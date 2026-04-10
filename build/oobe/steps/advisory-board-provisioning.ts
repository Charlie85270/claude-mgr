// build/oobe/steps/advisory-board-provisioning.ts — Step 7: Provision advisory board
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { OOBEStep, OOBEContext } from "../state-machine.ts";

const ADVISORY_BOARD_SRC = "src/team-factory/advisory-board/characters";

export const advisoryBoardProvisioning: OOBEStep = {
  id: "ADVISORY_BOARD_PROVISIONING",
  mandatory: true,
  async run(ctx: OOBEContext) {
    const destDir = join(ctx.rootDir, "advisory-board");
    mkdirSync(destDir, { recursive: true });

    if (!existsSync(ADVISORY_BOARD_SRC)) {
      throw new Error(`Advisory board source not found at ${ADVISORY_BOARD_SRC}`);
    }

    const characters = readdirSync(ADVISORY_BOARD_SRC).filter((d) => !d.startsWith("."));
    const provisioned: string[] = [];

    for (const char of characters) {
      const src = join(ADVISORY_BOARD_SRC, char);
      const dst = join(destDir, char);
      cpSync(src, dst, { recursive: true });
      provisioned.push(char);
    }

    ctx.state.advisory_board_provisioned = provisioned;
    ctx.state.advisory_board_count = provisioned.length;
  },
};
