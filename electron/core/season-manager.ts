import * as fs from 'fs';
import * as path from 'path';
import { DATA_DIR } from '../constants';
import { broadcastToAllWindows } from '../utils/broadcast';
import { loadRosterManifest, saveRosterManifest } from './roster-manager';
import { loadSoulPackage, extractCapabilities } from './character-loader';
import type { Season, SeasonStatus, Character, RosterManifest } from '../types/echelon';
import type { RosterManifestData, RosterCharacterEntry } from './roster-manager';

const SEASONS_DIR = path.join(DATA_DIR, 'seasons');

export const seasons: Map<string, Season> = new Map();

export function getSeasonsDir(): string {
  return SEASONS_DIR;
}

export function loadSeasons(): void {
  seasons.clear();
  if (!fs.existsSync(SEASONS_DIR)) return;

  const entries = fs.readdirSync(SEASONS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const seasonJsonPath = path.join(SEASONS_DIR, entry.name, 'season.json');
    if (!fs.existsSync(seasonJsonPath)) continue;

    try {
      const data = JSON.parse(fs.readFileSync(seasonJsonPath, 'utf-8'));
      seasons.set(data.id, data as Season);
    } catch (err) {
      console.error(`Failed to load season ${entry.name}:`, err);
    }
  }

  console.log(`Loaded ${seasons.size} season(s)`);
}

export function saveSeason(id: string): void {
  const season = seasons.get(id);
  if (!season) return;

  const seasonDir = path.join(SEASONS_DIR, id);
  if (!fs.existsSync(seasonDir)) {
    fs.mkdirSync(seasonDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(seasonDir, 'season.json'),
    JSON.stringify(season, null, 2),
    'utf-8'
  );
}

export function spawnSeason(config: {
  id: string;
  name: string;
  theme: string;
  rosterEntries: RosterCharacterEntry[];
}): Season {
  const seasonDir = path.join(SEASONS_DIR, config.id);
  const workspacePath = path.join(seasonDir, 'workspace');
  const rosterManifestPath = path.join(seasonDir, 'roster.manifest.yaml');
  const charactersDir = path.join(seasonDir, 'characters');

  fs.mkdirSync(workspacePath, { recursive: true });
  fs.mkdirSync(charactersDir, { recursive: true });

  const season: Season = {
    id: config.id,
    name: config.name,
    theme: config.theme,
    status: 'spawning',
    rosterManifestPath,
    workspacePath,
    characterIds: [],
    createdAt: new Date().toISOString(),
  };

  // Write roster manifest
  const manifestData: RosterManifestData = {
    season_id: config.id,
    season_slug: config.id,
    theme: config.theme,
    tier: 'medium',
    roster: config.rosterEntries,
  };
  saveRosterManifest(rosterManifestPath, manifestData);

  seasons.set(config.id, season);
  saveSeason(config.id);
  broadcastToAllWindows('season:updated', season);

  return season;
}

export function updateSeasonStatus(id: string, status: SeasonStatus): void {
  const season = seasons.get(id);
  if (!season) return;

  season.status = status;
  if (status === 'archived') {
    season.archivedAt = new Date().toISOString();
  }

  saveSeason(id);
  broadcastToAllWindows('season:updated', season);
}

export function archiveSeason(id: string): void {
  updateSeasonStatus(id, 'archived');
}

export function restoreSeason(id: string): void {
  updateSeasonStatus(id, 'restoring');
  // Reload season data
  const season = seasons.get(id);
  if (season) {
    season.status = 'active';
    season.archivedAt = undefined;
    saveSeason(id);
    broadcastToAllWindows('season:updated', season);
  }
}

export function addCharacterToSeason(seasonId: string, characterId: string): void {
  const season = seasons.get(seasonId);
  if (!season) return;

  if (!season.characterIds.includes(characterId)) {
    season.characterIds.push(characterId);
    saveSeason(seasonId);
    broadcastToAllWindows('season:updated', season);
  }
}

export function removeCharacterFromSeason(seasonId: string, characterId: string): void {
  const season = seasons.get(seasonId);
  if (!season) return;

  season.characterIds = season.characterIds.filter(id => id !== characterId);
  saveSeason(seasonId);
  broadcastToAllWindows('season:updated', season);
}

export function getSeason(id: string): Season | undefined {
  return seasons.get(id);
}

export function getAllSeasons(): Season[] {
  return Array.from(seasons.values());
}
