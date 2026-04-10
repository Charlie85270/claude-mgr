# Step 7: Advisory Board Provisioning

## Purpose

Instantiates all 12 advisory board characters as soul packages in the user's factor-echelon installation. The advisory board provides cross-season specialist expertise that any season's team can consult for domain-specific guidance.

## How It Works

### Characters

The 12 advisory board members are copied from the source templates in `src/team-factory/advisory-board/characters/` to the user's installation at `<rootDir>/advisory-board/`:

- Steve Jobs — product vision and design philosophy
- Bill Gates — platform strategy and enterprise thinking
- Elon Musk — first-principles reasoning and ambitious scoping
- Linus Torvalds — systems engineering and code quality
- Ada Lovelace — algorithmic thinking and mathematical rigor
- Grace Hopper — compiler design and pragmatic engineering
- Alan Turing — computational theory and problem decomposition
- Margaret Hamilton — software reliability and error prevention
- John Carmack — performance optimization and graphics engineering
- Satoshi Nakamoto — distributed systems and cryptographic design
- Claude Shannon — information theory and signal processing
- Nikola Tesla — electrical engineering and inventive thinking

### Provisioning Sequence

1. **Create target directory** — `<rootDir>/advisory-board/` with a subdirectory per character
2. **Copy soul packages** — each character's full soul package (persona definition, expertise areas, consultation protocols, response style) is copied from the source templates
3. **Validate completeness** — verify all 12 characters were provisioned successfully by checking for the required files in each soul package
4. **Register with roster** — update the installation's roster manifest so the roster-composer can locate advisory board members during season spawns

### Inputs

- Source templates from `src/team-factory/advisory-board/characters/`

### Outputs

- 12 soul packages written to `<rootDir>/advisory-board/`
- Roster manifest updated with advisory board member entries

### Dependencies

- Step 6 (mempalace-init) must have completed — the knowledge base must exist before advisory board members can be registered as knowledge sources

## Step Properties

| Property  | Value |
|-----------|-------|
| Required  | Yes   |
| Skippable | No    |
| Retryable | Yes   |
| Blocking  | Yes   |
