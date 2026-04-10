# Placement D — High-Risk Adversarial

## Purpose

Supplements Wil Wheaton's adversarial review on security-sensitive code. When Wil rates a PR at 3 stars or below, the stakes are high enough to warrant a second opinion from the full council. The Counselor determines whether the risk is real, whether it can be mitigated, or whether Wil's assessment was too aggressive.

## Trigger

Wil Wheaton's adversarial review rates a PR <= 3 stars on security-sensitive code. The low score signals potential risk that a single adversarial reviewer may have correctly identified — or may have over-weighted.

## Consensus

- **Algorithm**: `majority`
- **Threshold**: 3 of 4 models
- **Models required**: 3

## Prompt Template

The convener assembles the following context for each model:

- **PR diff**: the full code changes under review.
- **Wil's adversarial report**: Wil Wheaton's complete adversarial review, including his star rating, identified risks, and recommendations.
- **Security context**: relevant security policies, threat model, and the sensitivity classification of the affected code paths.

Each model is asked to choose a disposition and provide a written rationale.

## Output

- **confirm-risk**: the risk is real. The merge is blocked until the identified issues are resolved. Wil's assessment is upheld.
- **mitigate**: the risk exists but can be addressed. The PR is approved contingent on specific required fixes listed in the verdict. Merge is allowed after fixes are applied.
- **dismiss**: Wil was too aggressive. The identified concerns do not warrant blocking or modification. The PR proceeds to merge with the council's rationale recorded for future reference.
