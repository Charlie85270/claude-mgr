# Knowledge Retrieval

## Name

`knowledge-retrieval`

## Purpose

The Knowledge Retrieval skill surfaces relevant prior knowledge before an agent begins work. By querying the KB for learnings, patterns, decisions, review rules, and approved skills that relate to the current task, the skill provides agents with "prior art" context that improves output quality and avoids re-discovering known solutions. The skill is advisory — it enriches the agent's prompt context but never gates or blocks task execution.

## Trigger

Fires **before starting any task**. The orchestration layer invokes this skill during the pre-task setup phase, after the task is assigned to an agent but before the agent begins execution. The result is injected into the agent's prompt context as a "prior art" section.

## Inputs

The skill receives a `TaskContext` object containing:

| Field | Type | Description |
|---|---|---|
| `taskDescription` | `string` | The task description from the plan or sprint backlog |
| `relatedFiles` | `string[]` | File paths the task is expected to touch (from the plan or worktree analysis) |
| `archetype` | `ArchetypeRef` | The assigned archetype (name, tier) |
| `seasonId` | `string` | The active season identifier |
| `character` | `CharacterRef` | The character performing the task (name, archetype, tier) |
| `techStack` | `string[]` | Technology tags inferred from the project (e.g., `react`, `postgresql`, `docker`) |
| `gateTypes` | `string[]` | Review gate types this task will pass through (e.g., `code`, `security`, `ui`) |

## Query Strategy

The skill builds and executes multiple targeted queries against the KB, then merges and ranks the results. This multi-query approach ensures broad coverage without relying on a single query to surface all relevant knowledge.

### Query Construction

1. **Primary query** — Combine the task description as a semantic query with the tech stack as tag filters. Scope to the current season's wing plus the private wing. Limit: 10 rooms.

   ```
   {
     wing: "season-<seasonId>",
     semantic_query: "<taskDescription>",
     tags: ["tech:<stack-item>", ...],
     limit: 10
   }
   ```

2. **Review-rule query** — For each gate type the task will pass through, fetch review rules from the corresponding subhall. This ensures the agent knows what reviewers will check.

   ```
   {
     wing: "season-<seasonId>",
     hall: "reviews",
     subhall: "<gateType>",
     limit: 5
   }
   ```

3. **Pattern query** — Fetch patterns tagged with any of the task's technology tags. Patterns are high-value because they encode proven approaches.

   ```
   {
     wing: "season-<seasonId>",
     hall: "patterns",
     tags: ["tech:<stack-item>", ...],
     limit: 5
   }
   ```

4. **ADR query** — Fetch recent architectural decisions relevant to the files being touched. Uses the file paths to construct a semantic query.

   ```
   {
     wing: "season-<seasonId>",
     hall: "decisions",
     semantic_query: "<relatedFiles joined>",
     limit: 3
   }
   ```

5. **Approved skills query** — Check if any approved skills match the task description. If a match is found, the agent can invoke that skill rather than improvising.

   ```
   {
     wing: "season-<seasonId>",
     hall: "skills",
     subhall: "approved",
     semantic_query: "<taskDescription>",
     limit: 3
   }
   ```

6. **Cross-season fallback** — If queries 1-5 return fewer than 3 total rooms, broaden the search to the private wing (which spans seasons). This catches knowledge from previous seasons that may still apply.

   ```
   {
     wing: "private-<userId>",
     semantic_query: "<taskDescription>",
     tags: ["tech:<stack-item>", ...],
     limit: 5
   }
   ```

### Result Merging

After all queries complete:

1. **Deduplicate** — Remove rooms that appear in multiple query results (match by room ID).
2. **Rank** — Score each room by relevance. Scoring factors:
   - Semantic similarity to the task description (highest weight)
   - Tag overlap with the task's tech stack
   - Recency (newer rooms score higher, all else equal)
   - Same-archetype bonus (knowledge from the same archetype is more likely to be relevant)
3. **Cap** — Return the top-N rooms (default N=10, configurable). The cap prevents prompt bloat.
4. **Format** — Structure the results as a `PriorArt` object for injection into the agent's context.

## Outputs

The skill returns a `PriorArt` object:

```
{
  rooms: KBRoom[];           // top-N relevant rooms, ranked by score
  totalCandidates: number;   // total rooms found before capping
  queryCount: number;        // number of queries executed
  crossSeasonUsed: boolean;  // whether the cross-season fallback was triggered
  empty: boolean;            // true if no results were found at all
}
```

Each `KBRoom` in the result includes its type classification (learning, pattern, ADR, review-rule, skill) so the agent can reason about the nature of each piece of prior art.

### Prompt Injection Format

The orchestration layer formats the `PriorArt` into a prompt section:

```
## Prior Art

The following knowledge was retrieved from the KB. Use it to inform your approach.

### Learnings
- <content> (from season X, discovered by <character>)

### Patterns
- <content>

### Review Rules (gates: code, security)
- <rule>

### Relevant Decisions
- <decision summary>

### Available Skills
- <skill name>: <description>
```

If `empty` is `true`, the section is omitted entirely.

## Error Handling

- **KB unavailable**: If `kb.health()` returns `{ ok: false }`, return `{ rooms: [], totalCandidates: 0, queryCount: 0, crossSeasonUsed: false, empty: true }`. Never block task execution due to KB unavailability.
- **Query timeout**: Each individual query has a 2-second timeout. If a query times out, skip it and continue with remaining queries. Log the timeout for diagnostics.
- **Partial failure**: If some queries succeed and others fail, return results from the successful queries. The skill is best-effort by design.
- **Malformed task context**: If required fields (`taskDescription`, `seasonId`) are missing, log a warning and return an empty result. Optional fields (`relatedFiles`, `techStack`, `gateTypes`) default to empty arrays if absent.
- **Backend errors**: If `kb.query()` throws `KBBackendError`, catch it, log it, and return an empty result for that query. Do not propagate the error.

## Dependencies

- **KB Interface** (`../kb-interface/`) — all queries go through the `KnowledgeBase` interface. See `contract.md` for the `query()` method signature and semantics.
- **Schema** (`../kb-interface/schema.yaml`) — defines valid halls and subhalls. The skill must only query halls listed in the schema.
- **Query patterns** (`query-patterns.md`) — documents common query templates and example query objects for each retrieval scenario.

## Files

- `query-patterns.md` — Common query templates, example query objects, and usage guidance
