// build/counselor/placements/deadlock-escalation.ts — Placement C: Deadlock Escalation
import { Counselor, type CounselorVerdict } from "../counselor.ts";

export interface DeadlockEscalationInput {
  taskDescription: string;
  sideA: { character: string; argument: string };
  sideB: { character: string; argument: string };
  bounceHistory: string[];
  convener: string;
  seasonId?: string;
}

export async function invokeDeadlockEscalation(
  counselor: Counselor,
  input: DeadlockEscalationInput,
): Promise<CounselorVerdict> {
  return counselor.invoke({
    placement: "C",
    convener: input.convener,
    season_id: input.seasonId,
    prompt_context: {
      system:
        "You are a member of the Counselor council resolving a deadlock between two team members. " +
        "Your verdict is BINDING. Choose side A, side B, or propose a redesign. " +
        "Rate your confidence 1-5.",
      user: [
        `## Task\n${input.taskDescription}`,
        `## Side A (${input.sideA.character})\n${input.sideA.argument}`,
        `## Side B (${input.sideB.character})\n${input.sideB.argument}`,
        `## Bounce History (${input.bounceHistory.length} bounces)`,
        ...input.bounceHistory.map((h, i) => `${i + 1}. ${h}`),
        `\nChoose: decide-for-A, decide-for-B, or redesign. Provide rating (1-5) and rationale.`,
      ].join("\n\n"),
    },
  });
}
