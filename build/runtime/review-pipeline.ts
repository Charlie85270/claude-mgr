// build/runtime/review-pipeline.ts
// Orchestrates the 7-gate review pipeline: 6 parallel + 1 sequential

export interface GateResult {
  gate: string;
  type: "pass-fail" | "rating";
  result: "pass" | "fail" | number;
  reviewer: string;
  notes: string;
}

export interface ReviewPipelineInput {
  taskId: string;
  worktreePath: string;
  worktreeDiff: string;
  bounceCount: number;
}

export interface ReviewPipelineResult {
  passed: boolean;
  mustBounce: boolean;
  escalateToCounselor: boolean;
  gateResults: GateResult[];
  overallRating: number | null;
}

const PARALLEL_GATES = [
  "architecture-review",
  "code-review",
  "qa-review",
  "security-review",
  "adversarial-review",
  "ui-functionality-review",
];
const RATING_GATES = new Set(["adversarial-review", "ui-functionality-review"]);
const MAX_BOUNCES = 5;

// Gate-to-character mapping (TBBT)
const GATE_REVIEWERS: Record<string, string> = {
  "architecture-review": "sheldon-cooper",
  "code-review": "alex-jensen",
  "qa-review": "bernadette",
  "security-review": "barry-kripke",
  "adversarial-review": "wil-wheaton",
  "ui-functionality-review": "emily-sweeney",
  "refinement-pass": "leslie-winkle",
};

export type GateRunner = (gate: string, input: ReviewPipelineInput) => Promise<GateResult>;

// Default gate runner — stub that always passes (real runners injected by host)
const defaultGateRunner: GateRunner = async (gate, _input) => {
  const isRating = RATING_GATES.has(gate);
  return {
    gate,
    type: isRating ? "rating" : "pass-fail",
    result: isRating ? 5 : "pass",
    reviewer: GATE_REVIEWERS[gate] ?? "unknown",
    notes: "",
  };
};

export async function runReviewPipeline(
  input: ReviewPipelineInput,
  gateRunner: GateRunner = defaultGateRunner,
): Promise<ReviewPipelineResult> {
  // 1. Run all parallel gates concurrently
  const parallelResults = await Promise.all(
    PARALLEL_GATES.map((gate) => gateRunner(gate, input)),
  );

  const allPassed = parallelResults.every((r) => {
    if (r.type === "pass-fail") return r.result === "pass";
    return (r.result as number) >= 4;
  });

  if (!allPassed) {
    const bouncing = input.bounceCount + 1;
    return {
      passed: false,
      mustBounce: true,
      escalateToCounselor: bouncing >= MAX_BOUNCES,
      gateResults: parallelResults,
      overallRating: null,
    };
  }

  // 2. Run refinement pass (sequential, after parallel gates pass)
  const refinement = await gateRunner("refinement-pass", input);
  const finalPassed = refinement.type === "pass-fail" && refinement.result === "pass";

  return {
    passed: finalPassed,
    mustBounce: !finalPassed,
    escalateToCounselor: !finalPassed && input.bounceCount + 1 >= MAX_BOUNCES,
    gateResults: [...parallelResults, refinement],
    overallRating: computeOverallRating(parallelResults),
  };
}

function computeOverallRating(results: GateResult[]): number {
  const ratings = results
    .filter((r) => r.type === "rating")
    .map((r) => r.result as number);
  if (ratings.length === 0) return 5;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}
