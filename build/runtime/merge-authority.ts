// build/runtime/merge-authority.ts
// Leonard's merge logic — serialized merge after all review gates pass
import type { ReviewPipelineResult } from "./review-pipeline.ts";
import { mergeWorktree, type Worktree } from "./worktree-manager.ts";

export interface MergeInput {
  seasonPath: string;
  worktree: Worktree;
  reviewResult: ReviewPipelineResult;
  taskDescription: string;
}

export interface MergeResult {
  merged: boolean;
  commitMessage: string;
  error?: string;
}

export async function attemptMerge(input: MergeInput): Promise<MergeResult> {
  if (!input.reviewResult.passed) {
    return {
      merged: false,
      commitMessage: "",
      error: "review gates did not pass; merge blocked",
    };
  }

  const ratingSuffix =
    input.reviewResult.overallRating !== null
      ? ` [avg rating: ${input.reviewResult.overallRating.toFixed(1)}★]`
      : "";

  const reviewers = input.reviewResult.gateResults.map((r) => r.reviewer).join(", ");
  const commitMessage = `${input.taskDescription}${ratingSuffix}\n\nReviewed by: ${reviewers}`;

  const mergeOutcome = mergeWorktree(input.seasonPath, input.worktree, commitMessage);
  if (!mergeOutcome.success) {
    return { merged: false, commitMessage, error: mergeOutcome.error };
  }

  return { merged: true, commitMessage };
}
