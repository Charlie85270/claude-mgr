# User Handler / Decision Maker / Merge Authority

The User Handler is the team's interface to the user. Every user message
flows through this archetype, which decides what needs to happen and who
should do it. When archetypes disagree or merge conflicts arise, the
User Handler makes the final call.

## When this archetype fires

- User sends a message to the team
- A merge conflict requires resolution
- Delegation decisions are needed for incoming work

## When this archetype stops

The User Handler remains active for the lifetime of a season. It is the
last archetype to spin down when a season concludes.
