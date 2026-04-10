# Query Patterns

## Purpose

This document defines the common query templates used by the knowledge-retrieval skill. Each pattern targets a specific retrieval scenario with a tuned combination of filters, semantic search, and result limits. Agents and skills should use these patterns as-is or compose them for complex lookups.

## Query Templates

### 1. Pre-Task Lookup

**When**: Before starting any task. This is the default query pattern and fires on every task.

**Goal**: Find learnings and patterns related to the task's technology stack so the agent starts with known context instead of re-discovering it.

**Strategy**: Combine a semantic query on the task description with tech-stack tag filters. Search the `learnings` and `patterns` halls in parallel.

**Example query objects**:

```yaml
# Learnings query
wing: "season-s003"
hall: "learnings"
semantic_query: "implement OAuth2 PKCE flow for single-page application"
tags:
  - "tech:react"
  - "tech:oauth"
limit: 5

# Patterns query
wing: "season-s003"
hall: "patterns"
semantic_query: "implement OAuth2 PKCE flow for single-page application"
tags:
  - "tech:react"
  - "tech:oauth"
limit: 5
```

**Expected results**: Concrete insights about OAuth2 edge cases, known patterns for token refresh handling, SPA-specific security considerations.

---

### 2. Review-Rule Recall

**When**: Before running a review gate. The orchestration layer invokes this pattern after the agent completes work but before the review gates execute, so the agent can self-check against known rules.

**Goal**: Fetch all review rules for the specific gate type(s) the task will pass through. This gives the agent a "pre-flight checklist" of things that have caused rejections in the past.

**Strategy**: Query the `reviews` hall with the gate type as the subhall. No semantic query needed — fetch all rules for the gate. If the task passes through multiple gates, issue one query per gate.

**Example query objects**:

```yaml
# Security gate rules
wing: "season-s003"
hall: "reviews"
subhall: "security"
limit: 10

# Code gate rules
wing: "season-s003"
hall: "reviews"
subhall: "code"
limit: 10

# UI gate rules (only if task involves UI)
wing: "season-s003"
hall: "reviews"
subhall: "ui"
limit: 10
```

**Expected results**: Rules like "always check for SQL injection in raw queries", "ensure aria-labels on interactive elements", "reject functions longer than 50 lines without extraction justification".

---

### 3. ADR Search

**When**: When an agent faces an architectural decision and wants to check whether a similar decision has already been made — either in this season or a prior one.

**Goal**: Find prior ADRs on similar topics to avoid contradicting established decisions or re-litigating settled questions.

**Strategy**: Query the `decisions` hall with a semantic query describing the decision being considered. Include technology tags for precision. If no results in the current season, fall back to the private wing for cross-season coverage.

**Example query objects**:

```yaml
# Current season ADR search
wing: "season-s003"
hall: "decisions"
semantic_query: "database selection for user session storage"
tags:
  - "tech:postgresql"
  - "tech:redis"
limit: 5

# Cross-season fallback
wing: "private-user001"
hall: "decisions"
semantic_query: "database selection for user session storage"
tags:
  - "tech:postgresql"
  - "tech:redis"
limit: 5
```

**Expected results**: Prior decisions like "chose Redis over PostgreSQL for session storage due to TTL support and sub-millisecond reads", with rationale and alternatives considered.

---

### 4. Skill Lookup

**When**: Before starting a task, check if an approved skill can handle part of the work. Also useful when an agent is about to improvise a multi-step procedure.

**Goal**: Find approved skills that match the current task, so the agent can invoke an existing skill instead of improvising a new workflow.

**Strategy**: Query the `skills` hall with `approved` subhall and a semantic query built from the task description. Only approved skills are returned — pending and deprecated skills are excluded.

**Example query objects**:

```yaml
# Approved skill search
wing: "season-s003"
hall: "skills"
subhall: "approved"
semantic_query: "generate database migration with rollback"
limit: 3

# Broader skill search across seasons
wing: "private-user001"
hall: "skills"
subhall: "approved"
semantic_query: "generate database migration with rollback"
limit: 3
```

**Expected results**: Skills like "generate migration rollback scripts" with their full procedure descriptions, enabling the agent to follow the established workflow.

---

### 5. Cross-Season Search

**When**: When the current season's KB has sparse coverage — either because the season is new or because the topic has not been encountered before. Also triggered automatically as the fallback step in the retrieval skill's query strategy.

**Goal**: Surface learnings and patterns from previous seasons that are still applicable. Knowledge does not expire just because a season ended — a PostgreSQL insight from season 1 is just as valid in season 5.

**Strategy**: Query the private wing (which aggregates across seasons) with a semantic query and tech-stack tags. The private wing contains knowledge that was explicitly promoted or mirrored from season-scoped wings.

**Example query objects**:

```yaml
# Broad cross-season search
wing: "private-user001"
semantic_query: "WebSocket connection management and reconnection"
tags:
  - "tech:websocket"
  - "tech:node"
limit: 10

# Cross-season with archetype filter
wing: "private-user001"
semantic_query: "WebSocket connection management and reconnection"
tags:
  - "tech:websocket"
  - "archetype:backend-engineer"
limit: 10
```

**Expected results**: Insights from any season where WebSocket work was done — connection pooling gotchas, reconnection backoff patterns, heartbeat interval recommendations.

## Composing Queries

For complex retrieval scenarios, patterns can be composed. The retrieval skill's default behavior (documented in `SKILL.md`) already composes patterns 1, 2, 3, 4, and 5 into a single pre-task retrieval pass. Custom compositions include:

### Pre-Review Composition

Before a review gate runs, compose pattern 2 (review-rule recall) with pattern 1 (pre-task lookup) scoped to the review domain:

```yaml
# Step 1: Fetch gate-specific rules
wing: "season-s003"
hall: "reviews"
subhall: "security"
limit: 10

# Step 2: Fetch learnings about the review topic
wing: "season-s003"
hall: "learnings"
semantic_query: "security vulnerabilities and injection attacks"
tags:
  - "tech:sql"
  - "tech:express"
limit: 5
```

### Decision-Making Composition

When an agent faces an architectural decision, compose pattern 3 (ADR search) with pattern 1 (pre-task lookup) to get both prior decisions and raw learnings:

```yaml
# Step 1: Find prior ADRs
wing: "season-s003"
hall: "decisions"
semantic_query: "choosing between REST and GraphQL for internal API"
limit: 5

# Step 2: Find learnings about each option
wing: "season-s003"
hall: "learnings"
semantic_query: "REST vs GraphQL trade-offs and performance"
tags:
  - "tech:graphql"
  - "tech:rest"
limit: 5
```

## Query Tuning Guidelines

| Parameter | Guidance |
|---|---|
| `limit` | Use 5-10 for targeted queries (single hall). Use 10-15 for broad queries (no hall filter). Never exceed 20 — prompt context is finite. |
| `tags` | Prefer 1-3 specific tech tags over many broad ones. Too many tags produce narrow results. |
| `semantic_query` | Keep under 100 words. Use the task description directly rather than trying to optimize it — the backend handles relevance ranking. |
| `wing` | Always start with the season wing. Fall back to private wing only when season results are insufficient (fewer than 3 rooms). |
| `hall` | Specify a hall when querying for a specific knowledge type. Omit the hall for broad "find anything relevant" queries. |
| `subhall` | Required for review rules (gate type) and skills (approval status). Optional for other halls. |
