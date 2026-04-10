// build/counselor/placements/high-risk-adversarial.ts — Placement D: High-Risk Adversarial
import { Counselor, type CounselorVerdict } from "../counselor.ts";

export interface HighRiskAdversarialInput {
  prDiff: string;
  adversarialReport: string;
  adversarialRating: number;
  securityContext: string;
  convener: string;
  seasonId?: string;
}

export async function invokeHighRiskAdversarial(
  counselor: Counselor,
  input: HighRiskAdversarialInput,
): Promise<CounselorVerdict> {
  return counselor.invoke({
    placement: "D",
    convener: input.convener,
    season_id: input.seasonId,
    prompt_context: {
      system:
        "You are a member of the Counselor council reviewing a security-sensitive PR " +
        "that received a low adversarial review score. Independently assess the risk. " +
        "Rate 1-5: confirm-risk (1-2), mitigate (3-4), dismiss (5).",
      user: [
        `## PR Diff\n\`\`\`\n${input.prDiff}\n\`\`\``,
        `## Adversarial Report (rating: ${input.adversarialRating}/5)\n${input.adversarialReport}`,
        `## Security Context\n${input.securityContext}`,
        `\nProvide your independent rating (1-5) and assessment.`,
      ].join("\n\n"),
    },
  });
}
