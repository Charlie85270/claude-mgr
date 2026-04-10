# Continuous Expansion — Mid-Season Team Growth

The roster is not fixed at project start. As work progresses, new needs emerge that the initial roster may not cover. Continuous expansion allows the team to grow organically by detecting gaps and spawning new archetype instances mid-project.

## Expansion Flow

```
Gap Detection → Proposal Generation → User Approval → Archetype Spawn
```

### 1. Gap Detection

Gaps are detected through multiple channels:

- **Scrum Master Observation** — The scrum master monitors sprint velocity, blocked tasks, and recurring impediments. If a pattern indicates a missing skill (e.g., repeated security findings with no security-engineer on the roster), it flags a gap.
- **Principal Architect Escalation** — The principal architect identifies architectural needs that no current archetype can address (e.g., a new ML pipeline requirement when no ml-engineer exists).
- **Quality Gate Feedback** — When quality gates repeatedly fail in a specific domain (e.g., accessibility audits), the system infers a missing specialist.
- **User Request** — The user explicitly requests an additional archetype.
- **PRD Amendment** — The ingestion PM detects a scope change in an updated PRD that introduces requirements outside the current roster's coverage.

### 2. Proposal Generation

When a gap is detected, the roster composer generates an expansion proposal:

| Field | Description |
|---|---|
| `archetype` | The archetype to spawn |
| `trigger` | What detected the gap (scrum-master, architect, quality-gate, user, prd-amendment) |
| `evidence` | Specific signals or events that justify the addition |
| `tier` | The tier this archetype normally belongs to |
| `impact` | Expected effect on velocity, quality, or risk |
| `dependencies` | Other archetypes this new instance will interact with most |

### 3. User Approval

Expansion proposals are always presented to the user before execution. The user may:

- **Approve** — The archetype is spawned immediately.
- **Defer** — The proposal is saved and re-evaluated next sprint.
- **Reject** — The proposal is discarded with a recorded rationale.
- **Modify** — The user adjusts the proposal (e.g., choosing a different archetype or scoping the role differently).

No archetype is ever spawned without explicit user consent.

### 4. Archetype Spawn

Once approved, the new archetype is instantiated:

1. The theme engine assigns a character identity from the active theme (or its expansion pack).
2. The access matrix grants the archetype its scoped permissions.
3. The scrum master integrates the new archetype into the current sprint plan.
4. The principal architect briefs the new archetype on architectural context and active conventions.
5. The new archetype receives a warm handoff: relevant knowledge base entries, current branch state, and any blocked tasks it should pick up.

## Contraction

The reverse flow also exists. If an archetype becomes idle (no tasks assigned for two consecutive sprints and no foreseeable need), the scrum master may propose **retirement**:

- The archetype completes any in-progress work and merges its branches.
- Knowledge is captured and persisted to the knowledge base.
- The archetype is deactivated (not deleted — it can be re-spawned if needed).
- The user is notified of the retirement.

## Limits

- Maximum total active archetypes at any time: 50 (configurable).
- Maximum expansions per sprint: 3 (to avoid destabilizing the team).
- Mandatory archetypes (user-handler, ingestion-pm, scrum-master, principal-architect) can never be retired.
