// build/ingestion/handoff.ts — Builds the Season Manifest handoff artifact
// This is what Penny hands to Leonard after ingestion completes

export interface HandoffInput {
  seasonId: string;
  slug: string;
  theme: string;
  tier: "medium" | "large" | "enterprise";
  roster: Array<{ archetype: string; character: string; capabilities: string[] }>;
  prdTitle: string;
}

export function buildHandoffArtifact(input: HandoffInput): Record<string, unknown> {
  return {
    handoff_version: "1.0.0",
    season_id: input.seasonId,
    season_slug: input.slug,
    theme: input.theme,
    tier: input.tier,
    prd_title: input.prdTitle,
    roster: input.roster,
    channels: {
      primary: `#${input.seasonId}-pennys-apartment`,
      review_gates: `#${input.seasonId}-gates`,
      escalation: `#${input.seasonId}-escalation`,
    },
    handoff_at: new Date().toISOString(),
    handoff_from: "penny",
    handoff_to: "leonard-hofstadter",
    instructions:
      "Leonard: season is spawned and roster is assigned. " +
      "Initialize worktrees for each character and begin task assignment. " +
      "Review gates are active. Expansion proposals will come through the primary channel.",
  };
}
