// build/counselor/placements/skill-promotion.ts — Placement A: Skill Promotion
import { Counselor, type CounselorVerdict } from "../counselor.ts";

export interface SkillPromotionInput {
  skillName: string;
  skillDefinition: string;
  usageExamples: string[];
  riskAssessment: string;
  seasonId: string;
  convener: string;
}

export async function invokeSkillPromotion(
  counselor: Counselor,
  input: SkillPromotionInput,
): Promise<CounselorVerdict> {
  return counselor.invoke({
    placement: "A",
    convener: input.convener,
    season_id: input.seasonId,
    prompt_context: {
      system:
        "You are a member of the Counselor council evaluating a skill promotion request. " +
        "Rate the skill 1-5 on safety, reusability, and correctness. " +
        "Only approve (≥4) if the skill is safe to use autonomously.",
      user: [
        `## Skill: ${input.skillName}`,
        `### Definition\n${input.skillDefinition}`,
        `### Usage Examples\n${input.usageExamples.map((e) => `- ${e}`).join("\n")}`,
        `### Risk Assessment\n${input.riskAssessment}`,
        `\nProvide your rating (1-5) and rationale.`,
      ].join("\n\n"),
    },
  });
}
