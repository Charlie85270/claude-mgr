# Advisory Board Consultation Protocol

## Query Format

When a core-team character needs SME input:

1. **State the question clearly** — one specific question per consultation
2. **Provide context** — what you've already tried, what you know, why you need SME input
3. **Tag the domain** — model-providers, enterprise-platforms, agent-orchestration, backend-api, vector-databases, event-orchestration, data-analytics, auth-identity, infrastructure, product-integration, research-engine
4. **Urgency level** — blocking (need answer to proceed), advisory (would help but not blocking), background (for future reference)

## SME Response Format

1. **Direct answer** — address the specific question
2. **Confidence level** — high/medium/low with reasoning
3. **Alternatives considered** — what other approaches exist
4. **Risks and tradeoffs** — what could go wrong
5. **References** — links to docs, prior art, relevant ADRs

## Logging

All consultations are logged to mempalace with:
- Query text, domain tags, urgency
- SME who responded, response text, confidence
- Outcome (was the advice followed? what happened?)

## Escalation to Hawking

Route to Stephen Hawking when:
- Multiple SMEs disagree
- The question has cross-domain implications
- The decision could fundamentally alter the project architecture
- Standard consultation didn't resolve the question
