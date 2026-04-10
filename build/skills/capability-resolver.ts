// build/skills/capability-resolver.ts
import { readFileSync } from "node:fs";
import { load as yamlLoad } from "js-yaml";

export interface BoundCapabilities {
  character: string;
  archetype: string;
  granted: string[];
  denied: string[];
}

export function resolveCapabilities(
  mappedRoster: Record<string, string>,
  matrixPath = "src/team-factory/capabilities/access-matrix.yaml",
): BoundCapabilities[] {
  const matrix = yamlLoad(readFileSync(matrixPath, "utf-8")) as Record<string, string[]>;
  const result: BoundCapabilities[] = [];

  for (const [archetype, character] of Object.entries(mappedRoster)) {
    const granted = matrix[archetype] ?? [];
    result.push({
      character,
      archetype,
      granted,
      denied: [],
    });
  }

  return result;
}
