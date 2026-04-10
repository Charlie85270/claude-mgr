# KB Interface Contract

## Purpose

This document defines the abstract boundary between callers (skills, agents, orchestration layers) and knowledge base storage backends. Every backend — mempalace, mock, or any future alternative — must implement the `KnowledgeBase` interface exactly as specified here. Callers never import from a backend directly; they import from `build/kb/kb-interface.ts` and receive a backend via dependency injection or factory.

## KnowledgeBase Interface Methods

### `init(config: KBConfig): Promise<void>`

Initialize the backend with the given configuration. Must be called before any other method. If the backend is already initialized, calling `init` again reconfigures it (idempotent). Throws `KBBackendError` if the backend cannot be started.

### `capture(input: KBCaptureInput): Promise<KBRoom>`

Write a new room to the KB. The backend assigns a unique `id` and `created_at` timestamp. The caller specifies `wing`, `hall`, optional `subhall`, `content`, optional `metadata`, and optional `tags`. Returns the fully-populated `KBRoom`. Throws `KBNotInitializedError` if `init()` has not been called. Throws `KBRoomNotFoundError` if the specified hall or subhall does not exist in `schema.yaml`. Throws `KBBackendError` on storage failure.

### `query(query: KBQuery): Promise<KBRoom[]>`

Read rooms matching the query filters. All fields in `KBQuery` are optional; an empty query returns all rooms (up to `limit`, default 50). The `semantic_query` field enables vector/semantic search if the backend supports it; backends that do not support semantic search must fall back to tag-based matching. Returns an empty array if nothing matches. Throws `KBNotInitializedError` if `init()` has not been called.

### `getById(id: string): Promise<KBRoom | null>`

Retrieve a single room by its unique ID. Returns `null` if the room does not exist (does not throw). Throws `KBNotInitializedError` if `init()` has not been called.

### `delete(id: string, reason: string): Promise<void>`

Soft-delete a room. The `reason` string is logged for auditability. Throws `KBRoomNotFoundError` if the ID does not exist. Throws `KBNotInitializedError` if `init()` has not been called.

### `export(path: string): Promise<void>`

Export the entire KB (or the currently scoped wing) to the given filesystem path as a portable format (JSON or YAML). Used for git mirroring and backup. Throws `KBBackendError` on I/O failure. Throws `KBNotInitializedError` if `init()` has not been called.

### `import(path: string): Promise<void>`

Import rooms from a previously exported file. Merges with existing data; does not overwrite rooms with the same ID unless the imported version is newer. Throws `KBBackendError` on I/O or parse failure. Throws `KBNotInitializedError` if `init()` has not been called.

### `health(): Promise<KBHealth>`

Return the health status of the backend. Must not throw — if the backend is unreachable, return `{ ok: false, backend: "<name>", version: "<version>" }`.

## Error Handling

Backends must throw only the following typed errors:

| Error Class | When |
|---|---|
| `KBNotInitializedError` | Any method called before `init()` |
| `KBRoomNotFoundError` | `delete` or `getById` targets a non-existent room (for `delete` only) |
| `KBBackendError` | Storage I/O failure, corrupt data, unreachable remote |

All three error classes are exported from `build/kb/kb-interface.ts`. Backends must not throw raw `Error` objects; callers rely on `instanceof` checks for error handling.

## Concurrency

- **Reads** (`query`, `getById`, `health`) must be safe for concurrent execution. Multiple agents may read simultaneously.
- **Writes** (`capture`, `delete`, `import`) are serialized per-wing. The backend must guarantee that two concurrent writes to the same wing do not corrupt data. Implementations may use a per-wing mutex, queue, or transaction mechanism.
- **Cross-wing** operations are independent and may execute concurrently.

## Solo vs Team Mode

### Solo Mode (v0.1+)

- Backend: local filesystem (mempalace).
- The KB lives on disk under `localPath`.
- Git mirror: after every write, the backend optionally syncs the KB export to `gitMirrorPath` so that KB state is version-controlled alongside the project.
- Wings: `private-<user-id>` and `season-<season-id>` only. `team-shared` is unavailable.

### Team Mode (v0.5+)

- Backend: local + remote sync.
- Reads hit local cache first, then remote if stale.
- Writes go to local, then async-replicate to `teamBackendUrl`.
- The `team-shared` wing becomes available.
- Conflict resolution: last-write-wins with vector clocks per room. Backends must implement merge logic or delegate to the team sync layer.
