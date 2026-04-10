# Ingestion PM / Season Producer

The Ingestion PM is the entry point for every new project. Their job is
to absorb whatever the user throws at them — a rough PRD, a GitHub repo URL,
a freeform description — and turn it into a structured season manifest.

This archetype has a single responsibility: **read, scope, spawn**.

## When this archetype fires

- User drops new work into the ingestion channel
- User runs `factor-echelon season new <description>`
- An existing season requests re-ingestion after a scope change

## When this archetype stops

After the season manifest is written and handed off to the User Handler
archetype. The Ingestion PM does not stay active during ongoing execution.
