import { ipcMain, BrowserWindow } from 'electron';
import {
  loadSeasons,
  getAllSeasons,
  getSeason,
  spawnSeason,
  archiveSeason,
  restoreSeason,
} from '../core/season-manager';
import type { Season } from '../types/echelon';

export interface SeasonHandlerDependencies {
  getMainWindow: () => BrowserWindow | null;
}

export function registerSeasonHandlers(deps: SeasonHandlerDependencies): void {
  const { getMainWindow } = deps;

  // List all seasons
  ipcMain.handle('season:list', async () => {
    try {
      const seasons = getAllSeasons();
      return { seasons };
    } catch (err) {
      console.error('Failed to list seasons:', err);
      return { seasons: [], error: String(err) };
    }
  });

  // Get a single season by id
  ipcMain.handle('season:get', async (_event, id: string) => {
    try {
      const season = getSeason(id);
      if (!season) {
        return { error: 'Season not found' };
      }
      return { season };
    } catch (err) {
      console.error('Failed to get season:', err);
      return { error: String(err) };
    }
  });

  // Spawn a new season
  ipcMain.handle('season:spawn', async (_event, config: {
    id: string;
    name: string;
    theme: string;
    rosterEntries: Array<{
      archetype: string;
      character: string;
      capabilities: string[];
    }>;
  }) => {
    try {
      const season = spawnSeason(config);
      return { success: true, season };
    } catch (err) {
      console.error('Failed to spawn season:', err);
      return { success: false, error: String(err) };
    }
  });

  // Archive a season
  ipcMain.handle('season:archive', async (_event, id: string) => {
    try {
      archiveSeason(id);
      const season = getSeason(id);
      return { success: true, season };
    } catch (err) {
      console.error('Failed to archive season:', err);
      return { success: false, error: String(err) };
    }
  });

  // Restore a season
  ipcMain.handle('season:restore', async (_event, id: string) => {
    try {
      restoreSeason(id);
      const season = getSeason(id);
      return { success: true, season };
    } catch (err) {
      console.error('Failed to restore season:', err);
      return { success: false, error: String(err) };
    }
  });

  // List characters for a season
  ipcMain.handle('season:characters', async (_event, seasonId: string) => {
    try {
      const season = getSeason(seasonId);
      if (!season) {
        return { characters: [], error: 'Season not found' };
      }
      return { characters: season.characterIds };
    } catch (err) {
      console.error('Failed to list season characters:', err);
      return { characters: [], error: String(err) };
    }
  });
}
