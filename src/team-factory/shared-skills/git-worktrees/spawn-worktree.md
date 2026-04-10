# Spawn Worktree

## Purpose

This document defines the step-by-step procedure for creating a new git worktree when a character is assigned a task. The worktree provides an isolated working directory so the character can make changes without interfering with other characters' concurrent work.

## Procedure

### Step 1: Check Concurrency Limit

Before creating anything, count the number of active worktrees in the season workspace:

```bash
git worktree list --porcelain | grep -c "^worktree "
```

If the count is **10 or more**, reject the spawn request. Return an error indicating the per-season concurrency cap has been reached. The orchestration layer will re-queue the task and retry when a worktree slot becomes available.

The cleanup process (`cleanup-orphans.md`) does not count toward this limit — only active task worktrees are counted.

### Step 2: Generate Worktree Name

Build the worktree directory name from the character slug and task ID:

```
<character>-<task-id>
```

**Examples**:
- `stuart-bloom-task-042`
- `sheldon-cooper-task-117`
- `penny-task-003`

This name is deterministic — given the same character and task ID, the name is always the same.

### Step 3: Derive Branch Name

The task branch follows the pattern:

```
task/<character>-<task-id>
```

**Examples**:
- `task/stuart-bloom-task-042`
- `task/sheldon-cooper-task-117`
- `task/penny-task-003`

### Step 4: Create the Worktree

From the season workspace root, run:

```bash
git worktree add -b task/<character>-<task-id> <season>/worktrees/<character>-<task-id>/ main
```

This creates a new branch off `main` (the season workspace's main branch) and checks it out into the worktree directory. The `-b` flag creates the branch and the final argument specifies the starting point.

If the branch already exists (e.g., from a prior failed attempt), remove it first:

```bash
git branch -D task/<character>-<task-id>
```

Then retry the worktree creation.

### Step 5: Confirm Worktree Path

The worktree is now available at:

```
<season>/worktrees/<character>-<task-id>/
```

Verify the worktree was created successfully:

```bash
git worktree list
```

The new worktree should appear in the list with the correct branch name.

### Step 6: Record Metadata

Write lifecycle metadata for the new worktree. This metadata is used by the orphan cleanup process and for auditing:

| Field | Value |
|---|---|
| `character` | The character slug (e.g., `stuart-bloom`) |
| `taskId` | The task identifier (e.g., `042`) |
| `branchName` | `task/<character>-<task-id>` |
| `worktreePath` | Full path to the worktree directory |
| `createdAt` | ISO 8601 timestamp of creation |
| `lastCommitAt` | ISO 8601 timestamp of the latest commit (initially same as `createdAt`) |

This metadata is stored alongside the season's worktree tracking state so that `cleanup-orphans` can determine idle duration without scanning git logs on every check.

## Error Cases

| Error | Cause | Resolution |
|---|---|---|
| Concurrency limit reached | 10 active worktrees already exist | Re-queue the task. Wait for a merge or cleanup to free a slot. |
| Branch already exists | Prior failed spawn or incomplete cleanup | Delete the stale branch, then retry. |
| Workspace not found | Invalid `workspacePath` | Fail the task assignment. Log an error for the orchestration layer. |
| Main branch missing | `mainBranch` does not exist in the repository | Fail the task assignment. This indicates a misconfigured season workspace. |
