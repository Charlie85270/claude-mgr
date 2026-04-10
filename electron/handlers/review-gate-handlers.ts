import { ipcMain, BrowserWindow } from 'electron';
import {
  runReviewGates,
  getGateStatus,
  listGateDefinitions,
} from '../core/review-gate-runner';

export interface ReviewGateHandlerDependencies {
  getMainWindow: () => BrowserWindow | null;
}

export function registerReviewGateHandlers(_deps: ReviewGateHandlerDependencies): void {
  // Trigger review gates for a character's work
  ipcMain.handle('review-gate:run', async (_event, characterId: string, workSummary: string) => {
    try {
      const results = await runReviewGates(characterId, workSummary);
      return { success: true, results };
    } catch (err) {
      console.error('Failed to run review gates:', err);
      return { success: false, error: String(err) };
    }
  });

  // Get current gate status for a season/character
  ipcMain.handle('review-gate:status', async (_event, seasonId: string) => {
    try {
      const results = getGateStatus(seasonId);
      return { results };
    } catch (err) {
      console.error('Failed to get review gate status:', err);
      return { results: null, error: String(err) };
    }
  });

  // List all gate definitions
  ipcMain.handle('review-gate:list', async () => {
    try {
      const gates = listGateDefinitions();
      return { gates };
    } catch (err) {
      console.error('Failed to list review gates:', err);
      return { gates: [], error: String(err) };
    }
  });
}
