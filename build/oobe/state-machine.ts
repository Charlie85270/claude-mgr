// build/oobe/state-machine.ts — Resumable 8-step OOBE state machine
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export type OOBEStepId =
  | "PLATFORM_PREREQS"
  | "USER_PROFILE_INTERVIEW"
  | "THEME_SELECTION"
  | "COUNSELOR_API_KEYS"
  | "KB_MODE_SELECTION"
  | "MEMPALACE_INIT"
  | "ADVISORY_BOARD_PROVISIONING"
  | "CHANNEL_CONFIG";

export interface OOBEStep {
  id: OOBEStepId;
  mandatory: boolean;
  run: (ctx: OOBEContext) => Promise<void>;
}

export interface OOBEContext {
  rootDir: string;
  state: Record<string, unknown>;
  checkpoints: Set<OOBEStepId>;
}

export interface OOBEResult {
  completed: boolean;
  checkpoints: OOBEStepId[];
  errors: string[];
}

export const STEPS_ORDER: OOBEStepId[] = [
  "PLATFORM_PREREQS",
  "USER_PROFILE_INTERVIEW",
  "THEME_SELECTION",
  "COUNSELOR_API_KEYS",
  "KB_MODE_SELECTION",
  "MEMPALACE_INIT",
  "ADVISORY_BOARD_PROVISIONING",
  "CHANNEL_CONFIG",
];

export async function runOOBE(
  rootDir: string,
  steps: Record<OOBEStepId, OOBEStep>,
  options: { forceReset?: boolean } = {},
): Promise<OOBEResult> {
  mkdirSync(rootDir, { recursive: true });
  const statePath = join(rootDir, ".oobe-state");
  const errors: string[] = [];

  // Load or initialize context
  let savedState: Record<string, unknown> = {};
  let savedCheckpoints: OOBEStepId[] = [];

  if (existsSync(statePath) && !options.forceReset) {
    try {
      const raw = JSON.parse(readFileSync(statePath, "utf-8"));
      savedState = raw.state ?? {};
      savedCheckpoints = raw.checkpoints ?? [];
    } catch {
      // Corrupted state file — start fresh
    }
  }

  const ctx: OOBEContext = {
    rootDir,
    state: savedState,
    checkpoints: new Set(savedCheckpoints),
  };

  for (const stepId of STEPS_ORDER) {
    if (ctx.checkpoints.has(stepId)) {
      continue; // already completed
    }
    try {
      await steps[stepId].run(ctx);
      ctx.checkpoints.add(stepId);
      persistState(statePath, ctx);
    } catch (e) {
      const errMsg = (e as Error).message;
      errors.push(`${stepId}: ${errMsg}`);
      if (steps[stepId].mandatory) {
        return {
          completed: false,
          checkpoints: Array.from(ctx.checkpoints),
          errors,
        };
      }
      // Optional step failed — skip and continue
      ctx.checkpoints.add(stepId);
      persistState(statePath, ctx);
    }
  }

  // Write final config
  writeFileSync(
    join(rootDir, "config.json"),
    JSON.stringify({ completed_at: new Date().toISOString(), state: ctx.state }, null, 2),
  );

  return {
    completed: true,
    checkpoints: Array.from(ctx.checkpoints),
    errors,
  };
}

function persistState(path: string, ctx: OOBEContext): void {
  writeFileSync(
    path,
    JSON.stringify({ state: ctx.state, checkpoints: Array.from(ctx.checkpoints) }, null, 2),
  );
}
