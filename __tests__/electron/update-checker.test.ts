import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks (available inside vi.mock factories) ─────────────
const { mockAutoUpdater, mockFetch } = vi.hoisted(() => ({
  mockAutoUpdater: {
    autoDownload: true,
    autoInstallOnAppQuit: false,
    currentVersion: { version: '1.2.1' },
    on: vi.fn(),
    checkForUpdates: vi.fn(),
    downloadUpdate: vi.fn(),
    quitAndInstall: vi.fn(),
  },
  mockFetch: vi.fn(),
}));

vi.mock('electron-updater', () => ({
  autoUpdater: mockAutoUpdater,
}));

vi.mock('electron', () => ({
  BrowserWindow: vi.fn(),
  app: {
    getVersion: () => '1.2.1',
  },
}));

vi.mock('../../electron/constants', () => ({
  GITHUB_REPO: 'jediswimmer/echelon',
}));

vi.stubGlobal('fetch', mockFetch);

// ── Import after mocks ─────────────────────────────────────────────
import {
  initAutoUpdater,
  checkForUpdates,
  downloadUpdate,
  quitAndInstall,
  setMainWindowGetter,
} from '../../electron/services/update-checker';

// Helper: capture event handlers registered via autoUpdater.on()
function getEventHandler(eventName: string) {
  const call = mockAutoUpdater.on.mock.calls.find(([name]) => name === eventName);
  return call ? call[1] : undefined;
}

// Helper: make a mock BrowserWindow
function makeMockWindow() {
  return {
    webContents: {
      send: vi.fn(),
    },
  } as unknown as Electron.BrowserWindow;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAutoUpdater.currentVersion = { version: '1.2.1' };
  mockFetch.mockReset();
});

describe('update-checker', () => {
  describe('initAutoUpdater', () => {
    it('registers event handlers on autoUpdater', () => {
      const win = makeMockWindow();
      initAutoUpdater(() => win);

      const events = mockAutoUpdater.on.mock.calls.map((call) => call[0] as string);
      expect(events).toContain('update-available');
      expect(events).toContain('update-not-available');
      expect(events).toContain('download-progress');
      expect(events).toContain('update-downloaded');
      expect(events).toContain('error');
    });

    it('sends app:update-available IPC on update-available event', () => {
      const win = makeMockWindow();
      initAutoUpdater(() => win);

      const handler = getEventHandler('update-available');
      handler({ version: '2.0.0', releaseNotes: 'New features' });

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-available', {
        currentVersion: '1.2.1',
        latestVersion: '2.0.0',
        releaseNotes: 'New features',
        hasUpdate: true,
      });
    });

    it('handles releaseNotes that are not a string', () => {
      const win = makeMockWindow();
      initAutoUpdater(() => win);

      const handler = getEventHandler('update-available');
      handler({ version: '2.0.0', releaseNotes: [{ note: 'something' }] });

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-available', expect.objectContaining({
        releaseNotes: '',
      }));
    });

    it('sends app:update-not-available IPC', () => {
      const win = makeMockWindow();
      initAutoUpdater(() => win);

      const handler = getEventHandler('update-not-available');
      handler({ version: '1.2.1' });

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-not-available', {
        currentVersion: '1.2.1',
        latestVersion: '1.2.1',
      });
    });

    it('sends app:update-progress IPC with progress data', () => {
      const win = makeMockWindow();
      initAutoUpdater(() => win);

      const handler = getEventHandler('download-progress');
      handler({ percent: 42, bytesPerSecond: 1024000, transferred: 5000000, total: 12000000 });

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-progress', {
        percent: 42,
        bytesPerSecond: 1024000,
        transferred: 5000000,
        total: 12000000,
      });
    });

    it('sends app:update-downloaded IPC', () => {
      const win = makeMockWindow();
      initAutoUpdater(() => win);

      const handler = getEventHandler('update-downloaded');
      handler();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-downloaded');
    });

    it('does not crash when mainWindow is null', () => {
      initAutoUpdater(() => null);

      const handler = getEventHandler('update-available');
      // Should not throw
      expect(() => handler({ version: '2.0.0', releaseNotes: '' })).not.toThrow();
    });
  });

  describe('checkForUpdates', () => {
    it('returns devMode: true when autoUpdater returns null (dev mode)', async () => {
      mockAutoUpdater.checkForUpdates.mockResolvedValue(null);

      const result = await checkForUpdates();
      expect(result).toEqual({ devMode: true, currentVersion: '1.2.1' });
    });

    it('returns devMode: false when autoUpdater succeeds', async () => {
      mockAutoUpdater.checkForUpdates.mockResolvedValue({ updateInfo: { version: '2.0.0' } });

      const result = await checkForUpdates();
      expect(result).toEqual({ devMode: false });
    });

    it('falls back to GitHub API when autoUpdater throws', async () => {
      mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('Cannot find latest-mac.yml'));

      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v2.0.0',
          html_url: 'https://github.com/jediswimmer/echelon/releases/tag/v2.0.0',
          body: 'Release notes here',
          assets: [
            { name: 'Dorothy-2.0.0.dmg', browser_download_url: 'https://github.com/.../Dorothy-2.0.0.dmg' },
          ],
        }),
      });

      const result = await checkForUpdates();
      expect(result).toEqual({ devMode: false, fallback: true });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/jediswimmer/echelon/releases/latest',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/vnd.github.v3+json',
          }),
        }),
      );
    });

    it('sends update-available IPC via fallback when newer version exists', async () => {
      mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('No yml'));

      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v2.0.0',
          html_url: 'https://github.com/jediswimmer/echelon/releases/tag/v2.0.0',
          body: 'Big update',
          assets: [
            { name: 'Dorothy-2.0.0.dmg', browser_download_url: 'https://example.com/Dorothy-2.0.0.dmg' },
          ],
        }),
      });

      await checkForUpdates();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-available', expect.objectContaining({
        currentVersion: '1.2.1',
        latestVersion: '2.0.0',
        hasUpdate: true,
        downloadUrl: 'https://example.com/Dorothy-2.0.0.dmg',
        releaseUrl: 'https://github.com/jediswimmer/echelon/releases/tag/v2.0.0',
      }));
    });

    it('sends update-not-available IPC via fallback when on latest', async () => {
      mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('No yml'));

      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.2.1',
          html_url: 'https://github.com/jediswimmer/echelon/releases/tag/v1.2.1',
          body: '',
          assets: [],
        }),
      });

      await checkForUpdates();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-not-available', {
        currentVersion: '1.2.1',
        latestVersion: '1.2.1',
      });
    });

    it('returns error when both autoUpdater and GitHub API fail', async () => {
      mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('No yml'));

      setMainWindowGetter(() => null);
      mockFetch.mockResolvedValue({ ok: false, status: 403 });

      const result = await checkForUpdates();
      expect(result).toEqual({ error: true });
    });

    it('returns error when GitHub API fetch throws', async () => {
      mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('No yml'));

      setMainWindowGetter(() => null);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await checkForUpdates();
      expect(result).toEqual({ error: true });
    });
  });

  describe('GitHub fallback version comparison', () => {
    beforeEach(() => {
      mockAutoUpdater.checkForUpdates.mockRejectedValue(new Error('No yml'));
    });

    it('detects patch update (1.2.1 → 1.2.2)', async () => {
      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.2.2',
          html_url: 'https://github.com/test/releases/tag/v1.2.2',
          body: '',
          assets: [],
        }),
      });

      await checkForUpdates();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-available', expect.objectContaining({
        hasUpdate: true,
        latestVersion: '1.2.2',
      }));
    });

    it('detects minor update (1.2.1 → 1.3.0)', async () => {
      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.3.0',
          html_url: '',
          body: '',
          assets: [],
        }),
      });

      await checkForUpdates();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-available', expect.objectContaining({
        hasUpdate: true,
      }));
    });

    it('does not flag downgrade as update (1.2.1 → 1.1.0)', async () => {
      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.1.0',
          html_url: '',
          body: '',
          assets: [],
        }),
      });

      await checkForUpdates();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-not-available', expect.objectContaining({
        currentVersion: '1.2.1',
        latestVersion: '1.1.0',
      }));
    });

    it('strips v prefix from tag_name', async () => {
      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v3.0.0',
          html_url: '',
          body: '',
          assets: [],
        }),
      });

      await checkForUpdates();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-available', expect.objectContaining({
        latestVersion: '3.0.0',
      }));
    });

    it('prefers DMG asset over ZIP for download URL', async () => {
      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v2.0.0',
          html_url: 'https://github.com/releases/v2.0.0',
          body: '',
          assets: [
            { name: 'Dorothy-2.0.0.zip', browser_download_url: 'https://example.com/Dorothy-2.0.0.zip' },
            { name: 'Dorothy-2.0.0.dmg', browser_download_url: 'https://example.com/Dorothy-2.0.0.dmg' },
          ],
        }),
      });

      await checkForUpdates();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-available', expect.objectContaining({
        downloadUrl: 'https://example.com/Dorothy-2.0.0.dmg',
      }));
    });

    it('falls back to ZIP when no DMG asset', async () => {
      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v2.0.0',
          html_url: 'https://github.com/releases/v2.0.0',
          body: '',
          assets: [
            { name: 'Dorothy-2.0.0.zip', browser_download_url: 'https://example.com/Dorothy-2.0.0.zip' },
          ],
        }),
      });

      await checkForUpdates();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-available', expect.objectContaining({
        downloadUrl: 'https://example.com/Dorothy-2.0.0.zip',
      }));
    });

    it('falls back to html_url when no assets', async () => {
      const win = makeMockWindow();
      setMainWindowGetter(() => win);

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v2.0.0',
          html_url: 'https://github.com/releases/v2.0.0',
          body: '',
          assets: [],
        }),
      });

      await checkForUpdates();

      expect(win.webContents.send).toHaveBeenCalledWith('app:update-available', expect.objectContaining({
        downloadUrl: 'https://github.com/releases/v2.0.0',
      }));
    });
  });

  describe('downloadUpdate', () => {
    it('delegates to autoUpdater.downloadUpdate', () => {
      downloadUpdate();
      expect(mockAutoUpdater.downloadUpdate).toHaveBeenCalled();
    });
  });

  describe('quitAndInstall', () => {
    it('delegates to autoUpdater.quitAndInstall', () => {
      quitAndInstall();
      expect(mockAutoUpdater.quitAndInstall).toHaveBeenCalled();
    });
  });
});
