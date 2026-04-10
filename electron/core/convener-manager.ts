/**
 * Convener Manager
 *
 * When a season spawns, the convener character is auto-instantiated from the
 * theme's designated character. The convener has role: 'convener' capability
 * and can invoke the counselor.
 *
 * Theme → Convener mapping:
 *   - tbbt       → Stephen Hawking
 *   - star-wars  → Yoda
 *   - custom     → first character in roster
 */

import { getSeason, seasons } from './season-manager';
import { loadRosterManifest } from './roster-manager';
import type { Season } from '../types/echelon';

/** Map of seasonId → convener agentId */
const convenerMap: Map<string, string> = new Map();

/** Default convener character slugs per theme */
const THEME_CONVENERS: Record<string, string> = {
  tbbt: 'stephen-hawking',
  'star-wars': 'yoda',
};

/**
 * Resolve the convener character slug for a given season theme and roster.
 */
function resolveConvenerSlug(season: Season): string | null {
  const themeKey = season.theme.toLowerCase().replace(/\s+/g, '-');

  // Check for a known theme convener
  if (THEME_CONVENERS[themeKey]) {
    return THEME_CONVENERS[themeKey];
  }

  // For custom / unknown themes, use the first character in the roster manifest
  const manifest = loadRosterManifest(season.rosterManifestPath);
  if (manifest && manifest.roster.length > 0) {
    return manifest.roster[0].character;
  }

  // Fallback: first characterId already registered on the season
  if (season.characterIds.length > 0) {
    return season.characterIds[0];
  }

  return null;
}

/**
 * Assign a convener for a season. Called when a season is spawned.
 * Returns the convener agentId (which is the characterId/slug).
 */
export function assignConvener(seasonId: string): string | null {
  const season = getSeason(seasonId);
  if (!season) return null;

  const slug = resolveConvenerSlug(season);
  if (!slug) return null;

  convenerMap.set(seasonId, slug);
  return slug;
}

/**
 * Get the convener agent ID for a season.
 */
export function getConvener(seasonId: string): string | null {
  // Return cached value if available
  if (convenerMap.has(seasonId)) {
    return convenerMap.get(seasonId)!;
  }

  // Try to resolve on-demand (e.g. after app restart)
  const resolved = assignConvener(seasonId);
  return resolved;
}

/**
 * Check whether a given agentId is a convener for any season.
 */
export function isConvener(agentId: string): boolean {
  for (const convId of convenerMap.values()) {
    if (convId === agentId) return true;
  }
  return false;
}

/**
 * Get the seasonId for which the given agentId serves as convener.
 */
export function getConvenerSeason(agentId: string): string | null {
  for (const [seasonId, convId] of convenerMap.entries()) {
    if (convId === agentId) return seasonId;
  }
  return null;
}

/**
 * Remove convener assignment (e.g. when season is archived).
 */
export function removeConvener(seasonId: string): void {
  convenerMap.delete(seasonId);
}
