// build/expansion/gap-detection.ts — Leonard's gap signals for continuous expansion (§7.5)

export type GapTrigger =
  | "new_role_needed"
  | "scope_outside_character"
  | "missing_review_gate_coverage"
  | "new_platform_target"
  | "tier_upgrade"
  | "cross_cutting_concern";

export interface GapSignal {
  trigger: GapTrigger;
  description: string;
  suggested_archetype: string;
  urgency: "immediate" | "next-sprint" | "backlog";
  evidence: string[];
}

export interface ExistingRoster {
  archetypes: string[];
  tier: "medium" | "large" | "enterprise";
}

export function detectGap(
  trigger: GapTrigger,
  description: string,
  evidence: string[],
  existingRoster: ExistingRoster,
): GapSignal | null {
  const suggested = suggestArchetype(trigger, description, existingRoster);
  if (!suggested) return null;

  // Don't suggest an archetype already on the roster
  if (existingRoster.archetypes.includes(suggested.archetype)) return null;

  return {
    trigger,
    description,
    suggested_archetype: suggested.archetype,
    urgency: suggested.urgency,
    evidence,
  };
}

function suggestArchetype(
  trigger: GapTrigger,
  description: string,
  roster: ExistingRoster,
): { archetype: string; urgency: "immediate" | "next-sprint" | "backlog" } | null {
  const desc = description.toLowerCase();

  switch (trigger) {
    case "new_role_needed":
      if (desc.includes("ios") || desc.includes("mobile apple")) {
        return { archetype: "mobile-ios-engineer", urgency: "immediate" };
      }
      if (desc.includes("android") || desc.includes("mobile google")) {
        return { archetype: "mobile-android-engineer", urgency: "immediate" };
      }
      if (desc.includes("ml") || desc.includes("machine learning")) {
        return { archetype: "ml-engineer", urgency: "next-sprint" };
      }
      if (desc.includes("data")) {
        return { archetype: "data-engineer", urgency: "next-sprint" };
      }
      return null;

    case "scope_outside_character":
      return { archetype: "principal-architect", urgency: "next-sprint" };

    case "missing_review_gate_coverage":
      if (desc.includes("accessibility") || desc.includes("a11y")) {
        return { archetype: "accessibility-engineer", urgency: "immediate" };
      }
      if (desc.includes("performance")) {
        return { archetype: "performance-engineer", urgency: "next-sprint" };
      }
      return { archetype: "qa-lead", urgency: "next-sprint" };

    case "new_platform_target":
      return { archetype: "platform-engineer", urgency: "immediate" };

    case "tier_upgrade":
      return { archetype: "technical-program-manager", urgency: "next-sprint" };

    case "cross_cutting_concern":
      if (desc.includes("security")) {
        return { archetype: "security-engineer", urgency: "immediate" };
      }
      if (desc.includes("observability") || desc.includes("monitoring")) {
        return { archetype: "sre-invisible-ops", urgency: "next-sprint" };
      }
      return { archetype: "solution-architect", urgency: "backlog" };

    default:
      return null;
  }
}
