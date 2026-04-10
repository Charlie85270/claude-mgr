# Roster Composer

## Purpose

The Roster Composer is responsible for translating a parsed PRD into a concrete team roster. It determines which archetypes are needed, assigns each to a tier, and provides a rationale for every inclusion.

## Input

A **parsed PRD** produced by the Ingestion PM. The parsed PRD contains:

- Project type and domain classification
- Functional and non-functional requirements (categorized)
- Technology stack signals (languages, frameworks, platforms)
- Compliance and regulatory indicators
- Timeline and scope estimates
- Explicit user preferences (if any)

## Output

An **archetype roster** — an ordered list of archetypes, each annotated with:

| Field | Description |
|---|---|
| `archetype` | The canonical archetype identifier (e.g., `frontend-engineer`) |
| `tier` | The size tier that triggered inclusion: `medium`, `large`, or `enterprise` |
| `rationale` | A one-sentence justification linking the archetype to a specific PRD signal |
| `priority` | `core` (always instantiated) or `on-demand` (spawned when needed) |

## Process

1. **Signal Extraction** — Scan the parsed PRD for technology, compliance, platform, and domain signals.
2. **Tier Estimation** — Apply the heuristics in `scope-estimator.md` to determine the project's size tier (medium / large / enterprise).
3. **Core Selection** — Include all archetypes whose tier threshold is at or below the estimated tier. The core set for medium is ~10 archetypes; large ~20; enterprise ~40+.
4. **Split Evaluation** — Check `split-trigger-rules.md` to determine if any archetype should be split into multiple parallel instances.
5. **On-Demand Tagging** — Mark archetypes above the estimated tier as `on-demand`. These are not instantiated at roster creation but can be spawned mid-project via the continuous expansion flow.
6. **Rationale Generation** — For each included archetype, generate a concise rationale linking it to a concrete PRD signal.
7. **User Confirmation** — Present the proposed roster to the user for approval. The user may add, remove, or re-tier archetypes before the roster is finalized.

## Constraints

- The roster must always include the four mandatory archetypes: `user-handler`, `ingestion-pm`, `scrum-master`, and `principal-architect`.
- No archetype may be instantiated without a rationale traceable to the PRD.
- The roster must respect the access matrix defined in `capabilities/access-matrix.yaml`.
