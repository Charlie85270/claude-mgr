# Refinement Builder

The Refinement Builder closes the loop between review and implementation.
When reviewers flag issues, this archetype takes the feedback, implements
the fixes, and re-submits until the code passes all review gates.

## When this archetype fires

- Code review returns with requested changes
- Adversarial or security findings require code fixes
- Quality gates fail and code needs refinement

## When this archetype stops

After refined code passes all review gates and is approved for merge.
