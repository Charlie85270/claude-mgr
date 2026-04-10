# Knowledge Capture

## Name

`knowledge-capture`

## Purpose

The Knowledge Capture skill extracts structured knowledge from completed work and persists it to the knowledge base. Every successful merge produces artifacts worth remembering — insights, patterns, decisions, review rules, and potential new skills. This skill ensures nothing learned is lost.

## Trigger

Fires **after every successful merge** into the project's main branch. The orchestration layer invokes this skill as a post-merge hook, passing the merge context as input. The skill runs asynchronously — it must never block the merge itself or delay the next task assignment.

## Inputs

The skill receives a `MergeContext` object containing:

| Field | Type | Description |
|---|---|---|
| `taskDescription` | `string` | The original task description from the plan |
| `worktreeDiff` | `string` | The full diff of changes merged (unified diff format) |
| `reviewResults` | `ReviewResult[]` | Results from each review gate (pass/fail, gate type, feedback) |
| `character` | `CharacterRef` | The character who performed the work (name, archetype, tier) |
| `seasonId` | `string` | The active season identifier |
| `relatedFiles` | `string[]` | File paths touched by the merge |
| `commitMessages` | `string[]` | All commit messages in the merge |

## Classification Logic

The skill analyzes the merge context and classifies captured knowledge into one or more of the five types defined in `classify.md`. A single merge may produce multiple captures of different types.

### Classification Steps

1. **Extract candidates** — Scan the task description, diff, commit messages, and review feedback for knowledge signals. Look for phrases like "discovered that", "turns out", "decided to", "better approach", "rejected because", and similar markers.
2. **Classify each candidate** — Apply the decision tree from `classify.md` to assign each candidate a type.
3. **Deduplicate** — Check the KB for existing rooms with overlapping content in the same hall. If a near-duplicate exists, skip the capture or append to the existing room's metadata.
4. **Enrich** — Add tags, metadata, and cross-references before writing.

### Tag Generation

Every captured room is tagged with:

- `season:<season-id>` — the season that produced the knowledge
- `character:<character-name>` — the character who did the work (e.g., `character:sheldon-cooper`)
- `archetype:<archetype-name>` — the functional role (e.g., `archetype:principal-architect`)
- `tier:<tier>` — the tier of the archetype (`medium`, `large`, or `enterprise`)
- Technology tags extracted from the diff and task description (e.g., `tech:react`, `tech:postgresql`, `tech:docker`)

## Outputs

For each classified candidate, the skill calls `kb.capture()` via the KB Interface with:

| Field | Value |
|---|---|
| `wing` | `season-<seasonId>` |
| `hall` | Determined by classification type (see `classify.md`) |
| `subhall` | Set for `review-rule` (gate name) and `skill-candidate` (`pending`) |
| `content` | The extracted knowledge, written as a concise markdown paragraph |
| `metadata` | `{ source_task, source_character, source_archetype, merge_sha }` |
| `tags` | Generated tag array as described above |

The skill returns a `CaptureResult` summarizing what was captured:

```
{
  captured: number;        // total rooms written
  skipped: number;         // deduplicated or empty candidates
  breakdown: {
    learnings: number;
    patterns: number;
    adrs: number;
    reviewRules: number;
    skillCandidates: number;
  };
}
```

## Error Handling

- **KB unavailable**: If `kb.health()` returns `{ ok: false }`, log a warning and exit silently. Knowledge capture is best-effort; it must never block the development workflow.
- **Classification failure**: If a candidate cannot be classified, log it as an unclassified entry and skip. Do not write unclassified content to any hall.
- **Write failure**: If `kb.capture()` throws `KBBackendError`, retry once after a short delay. If the retry fails, log the error and continue with remaining candidates.
- **Empty merge**: If the merge context contains no extractable knowledge (e.g., a trivial formatting change), exit early with `{ captured: 0, skipped: 0 }`.

## Dependencies

- **KB Interface** (`../kb-interface/`) — all reads and writes go through the `KnowledgeBase` interface. See `contract.md` for method signatures.
- **Schema** (`../kb-interface/schema.yaml`) — defines valid halls and subhalls. The skill must only write to halls listed in the schema.
- **Classification rules** (`classify.md`) — decision tree and type definitions for the five knowledge types.

## Files

- `classify.md` — Classification types, decision tree, and examples
