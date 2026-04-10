// build/counselor/budget-tracker.ts — Per-month cost tracking for Counselor invocations

export interface CostEntry {
  model: string;
  tokens: number;
  estimated_cost_usd: number;
  timestamp: Date;
  placement: string;
}

// Approximate per-1K-token costs (input + output averaged)
const MODEL_COSTS_PER_1K: Record<string, number> = {
  "gemini-2.5-pro-latest": 0.005,
  "gpt-5-2026-04-01": 0.03,
  "claude-opus-4-6": 0.075,
  "grok-3-latest": 0.01,
};

export class BudgetTracker {
  private entries: CostEntry[] = [];
  private monthlyLimitUsd: number;

  constructor(monthlyLimitUsd: number = 50) {
    this.monthlyLimitUsd = monthlyLimitUsd;
  }

  record(model: string, tokens: number, placement: string): CostEntry {
    const costPer1K = MODEL_COSTS_PER_1K[model] ?? 0.01;
    const entry: CostEntry = {
      model,
      tokens,
      estimated_cost_usd: (tokens / 1000) * costPer1K,
      timestamp: new Date(),
      placement,
    };
    this.entries.push(entry);
    return entry;
  }

  currentMonthSpend(): number {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.entries
      .filter((e) => e.timestamp >= monthStart)
      .reduce((sum, e) => sum + e.estimated_cost_usd, 0);
  }

  isOverBudget(): boolean {
    return this.currentMonthSpend() >= this.monthlyLimitUsd;
  }

  getLimit(): number {
    return this.monthlyLimitUsd;
  }

  setLimit(usd: number): void {
    this.monthlyLimitUsd = usd;
  }

  getSummary(): { total_usd: number; by_model: Record<string, number>; invocations: number } {
    const byModel: Record<string, number> = {};
    for (const e of this.entries) {
      byModel[e.model] = (byModel[e.model] ?? 0) + e.estimated_cost_usd;
    }
    return {
      total_usd: this.entries.reduce((s, e) => s + e.estimated_cost_usd, 0),
      by_model: byModel,
      invocations: this.entries.length,
    };
  }
}
