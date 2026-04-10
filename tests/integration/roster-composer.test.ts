import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { parsePRD } from "../../build/lib/prd-parser.ts";
import { composeInitialRoster } from "../../build/skills/roster-composer.ts";

test("composer produces medium-tier roster for simple SaaS PRD", () => {
  const prd = parsePRD(readFileSync("tests/fixtures/prds/medium-saas.md", "utf-8"));
  const roster = composeInitialRoster(prd);
  expect(roster.archetypes).toContain("ingestion-pm");
  expect(roster.archetypes).toContain("user-handler");
  expect(roster.archetypes.length).toBeGreaterThanOrEqual(10);
});

test("composer adds mobile engineers when PRD mentions iOS and Android", () => {
  const prd = parsePRD(readFileSync("tests/fixtures/prds/large-multi-platform.md", "utf-8"));
  const roster = composeInitialRoster(prd);
  expect(roster.archetypes).toContain("mobile-ios-engineer");
  expect(roster.archetypes).toContain("mobile-android-engineer");
  expect(roster.splits_triggered.length).toBeGreaterThan(0);
});

test("composer adds compliance roles for HIPAA PRD", () => {
  const prd = parsePRD(readFileSync("tests/fixtures/prds/large-multi-platform.md", "utf-8"));
  const roster = composeInitialRoster(prd);
  expect(roster.archetypes).toContain("appsec-engineer");
  expect(roster.archetypes).toContain("privacy-officer");
});
