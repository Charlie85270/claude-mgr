// build/counselor/consensus.ts — Consensus algorithms for multi-model council

export interface ModelRating {
  rating: number;
  model: string;
  notes?: string;
}

export interface ConsensusResult {
  approved: boolean;
  final_rating: number;
  algorithm: string;
  per_model: ModelRating[];
  stdev: number;
  notes: string;
}

export function computeConsensus(
  ratings: ModelRating[],
  algorithm: "min-score" | "majority" | "weighted-average",
  options: { threshold?: number; weights?: Record<string, number> } = {},
): ConsensusResult {
  const threshold = options.threshold ?? 4;

  if (algorithm === "min-score") {
    const min = Math.min(...ratings.map((r) => r.rating));
    return {
      approved: min >= threshold,
      final_rating: min,
      algorithm,
      per_model: ratings,
      stdev: computeStdev(ratings.map((r) => r.rating)),
      notes: `min-score: ${min} (threshold: ${threshold})`,
    };
  }

  if (algorithm === "majority") {
    const passing = ratings.filter((r) => r.rating >= threshold).length;
    const majorityNeeded = Math.floor(ratings.length / 2) + 1;
    return {
      approved: passing >= majorityNeeded,
      final_rating: average(ratings.map((r) => r.rating)),
      algorithm,
      per_model: ratings,
      stdev: computeStdev(ratings.map((r) => r.rating)),
      notes: `${passing}/${ratings.length} at ≥${threshold} (need ${majorityNeeded})`,
    };
  }

  if (algorithm === "weighted-average") {
    const weights = options.weights ?? {};
    let totalWeight = 0;
    let weightedSum = 0;
    for (const r of ratings) {
      const w = weights[r.model] ?? 1;
      weightedSum += r.rating * w;
      totalWeight += w;
    }
    const avg = totalWeight > 0 ? weightedSum / totalWeight : 0;
    return {
      approved: avg >= threshold,
      final_rating: Math.round(avg * 10) / 10,
      algorithm,
      per_model: ratings,
      stdev: computeStdev(ratings.map((r) => r.rating)),
      notes: `weighted-avg: ${avg.toFixed(1)} (threshold: ${threshold})`,
    };
  }

  throw new Error(`Unsupported consensus algorithm: ${algorithm}`);
}

function computeStdev(nums: number[]): number {
  if (nums.length === 0) return 0;
  const avg = average(nums);
  const squaredDiffs = nums.map((n) => (n - avg) ** 2);
  return Math.sqrt(average(squaredDiffs));
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
