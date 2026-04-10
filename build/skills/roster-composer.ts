// build/skills/roster-composer.ts
import type { ParsedPRD } from "../lib/prd-parser.ts";

export interface RosterRecommendation {
  tier: "medium" | "large" | "enterprise";
  archetypes: string[];
  rationale: Record<string, string>;
  splits_triggered: string[];
}

const MEDIUM_BASELINE = [
  "ingestion-pm",
  "user-handler",
  "scrum-master",
  "principal-architect",
  "frontend-engineer",
  "backend-engineer",
  "qa-lead",
  "security-engineer",
  "adversarial-reviewer",
  "code-reviewer",
  "refinement-builder",
];

export function composeInitialRoster(prd: ParsedPRD): RosterRecommendation {
  const archetypes = new Set(MEDIUM_BASELINE);
  const splits: string[] = [];
  const rationale: Record<string, string> = {};

  for (const a of MEDIUM_BASELINE) {
    rationale[a] = "medium-tier baseline";
  }

  // Platform splits
  if (prd.scope_hints.platforms.some((p) => ["ios", "react native", "flutter"].includes(p))) {
    archetypes.add("mobile-ios-engineer");
    splits.push("platforms.ios → mobile-ios-engineer");
    rationale["mobile-ios-engineer"] = "PRD mentions iOS/mobile platform";
  }
  if (prd.scope_hints.platforms.some((p) => ["android", "react native", "flutter"].includes(p))) {
    archetypes.add("mobile-android-engineer");
    splits.push("platforms.android → mobile-android-engineer");
    rationale["mobile-android-engineer"] = "PRD mentions Android/mobile platform";
  }

  // Compliance splits
  const hasCompliance = prd.scope_hints.compliance.length > 0;
  if (hasCompliance) {
    archetypes.add("appsec-engineer");
    archetypes.add("privacy-officer");
    splits.push("compliance → appsec-engineer + privacy-officer");
    rationale["appsec-engineer"] =
      `Compliance requirements: ${prd.scope_hints.compliance.join(", ")}`;
    rationale["privacy-officer"] =
      `Compliance requirements: ${prd.scope_hints.compliance.join(", ")}`;
  }

  // Infrastructure splits
  if (prd.scope_hints.technologies.some((t) => ["kubernetes", "docker", "terraform"].includes(t))) {
    archetypes.add("devops-infrastructure");
    archetypes.add("cicd-pipeline-engineer");
    splits.push("infrastructure tech → devops + cicd");
    rationale["devops-infrastructure"] = "PRD mentions container/infra technologies";
    rationale["cicd-pipeline-engineer"] = "PRD mentions container/infra technologies";
  }

  // Database splits
  if (prd.scope_hints.technologies.some((t) => ["postgres", "mongodb", "redis"].includes(t))) {
    archetypes.add("database-engineer");
    rationale["database-engineer"] = "PRD mentions database technologies";
  }

  // ML/Data splits
  if (prd.scope_hints.technologies.some((t) => ["kafka", "rabbitmq"].includes(t))) {
    archetypes.add("data-engineer");
    splits.push("event streaming → data-engineer");
    rationale["data-engineer"] = "PRD mentions event streaming/data pipeline";
  }

  // Large tier additions
  if (prd.scope_hints.tier_estimate !== "medium") {
    archetypes.add("technical-writer");
    archetypes.add("devops-infrastructure");
    archetypes.add("cicd-pipeline-engineer");
    archetypes.add("database-engineer");
    archetypes.add("incident-commander");
    rationale["technical-writer"] = "Large+ tier includes documentation";
    rationale["incident-commander"] = "Large+ tier includes incident response";
  }

  // Enterprise tier additions
  if (prd.scope_hints.tier_estimate === "enterprise") {
    archetypes.add("sre-invisible-ops");
    archetypes.add("platform-engineer");
    archetypes.add("technical-program-manager");
    archetypes.add("release-manager");
    archetypes.add("ai-safety-engineer");
    rationale["sre-invisible-ops"] = "Enterprise tier includes SRE";
    rationale["platform-engineer"] = "Enterprise tier includes platform engineering";
    rationale["technical-program-manager"] = "Enterprise tier includes TPM";
    rationale["release-manager"] = "Enterprise tier includes release management";
    rationale["ai-safety-engineer"] = "Enterprise tier includes AI safety";
  }

  return {
    tier: prd.scope_hints.tier_estimate,
    archetypes: Array.from(archetypes),
    rationale,
    splits_triggered: splits,
  };
}
