import { expect, test, describe } from "bun:test";
import { existsSync } from "node:fs";
import { pennyIngest } from "../../build/ingestion/season-spawn.ts";
import { buildHandoffArtifact } from "../../build/ingestion/handoff.ts";

describe("Penny's ingestion protocol", () => {
  const tmpRoot = () => `/tmp/factor-echelon-ingest-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  test("E2E: drop PRD → get live season", async () => {
    const root = tmpRoot();
    const result = await pennyIngest({
      prdPath: "tests/fixtures/prds/medium-saas.md",
      theme: "tbbt",
      rootDir: root,
      askUser: async (_qs) => ({
        "What is the name or title of this project?": "TaskFlow SaaS",
        "What technologies, frameworks, or platforms will this project use?": "React, Node.js, PostgreSQL",
      }),
    });
    expect(result.success).toBe(true);
    expect(result.season).not.toBeNull();
    expect(result.season!.seasonId).toContain("season-01");
    expect(result.handoff).not.toBeNull();
    expect(result.handoff!.handoff_to).toBe("leonard-hofstadter");
  });

  test("handoff artifact has correct structure", () => {
    const handoff = buildHandoffArtifact({
      seasonId: "season-01-test",
      slug: "test",
      theme: "tbbt",
      tier: "large",
      roster: [
        { archetype: "backend-engineer", character: "stuart-bloom", capabilities: ["source-control:write"] },
      ],
      prdTitle: "Test Project",
    });

    expect(handoff.handoff_version).toBe("1.0.0");
    expect(handoff.handoff_from).toBe("penny");
    expect(handoff.handoff_to).toBe("leonard-hofstadter");
    expect(handoff.season_id).toBe("season-01-test");
    expect(handoff.roster).toHaveLength(1);
  });
});
