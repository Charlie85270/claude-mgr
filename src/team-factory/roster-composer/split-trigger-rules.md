# Split Trigger Rules

When a single archetype instance is insufficient to handle the scope of work, the roster composer splits it into multiple parallel instances. Each split instance operates in its own git worktree and owns a distinct slice of the codebase.

## Split Trigger Table

| Archetype | Trigger Condition | Split Strategy | Max Instances |
|---|---|---|---|
| `frontend-engineer` | > 2 major UI modules OR > 1 frontend framework | One instance per module/framework | 4 |
| `backend-engineer` | > 2 microservices OR > 1 backend language | One instance per service/language boundary | 5 |
| `database-engineer` | > 1 database technology (e.g., Postgres + Redis + Mongo) | One instance per database technology | 3 |
| `mobile-ios-engineer` | > 3 major feature areas in the iOS app | One instance per feature area | 3 |
| `mobile-android-engineer` | > 3 major feature areas in the Android app | One instance per feature area | 3 |
| `ml-engineer` | > 1 ML model or pipeline | One instance per model/pipeline | 3 |
| `data-engineer` | > 2 data sources or ETL pipelines | One instance per pipeline cluster | 3 |
| `test-automation-engineer` | > 2 test domains (unit, integration, e2e, performance) | One instance per test domain | 4 |
| `code-reviewer` | Total active engineer instances > 6 | One reviewer per 3-4 engineers | 4 |
| `qa-lead` | Total active engineer instances > 10 | One QA lead per 5-6 engineers | 3 |
| `security-engineer` | Multiple compliance frameworks simultaneously | One instance per compliance domain | 2 |
| `technical-writer` | > 3 documentation deliverables (API docs, user guides, runbooks) | One instance per deliverable cluster | 3 |

## Split Mechanics

1. **Detection** — During roster composition (or mid-project via continuous expansion), the split trigger conditions are evaluated against the current project state.
2. **Proposal** — When a trigger fires, the roster composer proposes the split, including the number of instances and their ownership boundaries.
3. **User Approval** — Splits are presented to the user for confirmation. The user may adjust the number of instances or the ownership boundaries.
4. **Instantiation** — Each split instance receives:
   - A unique agent ID (e.g., `frontend-engineer-01`, `frontend-engineer-02`)
   - Its own git worktree
   - A scoped subset of the parent archetype's access matrix permissions
   - A clear ownership boundary documented in the scrum master's task board
5. **Coordination** — The scrum master tracks all split instances and ensures their work does not conflict. The principal architect reviews cross-instance integration points.

## Merge Rules

- Split instances may be **merged back** into a single instance if scope decreases (e.g., a microservice is cut from the project).
- Merging requires user approval and a clean integration pass by the code reviewer.
- The scrum master initiates merge proposals when utilization of a split instance drops below 20% for two consecutive sprints.
