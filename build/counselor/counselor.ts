// build/counselor/counselor.ts — Main Counselor dispatcher
import type { ModelClient, ModelRequest, ModelResponse } from "./models/types.ts";
import { computeConsensus, type ConsensusResult, type ModelRating } from "./consensus.ts";

export type PlacementId = "A" | "B" | "C" | "D";

export interface CounselorInvocation {
  placement: PlacementId;
  convener: string;
  prompt_context: {
    system: string;
    user: string;
  };
  season_id?: string;
}

export interface CounselorVerdict {
  placement: PlacementId;
  consensus: ConsensusResult;
  per_model_responses: ModelResponse[];
  duration_ms: number;
  timestamp: Date;
}

const PLACEMENT_ALGORITHMS: Record<PlacementId, "min-score" | "majority"> = {
  A: "min-score",
  B: "majority",
  C: "majority",
  D: "majority",
};

const PER_MODEL_TIMEOUT_MS = 120_000;

export class Counselor {
  constructor(private readonly clients: ModelClient[]) {}

  async invoke(invocation: CounselorInvocation): Promise<CounselorVerdict> {
    const start = Date.now();

    const request: ModelRequest = {
      system: invocation.prompt_context.system,
      user: invocation.prompt_context.user,
      temperature: 0.3,
      max_tokens: 2000,
    };

    // Fire all models in parallel
    const responses = await Promise.allSettled(
      this.clients.map((c) => withTimeout(c.invoke(request), PER_MODEL_TIMEOUT_MS)),
    );

    const successful: ModelResponse[] = [];
    for (const [i, r] of responses.entries()) {
      if (r.status === "fulfilled") {
        successful.push(r.value);
      }
      // Failed models are silently skipped
    }

    const minRequired = invocation.placement === "A" ? 4 : 3;
    if (successful.length < minRequired) {
      throw new Error(
        `Counselor unavailable: only ${successful.length} of ${this.clients.length} models responded (need ${minRequired})`,
      );
    }

    const ratings: ModelRating[] = successful.map((r) => ({
      rating: r.rating ?? 0,
      model: r.model,
    }));

    const algorithm = PLACEMENT_ALGORITHMS[invocation.placement];
    const consensus = computeConsensus(ratings, algorithm, { threshold: 4 });

    return {
      placement: invocation.placement,
      consensus,
      per_model_responses: successful,
      duration_ms: Date.now() - start,
      timestamp: new Date(),
    };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}
