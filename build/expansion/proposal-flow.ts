// build/expansion/proposal-flow.ts — User-visible expansion proposal (§7.5)

export interface ExpansionProposal {
  archetype: string;
  rationale: string;
  split_trigger: string;
  suggested_character: string | null;
  estimated_impact: string;
}

export type ProposalDecision = {
  decision: "approve" | "reject" | "alternative";
  reason?: string;
  alternative_archetype?: string;
};

export type ChannelPost = (message: string, options: string[]) => Promise<string>;

export async function presentProposal(
  proposal: ExpansionProposal,
  getDecision: (proposal: ExpansionProposal) => Promise<ProposalDecision>,
): Promise<ProposalDecision> {
  return getDecision(proposal);
}

// Default auto-approve for testing
export async function autoApprove(_proposal: ExpansionProposal): Promise<ProposalDecision> {
  return { decision: "approve" };
}

export function formatProposalMessage(proposal: ExpansionProposal): string {
  const lines = [
    `**Expansion Proposal: ${proposal.archetype}**`,
    ``,
    `**Rationale:** ${proposal.rationale}`,
    `**Trigger:** ${proposal.split_trigger}`,
    `**Estimated Impact:** ${proposal.estimated_impact}`,
  ];
  if (proposal.suggested_character) {
    lines.push(`**Suggested Character:** ${proposal.suggested_character}`);
  }
  lines.push(``, `Approve / Reject / Suggest Alternative?`);
  return lines.join("\n");
}
