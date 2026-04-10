# Knowledge Classification

## Purpose

This document defines the five knowledge types that the knowledge-capture skill can produce, along with the decision tree used to classify each candidate.

## Classification Types

### 1. Learning

A concrete insight discovered during work. Learnings are atomic facts or observations that a future agent would benefit from knowing. They are scoped to a specific technology, API, or behavior.

- **Hall**: `learnings`
- **Subhall**: none
- **Examples**:
  - "React useEffect cleanup runs before re-render, not after unmount"
  - "PostgreSQL JSONB indexes require GIN not B-tree for containment queries"
  - "Node.js fs.watch is unreliable on Linux — use chokidar instead"
  - "CSS grid `auto-fill` vs `auto-fit` behaves differently with fewer items than columns"

### 2. Pattern

A reusable approach identified across two or more tasks. Patterns are higher-level than learnings — they describe a strategy or technique that proved effective and is likely to apply again.

- **Hall**: `patterns`
- **Subhall**: none
- **Examples**:
  - "Retry with exponential backoff for flaky API calls"
  - "Extract validation into a shared schema and reuse across API and form layers"
  - "Use a discriminated union type for state machines instead of boolean flags"
  - "Wrap third-party SDKs in a thin adapter to isolate version churn"

### 3. ADR (Architectural Decision Record)

An architectural decision with rationale and alternatives considered. ADRs capture the *why* behind a choice, not just the *what*. They must include at least one alternative that was evaluated and rejected.

- **Hall**: `decisions`
- **Subhall**: none
- **Content structure**:
  ```
  ## Decision
  <what was decided>

  ## Context
  <why this decision was needed>

  ## Alternatives Considered
  - <alternative 1>: <why rejected>
  - <alternative 2>: <why rejected>

  ## Consequences
  <what follows from this decision>
  ```
- **Examples**:
  - "Chose SQLite over PostgreSQL for local-first storage — simpler deployment, no daemon, sufficient for single-user workloads"
  - "Adopted trunk-based branching over GitFlow — fewer long-lived branches, faster integration, better fit for CI/CD"

### 4. Review Rule

A rule distilled from a review gate rejection. When a review gate rejects work and provides actionable feedback, that feedback becomes a review rule to check in future reviews.

- **Hall**: `reviews`
- **Subhall**: the gate type that produced the rejection (`adversarial`, `code`, `security`, `architecture`, `qa`, `ui`)
- **Examples**:
  - "Always check for SQL injection in raw queries" (subhall: `security`)
  - "Ensure aria-labels on interactive elements" (subhall: `ui`)
  - "Reject functions longer than 50 lines without extraction justification" (subhall: `code`)
  - "Verify that new API endpoints have corresponding rate limiting" (subhall: `security`)

### 5. Skill Candidate

A new reusable skill the agent learned that could be promoted to a shared skill. Skill candidates are workflows or procedures that an agent improvised during a task and that appear generalizable.

- **Hall**: `skills`
- **Subhall**: `pending` (all candidates start here; promotion to `approved` happens via a separate review process)
- **Content structure**:
  ```
  ## Skill Name
  <proposed name>

  ## What It Does
  <description of the skill>

  ## How It Was Discovered
  <task context where this was first improvised>

  ## Reusability Signal
  <why this seems generalizable>
  ```
- **Examples**:
  - "Generate migration rollback scripts — after writing a forward migration, auto-generate the corresponding rollback"
  - "Auto-detect circular dependencies — scan import graph and flag cycles before they cause runtime issues"
  - "Inline environment variable validation — generate a startup check that verifies all required env vars are present"

## Decision Tree

Use the following tree to classify each knowledge candidate extracted from a merge context. Start at the root and follow the branches.

```
Is this knowledge derived from a review gate rejection?
├── YES --> review-rule
│         Write to reviews/<gate-type> subhall.
│
└── NO
    │
    Is this an explicit architectural or design decision
    with alternatives considered?
    ├── YES --> ADR
    │         Write to decisions hall.
    │
    └── NO
        │
        Does this describe a reusable multi-step workflow
        or procedure that could be automated?
        ├── YES --> skill-candidate
        │         Write to skills/pending subhall.
        │
        └── NO
            │
            Has this same approach been observed in 2+ tasks
            or does it describe a general strategy?
            ├── YES --> pattern
            │         Write to patterns hall.
            │
            └── NO --> learning
                      Write to learnings hall.
```

### Ambiguity Rules

When a candidate could fit multiple types:

1. **Review rule takes priority** — if the knowledge originated from a review rejection, classify it as a review rule even if it also looks like a learning.
2. **ADR over pattern** — if there is explicit mention of alternatives considered, classify as ADR even if the decision also establishes a pattern.
3. **Skill candidate over pattern** — if the candidate describes a concrete automatable procedure (not just a strategy), prefer skill-candidate.
4. **Pattern over learning** — if the insight has been observed in multiple tasks or is stated as a general principle, prefer pattern.
5. **When in doubt, default to learning** — learnings are the lowest-commitment type. It is better to capture something as a learning than to skip it entirely.

### Signals by Type

| Type | Positive Signals | Negative Signals |
|---|---|---|
| learning | "discovered", "turns out", "TIL", "gotcha", specific API/behavior | Abstract, no concrete fact |
| pattern | "always do X when Y", "reusable", "across multiple", "standard approach" | One-off, highly specific to a single codebase |
| ADR | "decided", "chose X over Y", "alternatives", "trade-off", "because" | No alternatives mentioned, not a decision point |
| review-rule | Review gate failed, "must check", "ensure", "reject if" | Not from a review, purely informational |
| skill-candidate | "automated", "script", "generator", "workflow", multi-step procedure | Manual one-off, not generalizable |
