// build/multi-season/isolation-enforcer.ts — Cross-season access prevention

const SHARED_PATHS = ["advisory-board", "config.json", ".oobe-state", "knowledge-base"];

export function enforceSeasonIsolation(
  operationSeasonId: string,
  targetPath: string,
): { allowed: boolean; reason?: string } {
  // Normalize path separators
  const normalized = targetPath.replace(/\\/g, "/");

  // Allow access to shared layers
  for (const shared of SHARED_PATHS) {
    if (normalized.includes(`/${shared}/`) || normalized.includes(`/${shared}`)) {
      return { allowed: true };
    }
  }

  // Check if target is within the operation's season directory
  if (normalized.includes(`/seasons/${operationSeasonId}/`)) {
    return { allowed: true };
  }

  // Check if target is in a different season's directory
  const seasonMatch = normalized.match(/\/seasons\/(season-\d+-[^/]+)\//);
  if (seasonMatch && seasonMatch[1] !== operationSeasonId) {
    return {
      allowed: false,
      reason: `cross-season access denied: ${operationSeasonId} cannot access ${seasonMatch[1]}`,
    };
  }

  // Non-season paths are allowed (e.g., src/, build/)
  return { allowed: true };
}
