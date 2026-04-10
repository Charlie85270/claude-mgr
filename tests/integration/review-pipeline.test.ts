import { expect, test, describe } from "bun:test";
import {
  runReviewPipeline,
  type GateResult,
  type GateRunner,
  type ReviewPipelineInput,
} from "../../build/runtime/review-pipeline.ts";

const baseInput: ReviewPipelineInput = {
  taskId: "task-1",
  worktreePath: "/tmp/wt",
  worktreeDiff: "+function hello() {}",
  bounceCount: 0,
};

describe("review-pipeline", () => {
  test("passes all gates with default (stub) runner", async () => {
    const result = await runReviewPipeline(baseInput);
    expect(result.passed).toBe(true);
    expect(result.mustBounce).toBe(false);
    expect(result.escalateToCounselor).toBe(false);
    expect(result.gateResults.length).toBe(7); // 6 parallel + refinement
    expect(result.overallRating).toBe(5);
  });

  test("6 parallel gates + 1 sequential gate in results", async () => {
    const result = await runReviewPipeline(baseInput);
    const gateNames = result.gateResults.map((r) => r.gate);
    expect(gateNames).toContain("architecture-review");
    expect(gateNames).toContain("code-review");
    expect(gateNames).toContain("qa-review");
    expect(gateNames).toContain("security-review");
    expect(gateNames).toContain("adversarial-review");
    expect(gateNames).toContain("ui-functionality-review");
    expect(gateNames).toContain("refinement-pass");
  });

  test("rating gates return 5-star type", async () => {
    const result = await runReviewPipeline(baseInput);
    const adversarial = result.gateResults.find((r) => r.gate === "adversarial-review")!;
    expect(adversarial.type).toBe("rating");
    expect(adversarial.result).toBe(5);

    const ui = result.gateResults.find((r) => r.gate === "ui-functionality-review")!;
    expect(ui.type).toBe("rating");
  });

  test("pass-fail gates return pass-fail type", async () => {
    const result = await runReviewPipeline(baseInput);
    const arch = result.gateResults.find((r) => r.gate === "architecture-review")!;
    expect(arch.type).toBe("pass-fail");
    expect(arch.result).toBe("pass");
  });

  test("bounces when a pass-fail gate fails", async () => {
    const failingRunner: GateRunner = async (gate, _input) => {
      if (gate === "security-review") {
        return { gate, type: "pass-fail", result: "fail", reviewer: "barry-kripke", notes: "SQL injection found" };
      }
      return { gate, type: "pass-fail", result: "pass", reviewer: "stub", notes: "" };
    };

    const result = await runReviewPipeline(baseInput, failingRunner);
    expect(result.passed).toBe(false);
    expect(result.mustBounce).toBe(true);
    expect(result.escalateToCounselor).toBe(false);
  });

  test("bounces when a rating gate scores below 4", async () => {
    const lowRatingRunner: GateRunner = async (gate, _input) => {
      if (gate === "adversarial-review") {
        return { gate, type: "rating", result: 2, reviewer: "wil-wheaton", notes: "trivially breakable" };
      }
      if (gate === "ui-functionality-review") {
        return { gate, type: "rating", result: 5, reviewer: "emily-sweeney", notes: "" };
      }
      return { gate, type: "pass-fail", result: "pass", reviewer: "stub", notes: "" };
    };

    const result = await runReviewPipeline(baseInput, lowRatingRunner);
    expect(result.passed).toBe(false);
    expect(result.mustBounce).toBe(true);
  });

  test("escalates to counselor after 5 bounces", async () => {
    const failingRunner: GateRunner = async (gate, _input) => {
      if (gate === "code-review") {
        return { gate, type: "pass-fail", result: "fail", reviewer: "alex-jensen", notes: "poor naming" };
      }
      return { gate, type: "pass-fail", result: "pass", reviewer: "stub", notes: "" };
    };

    const result = await runReviewPipeline({ ...baseInput, bounceCount: 4 }, failingRunner);
    expect(result.passed).toBe(false);
    expect(result.escalateToCounselor).toBe(true);
  });

  test("refinement failure after parallel pass still bounces", async () => {
    const refinementFailRunner: GateRunner = async (gate, _input) => {
      if (gate === "refinement-pass") {
        return { gate, type: "pass-fail", result: "fail", reviewer: "leslie-winkle", notes: "build broken" };
      }
      if (gate === "adversarial-review" || gate === "ui-functionality-review") {
        return { gate, type: "rating", result: 5, reviewer: "stub", notes: "" };
      }
      return { gate, type: "pass-fail", result: "pass", reviewer: "stub", notes: "" };
    };

    const result = await runReviewPipeline(baseInput, refinementFailRunner);
    expect(result.passed).toBe(false);
    expect(result.mustBounce).toBe(true);
    expect(result.gateResults.length).toBe(7);
  });

  test("overall rating is average of 5-star gates", async () => {
    const mixedRunner: GateRunner = async (gate, _input) => {
      if (gate === "adversarial-review") {
        return { gate, type: "rating", result: 4, reviewer: "wil-wheaton", notes: "" };
      }
      if (gate === "ui-functionality-review") {
        return { gate, type: "rating", result: 5, reviewer: "emily-sweeney", notes: "" };
      }
      if (gate === "refinement-pass") {
        return { gate, type: "pass-fail", result: "pass", reviewer: "leslie-winkle", notes: "" };
      }
      return { gate, type: "pass-fail", result: "pass", reviewer: "stub", notes: "" };
    };

    const result = await runReviewPipeline(baseInput, mixedRunner);
    expect(result.passed).toBe(true);
    expect(result.overallRating).toBe(4.5);
  });

  test("gate results include correct reviewers", async () => {
    const result = await runReviewPipeline(baseInput);
    const arch = result.gateResults.find((r) => r.gate === "architecture-review")!;
    expect(arch.reviewer).toBe("sheldon-cooper");

    const security = result.gateResults.find((r) => r.gate === "security-review")!;
    expect(security.reviewer).toBe("barry-kripke");
  });
});
