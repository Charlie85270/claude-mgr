// build/advisory-board/sme-router.ts — Route queries to the right advisory board SME

const SME_DOMAINS: Record<string, string[]> = {
  "steve-jobs": ["product", "design", "ux", "consumer", "launch", "marketing"],
  "bill-gates": ["enterprise", "platform", "windows", "productivity", "philanthropy"],
  "elon-musk": ["infrastructure", "scale", "hardware", "manufacturing", "mars"],
  "linus-torvalds": ["kernel", "linux", "git", "open-source", "c-language", "systems-programming"],
  "jeff-bezos": ["cloud", "aws", "ecommerce", "logistics", "customer"],
  "mark-zuckerberg": ["social", "meta", "vr", "ar", "react", "mobile"],
  "satya-nadella": ["azure", "enterprise-ai", "dotnet", "teams", "microsoft"],
  "jensen-huang": ["gpu", "cuda", "ml", "ai-hardware", "nvidia", "deep-learning"],
  "tim-cook": ["supply-chain", "operations", "ios", "apple", "privacy"],
  "larry-page": ["search", "ads", "gcp", "android", "moonshot"],
  "sergey-brin": ["research", "algorithms", "data", "innovation"],
  "steve-wozniak": ["hardware", "engineering", "electronics", "apple-ii", "hacking"],
};

export function routeQuery(query: string, queryTags: string[]): string[] {
  const queryLower = query.toLowerCase();
  const scored: { sme: string; score: number }[] = [];

  for (const [sme, domains] of Object.entries(SME_DOMAINS)) {
    let score = 0;

    // Score based on domain keyword matches in query text
    for (const domain of domains) {
      if (queryLower.includes(domain)) score += 2;
    }

    // Score based on tag matches
    for (const tag of queryTags) {
      if (domains.includes(tag.toLowerCase())) score += 3;
    }

    if (score > 0) {
      scored.push({ sme, score });
    }
  }

  // Sort by score descending, return top matches
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.sme);
}

export function getAllSMEs(): string[] {
  return Object.keys(SME_DOMAINS);
}

export function getSMEDomains(sme: string): string[] {
  return SME_DOMAINS[sme] ?? [];
}
