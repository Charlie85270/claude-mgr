import * as fs from 'fs';
import * as os from 'os';

/**
 * Resolve the login shell to spawn.
 *
 * SHELL is normally inherited from the desktop session, but an app started from
 * a .desktop launcher, an AppImage or a systemd user unit often has no SHELL at
 * all. Falling back to /bin/zsh there fails with ENOENT on most Linux distros,
 * which ship bash and not zsh.
 */
export function resolveShell(): string {
  const fromEnv = process.env.SHELL;
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const fallbacks = os.platform() === 'darwin'
    ? ['/bin/zsh', '/bin/bash', '/bin/sh']
    : ['/bin/bash', '/bin/zsh', '/bin/sh'];

  return fallbacks.find(candidate => fs.existsSync(candidate)) || '/bin/sh';
}
