# KB Interface

## Purpose

The KB Interface provides the abstraction boundary for all knowledge base operations. It defines the contract that every storage backend must implement, ensuring that callers (skills, agents, orchestration layers) never depend on a specific backend. All KB access flows through this interface.

## How It Works

### Wing / Hall / Room Taxonomy

Knowledge is organized into a three-level hierarchy:

- **Wing**: isolation boundary. Each user gets a private wing (`private-<user-id>`), each season gets a scoped wing (`season-<season-id>`), and team mode adds a shared wing (`team-shared`).
- **Hall**: topic category within a wing (learnings, patterns, decisions, reviews, skills, counselor-verdicts).
- **Room**: a single knowledge entry. Rooms have content, metadata, tags, and a unique ID.

Some halls have **subhalls** for finer categorization (e.g., `reviews` has `adversarial`, `code`, `security`, etc.).

### When to Use

Any time an agent or skill needs to read from or write to the knowledge base. Specific triggers:

- **Capture**: after completing a task, an agent captures learnings, patterns, or decisions.
- **Query**: before starting work, an agent queries for relevant prior knowledge.
- **Export/Import**: during git mirror sync or backup/restore workflows.
- **Health**: orchestration checks backend availability before dispatching KB-dependent tasks.

### Inputs

- `KBConfig` — passed to `init()`. Specifies mode (solo/team), backend name, local path, optional team URL, and optional git mirror path.
- `KBCaptureInput` — passed to `capture()`. Specifies wing, hall, optional subhall, content, optional metadata, and optional tags.
- `KBQuery` — passed to `query()`. All fields optional: wing, hall, subhall, tags, semantic query string, limit.

### Outputs

- `KBRoom` — the core data object. Contains id, wing, hall, optional subhall, content, metadata, created_at timestamp, and tags.
- `KBHealth` — status object with ok flag, backend name, and version string.

### Dependencies

- A concrete backend implementation is required at runtime. For v0.1, this is **mempalace** (local filesystem). A **mock** backend is available for testing.
- The taxonomy (wings, halls, subhalls) is defined in `schema.yaml` within this skill directory.

## Files

- `schema.yaml` — Wing/hall/room taxonomy definition
- `contract.md` — Full interface contract with method signatures, error handling, concurrency, and mode semantics
