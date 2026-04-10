import { ipcMain, BrowserWindow } from 'electron';
import {
  getConvener,
  isConvener,
  assignConvener,
  getConvenerSeason,
} from '../core/convener-manager';
import { getSeason } from '../core/season-manager';

export interface ConvenerHandlerDependencies {
  getMainWindow: () => BrowserWindow | null;
}

export function registerConvenerHandlers({ getMainWindow }: ConvenerHandlerDependencies): void {
  // Get convener for a season
  ipcMain.handle('convener:get', async (_event, seasonId: string) => {
    try {
      const conId = getConvener(seasonId);
      if (!conId) {
        return { convener: null, error: 'No convener assigned for this season' };
      }
      return {
        convener: {
          agentId: conId,
          seasonId,
          role: 'convener',
        },
      };
    } catch (err) {
      console.error('Failed to get convener:', err);
      return { convener: null, error: String(err) };
    }
  });

  // Convener invokes counselor for a season
  ipcMain.handle(
    'convener:invoke-counselor',
    async (_event, seasonId: string, placement: string, context: string) => {
      try {
        const conId = getConvener(seasonId);
        if (!conId) {
          return { success: false, error: 'No convener for this season' };
        }

        const season = getSeason(seasonId);
        if (!season) {
          return { success: false, error: 'Season not found' };
        }

        // Broadcast counselor invocation event so the renderer can handle it
        const mainWindow = getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send('convener:counselor-invoked', {
            seasonId,
            convenerId: conId,
            placement,
            context,
            timestamp: new Date().toISOString(),
          });
        }

        return { success: true, convenerId: conId, placement, context };
      } catch (err) {
        console.error('Failed to invoke counselor:', err);
        return { success: false, error: String(err) };
      }
    }
  );
}
