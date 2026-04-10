import { expect, test, describe } from "bun:test";
import { existsSync } from "node:fs";
import { detectGap, type ExistingRoster } from "../../build/expansion/gap-detection.ts";
import {
  presentProposal,
  autoApprove,
  formatProposalMessage,
  type ExpansionProposal,
} from "../../build/expansion/proposal-flow.ts";
import { midSeasonSpawn } from "../../build/expansion/mid-season-spawn.ts";
import { spawnSeason } from "../../build/runtime/season-manager.ts";

describe("Leonard's continuous expansion", () => {
  const tmpRoot = () => `/tmp/factor-echelon-expand-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  test("detectGap identifies iOS platform gap", () => {
    const roster: ExistingRoster = {
      archetypes: ["backend-engineer", "frontend-engineer"],
      tier: "large",
    };
    const gap = detectGap("new_platform_target", "adding iOS app support", ["user requested mobile"], roster);
    expect(gap).not.toBeNull();
    expect(gap!.suggested_archetype).toBe("platform-engineer");
    expect(gap!.urgency).toBe("immediate");
  });

  test("detectGap identifies mobile role need", () => {
    const roster: ExistingRoster = {
      archetypes: ["backend-engineer", "frontend-engineer"],
      tier: "large",
    };
    const gap = detectGap("new_role_needed", "need iOS mobile development", ["new mobile feature"], roster);
    expect(gap).not.toBeNull();
    expect(gap!.suggested_archetype).toBe("mobile-ios-engineer");
  });

  test("detectGap returns null if archetype already on roster", () => {
    const roster: ExistingRoster = {
      archetypes: ["backend-engineer", "platform-engineer"],
      tier: "large",
    };
    const gap = detectGap("new_platform_target", "adding support", ["new target"], roster);
    expect(gap).toBeNull();
  });

  test("presentProposal with auto-approve", async () => {
    const proposal: ExpansionProposal = {
      archetype: "mobile-ios-engineer",
      rationale: "User requested iOS mobile support",
      split_trigger: "new_platform_target",
      suggested_character: null,
      estimated_impact: "Adds iOS build and test capabilities",
    };
    const decision = await presentProposal(proposal, autoApprove);
    expect(decision.decision).toBe("approve");
  });

  test("formatProposalMessage includes all fields", () => {
    const proposal: ExpansionProposal = {
      archetype: "ml-engineer",
      rationale: "ML features requested",
      split_trigger: "new_role_needed",
      suggested_character: "raj",
      estimated_impact: "Adds model training pipeline",
    };
    const msg = formatProposalMessage(proposal);
    expect(msg).toContain("ml-engineer");
    expect(msg).toContain("raj");
    expect(msg).toContain("ML features requested");
  });

  test("E2E: gap detected → proposal → approve → character joins", async () => {
    const root = tmpRoot();
    const season = await spawnSeason({
      slug: "expand-test",
      theme: "tbbt",
      tier: "medium",
      roster: [
        { archetype: "backend-engineer", character: "stuart-bloom", capabilities: [] },
      ],
      rootDir: root,
    });
    expect(season.success).toBe(true);

    // Detect gap
    const gap = detectGap(
      "new_role_needed",
      "need iOS mobile development",
      ["feature request for mobile"],
      { archetypes: ["backend-engineer"], tier: "medium" },
    );
    expect(gap).not.toBeNull();

    // Present and approve
    const proposal: ExpansionProposal = {
      archetype: gap!.suggested_archetype,
      rationale: gap!.description,
      split_trigger: gap!.trigger,
      suggested_character: null,
      estimated_impact: "Adds mobile development capability",
    };
    const decision = await presentProposal(proposal, autoApprove);
    expect(decision.decision).toBe("approve");

    // Spawn mid-season
    const spawn = midSeasonSpawn({
      seasonPath: season.path,
      theme: "tbbt",
      proposal,
    });
    expect(spawn.success).toBe(true);
    expect(existsSync(spawn.characterPath!)).toBe(true);
  });
});
