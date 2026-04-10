import { expect, test, describe } from "bun:test";
import { routeQuery, getAllSMEs, getSMEDomains } from "../../build/advisory-board/sme-router.ts";
import { consultAdvisoryBoard } from "../../build/advisory-board/consultation.ts";

describe("SME router", () => {
  test("routes GPU/ML queries to Jensen Huang", () => {
    const smes = routeQuery("which GPU should we use for deep learning inference", ["gpu", "ml"]);
    expect(smes[0]).toBe("jensen-huang");
  });

  test("routes cloud/AWS queries to Jeff Bezos", () => {
    const smes = routeQuery("best practices for AWS deployment", ["cloud", "aws"]);
    expect(smes[0]).toBe("jeff-bezos");
  });

  test("routes Linux/git queries to Linus Torvalds", () => {
    const smes = routeQuery("git branching strategy for kernel development", ["git", "linux"]);
    expect(smes[0]).toBe("linus-torvalds");
  });

  test("routes product/design queries to Steve Jobs", () => {
    const smes = routeQuery("how should we design the consumer experience", ["product", "design"]);
    expect(smes[0]).toBe("steve-jobs");
  });

  test("routes iOS/Apple queries to Tim Cook", () => {
    const smes = routeQuery("iOS app privacy requirements", ["ios", "privacy"]);
    expect(smes[0]).toBe("tim-cook");
  });

  test("returns empty for unmatched queries", () => {
    const smes = routeQuery("what is the meaning of life", ["philosophy"]);
    expect(smes.length).toBe(0);
  });

  test("returns multiple SMEs ranked by relevance", () => {
    const smes = routeQuery("enterprise cloud AI platform", ["enterprise-ai", "azure"]);
    expect(smes.length).toBeGreaterThanOrEqual(1);
    expect(smes[0]).toBe("satya-nadella");
  });

  test("getAllSMEs returns all 12 advisors", () => {
    expect(getAllSMEs().length).toBe(12);
  });

  test("getSMEDomains returns domains for known SME", () => {
    const domains = getSMEDomains("linus-torvalds");
    expect(domains).toContain("linux");
    expect(domains).toContain("git");
  });
});

describe("Advisory Board consultation", () => {
  test("E2E: GPU query routes to Jensen Huang", async () => {
    const responses = await consultAdvisoryBoard({
      query: "which GPU architecture for deep learning training",
      tags: ["gpu", "deep-learning"],
      requester_character: "sheldon-cooper",
    });
    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0].sme).toBe("jensen-huang");
  });

  test("limits response count with maxSMEs", async () => {
    const responses = await consultAdvisoryBoard(
      {
        query: "enterprise cloud platform with AI capabilities",
        tags: ["cloud", "enterprise-ai", "azure"],
        requester_character: "howard",
      },
      undefined,
      1,
    );
    expect(responses.length).toBe(1);
  });

  test("returns empty for unmatched query", async () => {
    const responses = await consultAdvisoryBoard({
      query: "philosophical implications of consciousness",
      tags: ["philosophy"],
      requester_character: "raj",
    });
    expect(responses.length).toBe(0);
  });

  test("custom handler receives correct args", async () => {
    let capturedSME = "";
    let capturedQuery = "";

    const responses = await consultAdvisoryBoard(
      {
        query: "React Native vs Flutter for mobile",
        tags: ["react", "mobile"],
        requester_character: "howard",
      },
      async (sme, query) => {
        capturedSME = sme;
        capturedQuery = query;
        return "Custom response";
      },
      1,
    );

    expect(capturedSME).toBe("mark-zuckerberg"); // react + mobile
    expect(capturedQuery).toContain("React Native");
    expect(responses[0].response).toBe("Custom response");
  });
});
