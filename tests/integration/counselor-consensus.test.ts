import { expect, test, describe } from "bun:test";
import { computeConsensus, type ModelRating } from "../../build/counselor/consensus.ts";
import { Counselor } from "../../build/counselor/counselor.ts";
import { StubModelClient } from "../../build/counselor/models/types.ts";
import { BudgetTracker } from "../../build/counselor/budget-tracker.ts";

describe("consensus algorithms", () => {
  test("min-score picks lowest rating", () => {
    const result = computeConsensus(
      [
        { rating: 5, model: "gemini" },
        { rating: 4, model: "gpt5" },
        { rating: 3, model: "opus" },
        { rating: 5, model: "grok" },
      ],
      "min-score",
    );
    expect(result.final_rating).toBe(3);
    expect(result.approved).toBe(false);
  });

  test("min-score approves when all ≥ threshold", () => {
    const result = computeConsensus(
      [
        { rating: 5, model: "gemini" },
        { rating: 4, model: "gpt5" },
        { rating: 4, model: "opus" },
        { rating: 5, model: "grok" },
      ],
      "min-score",
    );
    expect(result.final_rating).toBe(4);
    expect(result.approved).toBe(true);
  });

  test("majority requires 3 of 4 at threshold", () => {
    const result = computeConsensus(
      [
        { rating: 5, model: "gemini" },
        { rating: 4, model: "gpt5" },
        { rating: 2, model: "opus" },
        { rating: 4, model: "grok" },
      ],
      "majority",
      { threshold: 4 },
    );
    expect(result.approved).toBe(true);
  });

  test("majority: 2 of 4 at threshold is NOT approved", () => {
    const result = computeConsensus(
      [
        { rating: 4, model: "gemini" },
        { rating: 4, model: "gpt5" },
        { rating: 2, model: "opus" },
        { rating: 3, model: "grok" },
      ],
      "majority",
      { threshold: 4 },
    );
    expect(result.approved).toBe(false);
  });

  test("stdev tracks disagreement", () => {
    const result = computeConsensus(
      [
        { rating: 5, model: "a" },
        { rating: 1, model: "b" },
        { rating: 5, model: "c" },
        { rating: 1, model: "d" },
      ],
      "majority",
    );
    expect(result.stdev).toBeGreaterThan(1.5);
  });

  test("weighted-average applies weights", () => {
    const result = computeConsensus(
      [
        { rating: 5, model: "gemini" },
        { rating: 3, model: "gpt5" },
      ],
      "weighted-average",
      { weights: { gemini: 2, gpt5: 1 }, threshold: 4 },
    );
    // (5*2 + 3*1) / 3 = 4.33
    expect(result.final_rating).toBeGreaterThan(4);
    expect(result.approved).toBe(true);
  });
});

describe("Counselor dispatcher", () => {
  test("invokes all models and returns verdict", async () => {
    const counselor = new Counselor([
      new StubModelClient("gemini", "gemini-family", 5),
      new StubModelClient("gpt5", "gpt-family", 4),
      new StubModelClient("opus", "claude-family", 5),
      new StubModelClient("grok", "grok-family", 4),
    ]);

    const verdict = await counselor.invoke({
      placement: "B",
      convener: "stephen-hawking",
      prompt_context: { system: "Review this.", user: "Is this design sound?" },
    });

    expect(verdict.placement).toBe("B");
    expect(verdict.per_model_responses.length).toBe(4);
    expect(verdict.consensus.approved).toBe(true);
  });

  test("proceeds with 3 of 4 for placements B/C/D", async () => {
    const counselor = new Counselor([
      new StubModelClient("gemini", "gemini-family", 5),
      new StubModelClient("gpt5", "gpt-family", 5, true), // fails
      new StubModelClient("opus", "claude-family", 4),
      new StubModelClient("grok", "grok-family", 4),
    ]);

    const verdict = await counselor.invoke({
      placement: "C",
      convener: "stephen-hawking",
      prompt_context: { system: "Resolve.", user: "Deadlock." },
    });

    expect(verdict.per_model_responses.length).toBe(3);
    expect(verdict.consensus.approved).toBe(true);
  });

  test("fails when only 2 models respond for placement A", async () => {
    const counselor = new Counselor([
      new StubModelClient("gemini", "gemini-family", 5),
      new StubModelClient("gpt5", "gpt-family", 5, true),
      new StubModelClient("opus", "claude-family", 5, true),
      new StubModelClient("grok", "grok-family", 5),
    ]);

    await expect(
      counselor.invoke({
        placement: "A",
        convener: "stephen-hawking",
        prompt_context: { system: "Promote.", user: "Skill candidate." },
      }),
    ).rejects.toThrow("Counselor unavailable");
  });

  test("fails when only 2 models respond for placement B", async () => {
    const counselor = new Counselor([
      new StubModelClient("gemini", "gemini-family", 5),
      new StubModelClient("gpt5", "gpt-family", 5, true),
      new StubModelClient("opus", "claude-family", 5, true),
      new StubModelClient("grok", "grok-family", 5),
    ]);

    await expect(
      counselor.invoke({
        placement: "B",
        convener: "stephen-hawking",
        prompt_context: { system: "Review.", user: "Design doc." },
      }),
    ).rejects.toThrow("Counselor unavailable");
  });
});

describe("BudgetTracker", () => {
  test("tracks spend and detects over-budget", () => {
    const tracker = new BudgetTracker(1.0); // $1 limit
    tracker.record("gpt-5-2026-04-01", 10000, "A"); // 10K tokens * $0.03/1K = $0.30
    expect(tracker.isOverBudget()).toBe(false);

    tracker.record("gpt-5-2026-04-01", 30000, "B"); // $0.90
    expect(tracker.isOverBudget()).toBe(true);
  });

  test("getSummary breaks down by model", () => {
    const tracker = new BudgetTracker(50);
    tracker.record("gemini-2.5-pro-latest", 1000, "A");
    tracker.record("claude-opus-4-6", 1000, "B");
    const summary = tracker.getSummary();
    expect(summary.invocations).toBe(2);
    expect(Object.keys(summary.by_model)).toContain("gemini-2.5-pro-latest");
    expect(Object.keys(summary.by_model)).toContain("claude-opus-4-6");
  });
});
