# Merge Worktree

## Purpose

This document defines the step-by-step procedure for merging a completed worktree back into the season workspace's main branch and cleaning up the worktree and its task branch. This procedure runs only after all review gates have passed.

## Prerequisites

- All review gates must pass, including Leonard's approval. No merge proceeds without a passing review verdict.
- The worktree must contain at least one commit beyond the branch point from `main`. Empty worktrees should be cleaned up via `cleanup-orphans.md` instead.

## Procedure

### Step 1: Verify Review Gates

Confirm that all review gates have passed for this task. The orchestration layer provides review results as part of the merge context. If any gate has a `fail` status, abort the merge and return the work to the character with the review feedback.

Required approval: **Leonard's sign-off**. This is a hard gate — no exceptions.

### Step 2: Checkout Main Branch

Switch to the season workspace's main branch:

```bash
cd <workspacePath>
git checkout main
git pull --ff-only
```

The `--ff-only` pull ensures main is up to date without creating merge commits from upstream changes. If `--ff-only` fails, main has diverged and needs manual resolution before any task merges proceed.

### Step 3: Merge the Task Branch

Perform a no-fast-forward merge to preserve the task branch history as a distinct unit of work:

```bash
git merge --no-ff task/<character>-<task-id> -m "Merge task/<character>-<task-id>: <task summary>"
```

The `--no-ff` flag ensures a merge commit is always created, even if a fast-forward merge is possible. This makes the branch history readable — each task's commits are grouped under a single merge commit.

If the merge produces conflicts:
1. Abort the merge: `git merge --abort`
2. Return the task to the character with conflict details
3. The character resolves conflicts in their worktree, commits, and re-submits for review

### Step 4: Remove the Worktree

After a successful merge, remove the worktree directory:

```bash
git worktree remove <season>/worktrees/<character>-<task-id>/
```

If the worktree has uncommitted changes (which should not happen post-merge), use the `--force` flag. Log a warning if force removal is required — it indicates a process gap.

### Step 5: Delete the Task Branch

Clean up the task branch since its commits are now reachable from `main`:

```bash
git branch -d task/<character>-<task-id>
```

The lowercase `-d` flag ensures the branch is only deleted if it has been fully merged. If `-d` fails, something went wrong with the merge — investigate before using `-D`.

### Step 6: Trigger Knowledge Capture

Invoke the `knowledge-capture` skill to extract learnings from this merge. Pass the full merge context:

| Field | Source |
|---|---|
| `taskDescription` | Original task description from the plan |
| `worktreeDiff` | Output of `git diff main~1..main` (the merge diff) |
| `reviewResults` | All review gate results (pass/fail, gate type, feedback) |
| `character` | The character who performed the work |
| `seasonId` | The active season identifier |
| `relatedFiles` | Files touched in the merge |
| `commitMessages` | All commit messages from the task branch |

Knowledge capture runs asynchronously and must not block subsequent task assignments.

## Error Cases

| Error | Cause | Resolution |
|---|---|---|
| Review gate not passed | Merge attempted before all gates pass | Abort. Return work to the character. |
| Fast-forward-only pull fails | Main branch has diverged from remote | Resolve upstream divergence before proceeding with any merges. |
| Merge conflict | Task branch conflicts with changes merged since the branch was created | Abort the merge. Character resolves conflicts in their worktree and re-submits. |
| Worktree removal fails | Uncommitted changes or locked files | Force-remove and log a warning for investigation. |
| Branch delete fails | Branch not fully merged | Investigate the merge. Do not force-delete until the issue is understood. |
