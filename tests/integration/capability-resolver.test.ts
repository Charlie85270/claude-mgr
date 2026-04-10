import { expect, test } from "bun:test";
import { resolveCapabilities } from "../../build/skills/capability-resolver.ts";

test("capability-resolver grants source-control:admin to user-handler", () => {
  const bound = resolveCapabilities({ "user-handler": "leonard-hofstadter" });
  const leonard = bound.find((b) => b.character === "leonard-hofstadter");
  expect(leonard?.granted).toContain("source-control:admin");
});

test("capability-resolver does not grant write to ingestion-pm", () => {
  const bound = resolveCapabilities({ "ingestion-pm": "penny" });
  const penny = bound.find((b) => b.character === "penny");
  expect(penny?.granted).toContain("source-control:read");
  expect(penny?.granted).not.toContain("source-control:write");
});
