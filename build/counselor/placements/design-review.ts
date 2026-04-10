// build/counselor/placements/design-review.ts — Placement B: Design Review
import { Counselor, type CounselorVerdict } from "../counselor.ts";

export interface DesignReviewInput {
  designDoc: string;
  affectedModules: string[];
  migrationStrategy: string;
  convener: string;
  seasonId?: string;
}

export async function invokeDesignReview(
  counselor: Counselor,
  input: DesignReviewInput,
): Promise<CounselorVerdict> {
  return counselor.invoke({
    placement: "B",
    convener: input.convener,
    season_id: input.seasonId,
    prompt_context: {
      system:
        "You are a member of the Counselor council reviewing a high-impact design decision. " +
        "Rate the design 1-5 on soundness, maintainability, and migration safety. " +
        "Consider backward compatibility and team impact.",
      user: [
        `## Design Document\n${input.designDoc}`,
        `## Affected Modules\n${input.affectedModules.map((m) => `- ${m}`).join("\n")}`,
        `## Migration Strategy\n${input.migrationStrategy}`,
        `\nProvide your rating (1-5) and rationale. Note any conditions for approval.`,
      ].join("\n\n"),
    },
  });
}
