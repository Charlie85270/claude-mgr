/**
 * kb-handlers.ts — IPC handlers for Knowledge Base operations.
 *
 * Channels:
 *   kb:query          → query the KB by tags/semantic
 *   kb:write          → write an entry
 *   kb:promote-skill  → promote a skill
 *   kb:audit          → write an audit event
 *   kb:status         → get backend connection status
 */

import { ipcMain, BrowserWindow } from 'electron';
import * as kbBridge from '../services/kb-bridge';

export interface KbHandlerDependencies {
  getMainWindow: () => BrowserWindow | null;
}

export function registerKbHandlers({ getMainWindow }: KbHandlerDependencies): void {
  ipcMain.handle('kb:query', async (_event, tags: string[], semantic?: string) => {
    try {
      const result = await kbBridge.query(tags, semantic);
      return { ...result, error: null };
    } catch (err) {
      return { entries: [], total: 0, error: err instanceof Error ? err.message : 'KB query failed' };
    }
  });

  ipcMain.handle('kb:write', async (_event, entry: { content: string; tags: string[]; type: string; metadata?: Record<string, unknown> }) => {
    try {
      return await kbBridge.write(entry);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'KB write failed' };
    }
  });

  ipcMain.handle('kb:promote-skill', async (_event, skillId: string) => {
    try {
      return await kbBridge.promote(skillId);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'KB promote failed' };
    }
  });

  ipcMain.handle('kb:audit', async (_event, event: { action: string; detail?: string; agentId?: string; metadata?: Record<string, unknown> }) => {
    try {
      return await kbBridge.audit(event);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'KB audit failed' };
    }
  });

  ipcMain.handle('kb:status', async () => {
    try {
      return await kbBridge.status();
    } catch (err) {
      return { connected: false, entryCount: 0, error: err instanceof Error ? err.message : 'KB status check failed' };
    }
  });
}
