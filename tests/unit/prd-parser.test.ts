import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parsePRD } from "../../build/lib/prd-parser.ts";

test("parsePRD extracts goals and scope hints from medium SaaS PRD", () => {
  const content = readFileSync("tests/fixtures/prds/medium-saas.md", "utf-8");
  const parsed = parsePRD(content);
  expect(parsed.goals.length).toBeGreaterThan(0);
  expect(parsed.scope_hints.platforms).toBeDefined();
  expect(parsed.scope_hints.tier_estimate).toMatch(/medium|large|enterprise/);
});

test("parsePRD detects enterprise tier for multi-platform HIPAA PRD", () => {
  const content = readFileSync("tests/fixtures/prds/large-multi-platform.md", "utf-8");
  const parsed = parsePRD(content);
  expect(parsed.scope_hints.compliance).toContain("hipaa");
  expect(parsed.scope_hints.platforms).toContain("ios");
  expect(parsed.scope_hints.platforms).toContain("android");
});

test("parsePRD estimates medium tier for tiny landing page", () => {
  const content = readFileSync("tests/fixtures/prds/tiny-landing-page.md", "utf-8");
  const parsed = parsePRD(content);
  expect(parsed.scope_hints.tier_estimate).toBe("medium");
});
