import { ipcMain, BrowserWindow } from 'electron';
import {
  invokeCounselor,
  listPlacements,
  resolveModelKeys,
  type CounselorPlacement,
  type CounselorVerdict,
} from '../services/counselor-service';

// In-memory verdict history (most recent first, capped at 100)
const verdictHistory: CounselorVerdict[] = [];
const MAX_HISTORY = 100;

export interface CounselorHandlerDependencies {
  getMainWindow: () => BrowserWindow | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAppSettings: () => any;
}

export function registerCounselorHandlers(deps: CounselorHandlerDependencies): void {
  const { getAppSettings } = deps;

  // Invoke the Counselor for a given placement + context
  ipcMain.handle(
    'counselor:invoke',
    async (_event, placement: string, context: string) => {
      try {
        const keys = resolveModelKeys(getAppSettings());
        const verdict = await invokeCounselor(
          placement as CounselorPlacement,
          context,
          keys,
        );

        // Store in history
        verdictHistory.unshift(verdict);
        if (verdictHistory.length > MAX_HISTORY) {
          verdictHistory.length = MAX_HISTORY;
        }

        return { success: true, verdict };
      } catch (err) {
        console.error('Counselor invocation failed:', err);
        return { success: false, error: String(err) };
      }
    },
  );

  // List available placements
  ipcMain.handle('counselor:placements', async () => {
    try {
      return { success: true, placements: listPlacements() };
    } catch (err) {
      console.error('Failed to list placements:', err);
      return { success: false, error: String(err) };
    }
  });

  // Get recent verdict history
  ipcMain.handle('counselor:history', async () => {
    try {
      return { success: true, history: verdictHistory };
    } catch (err) {
      console.error('Failed to get counselor history:', err);
      return { success: false, error: String(err) };
    }
  });
}
