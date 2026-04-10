import { expect, test, describe } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  runOOBE,
  type OOBEStep,
  type OOBEStepId,
  STEPS_ORDER,
} from "../../build/oobe/state-machine.ts";
import { platformPrereqs } from "../../build/oobe/steps/platform-prereqs.ts";
import { userProfileInterview, setProfileProvider } from "../../build/oobe/steps/user-profile-interview.ts";
import { themeSelection, setThemeSelector } from "../../build/oobe/steps/theme-selection.ts";
import { counselorApiKeys, setKeyProvider } from "../../build/oobe/steps/counselor-api-keys.ts";
import { kbModeSelection } from "../../build/oobe/steps/kb-mode-selection.ts";
import { mempalaceInit } from "../../build/oobe/steps/mempalace-init.ts";
import { advisoryBoardProvisioning } from "../../build/oobe/steps/advisory-board-provisioning.ts";
import { channelConfig } from "../../build/oobe/steps/channel-config.ts";

function makeSteps(): Record<OOBEStepId, OOBEStep> {
  return {
    PLATFORM_PREREQS: platformPrereqs,
    USER_PROFILE_INTERVIEW: userProfileInterview,
    THEME_SELECTION: themeSelection,
    COUNSELOR_API_KEYS: counselorApiKeys,
    KB_MODE_SELECTION: kbModeSelection,
    MEMPALACE_INIT: mempalaceInit,
    ADVISORY_BOARD_PROVISIONING: advisoryBoardProvisioning,
    CHANNEL_CONFIG: channelConfig,
  };
}

const tmpRoot = () => `/tmp/factor-echelon-oobe-${Date.now()}-${Math.random().toString(36).slice(2)}`;

describe("OOBE state machine", () => {
  test("full 8-step flow completes", async () => {
    setProfileProvider(async () => ({
      name: "Test User",
      timezone: "America/Los_Angeles",
      role: "developer",
      team_size: 1,
      preferred_channels: ["local"],
    }));
    setThemeSelector(async () => "tbbt");
    setKeyProvider(async () => ({ gemini: "test-key-1", gpt5: "test-key-2", opus: "test-key-3", grok: "test-key-4" }));

    const root = tmpRoot();
    const result = await runOOBE(root, makeSteps());

    expect(result.completed).toBe(true);
    expect(result.checkpoints.length).toBe(8);
    expect(existsSync(join(root, "config.json"))).toBe(true);
    expect(existsSync(join(root, ".oobe-state"))).toBe(true);
    expect(existsSync(join(root, "knowledge-base", "local"))).toBe(true);
    expect(existsSync(join(root, "advisory-board"))).toBe(true);
  });

  test("resume after interruption", async () => {
    const root = tmpRoot();

    // Create a fake .oobe-state with 3 steps completed
    const { writeFileSync, mkdirSync } = await import("node:fs");
    mkdirSync(root, { recursive: true });
    writeFileSync(
      join(root, ".oobe-state"),
      JSON.stringify({
        state: { platform_prereqs: [{ name: "git", ok: true }] },
        checkpoints: ["PLATFORM_PREREQS", "USER_PROFILE_INTERVIEW", "THEME_SELECTION"],
      }),
    );

    setKeyProvider(async () => ({}));
    const result = await runOOBE(root, makeSteps());

    expect(result.completed).toBe(true);
    expect(result.checkpoints.length).toBe(8);
    // The first 3 should have been skipped
  });

  test("force reset restarts from scratch", async () => {
    const root = tmpRoot();

    // Pre-populate with completed state
    const { writeFileSync, mkdirSync } = await import("node:fs");
    mkdirSync(root, { recursive: true });
    writeFileSync(
      join(root, ".oobe-state"),
      JSON.stringify({ state: {}, checkpoints: STEPS_ORDER }),
    );

    setProfileProvider(async () => ({
      name: "Reset User", timezone: "UTC", role: "admin", team_size: 5, preferred_channels: [],
    }));

    const result = await runOOBE(root, makeSteps(), { forceReset: true });
    expect(result.completed).toBe(true);

    // State should have fresh profile data
    const config = JSON.parse(readFileSync(join(root, "config.json"), "utf-8"));
    expect(config.state.user_profile.name).toBe("Reset User");
  });

  test("optional step failure doesn't halt OOBE", async () => {
    const root = tmpRoot();
    const steps = makeSteps();

    // Make the optional COUNSELOR_API_KEYS step throw
    steps.COUNSELOR_API_KEYS = {
      id: "COUNSELOR_API_KEYS",
      mandatory: false,
      async run() { throw new Error("keychain unavailable"); },
    };

    const result = await runOOBE(root, steps);
    expect(result.completed).toBe(true);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain("COUNSELOR_API_KEYS");
  });

  test("advisory board provisions all 12 characters", async () => {
    const root = tmpRoot();
    const result = await runOOBE(root, makeSteps());

    expect(result.completed).toBe(true);
    const config = JSON.parse(readFileSync(join(root, "config.json"), "utf-8"));
    expect(config.state.advisory_board_count).toBe(12);
  });
});
