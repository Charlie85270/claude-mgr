# Scope Estimator — Tier Assignment Heuristics

The scope estimator classifies a project into one of three size tiers based on signals extracted from the parsed PRD. The tier determines how many archetypes are included in the initial roster.

## Tier Definitions

### Medium (~10 archetypes)

A medium project is a **single-product SaaS application** with a focused scope.

**Signals:**
- Single technology stack (e.g., React + Node, or Rails monolith)
- One deployment target (web only)
- Timeline of 1-3 months
- No regulatory or compliance requirements
- Single user persona or a small set of closely related personas
- No mobile-native components
- Standard authentication (OAuth / email-password)
- No ML/AI subsystems
- No internationalization requirements

**Core archetypes (~10):**
ingestion-pm, user-handler, scrum-master, principal-architect, frontend-engineer, backend-engineer, database-engineer, qa-lead, code-reviewer, technical-writer

### Large (~20 archetypes)

A large project is a **multi-platform product** with meaningful breadth.

**Signals:**
- Multiple deployment targets (web + mobile, or web + desktop)
- Two or more technology stacks (e.g., React frontend + Go backend + Swift mobile)
- Timeline of 3-9 months
- At least one compliance requirement (SOC 2, GDPR, HIPAA-adjacent)
- Multiple distinct user personas
- CI/CD pipeline complexity (multi-environment, staged rollouts)
- API integrations with third-party systems
- Performance SLAs or uptime guarantees

**Additional archetypes added (~10 more, total ~20):**
security-engineer, adversarial-reviewer, refinement-builder, cicd-pipeline-engineer, sre-invisible-ops, ux-designer, ux-researcher, product-manager, release-manager, dependency-auditor

### Enterprise (~40 archetypes)

An enterprise project operates in a **regulated industry** with deep specialization needs.

**Signals:**
- Regulated industry (healthcare, finance, government, defense)
- Multiple products or product lines under one umbrella
- Timeline of 9+ months or ongoing/indefinite
- Hard compliance mandates (HIPAA, PCI-DSS, FedRAMP, SOX)
- Dedicated mobile apps for iOS and Android
- ML/AI subsystems or data pipelines
- Internationalization and localization requirements
- Accessibility mandates (WCAG AA or higher)
- Multiple development teams or squads
- Complex incident response requirements

**Additional archetypes added (~20 more, total ~40):**
incident-commander, content-designer, performance-engineer, accessibility-engineer, localization-engineer, privacy-officer, developer-experience-engineer, mobile-ios-engineer, mobile-android-engineer, ml-engineer, data-engineer, test-automation-engineer, platform-engineer, appsec-engineer, technical-program-manager, data-scientist, dba, developer-advocate, solution-architect, customer-success-engineer, mlops-engineer, ai-safety-engineer

## Scoring Approach

When signals are ambiguous or span tiers, the estimator uses a weighted score:

1. Count the number of signals matched in each tier.
2. If the majority of signals match a single tier, assign that tier.
3. If signals are split across tiers, prefer the **higher** tier — it is safer to include an archetype that goes unused than to omit one that is needed mid-project.
4. Present the tier recommendation with confidence (high / medium / low) and let the user confirm or override.

## Override Rules

- If the user explicitly requests a tier, honor it regardless of signals.
- If the parsed PRD mentions "MVP" or "prototype," cap at medium unless overridden.
- If the parsed PRD mentions "enterprise," "regulated," or specific compliance frameworks, floor at large.
