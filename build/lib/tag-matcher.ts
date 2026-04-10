// build/lib/tag-matcher.ts
// v0.1 STUB: real implementation ships in v0.5

export function scoreThemeSimilarity(themeA: string[], themeB: string[]): number {
  const setA = new Set(themeA);
  const setB = new Set(themeB);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

export function findBestNeighbor(
  currentThemeTags: string[],
  installedThemeTags: Record<string, string[]>,
  exclude: string[],
): string | null {
  let bestScore = 0;
  let bestTheme: string | null = null;
  for (const [name, tags] of Object.entries(installedThemeTags)) {
    if (exclude.includes(name)) continue;
    const score = scoreThemeSimilarity(currentThemeTags, tags);
    if (score > bestScore) {
      bestScore = score;
      bestTheme = name;
    }
  }
  return bestScore > 0.3 ? bestTheme : null;
}
