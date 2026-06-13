import { ipcMain, shell } from 'electron';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function expandHome(p: string): string {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

// Typed, narrow-scope shell channels that replace the removed `shell:exec`
// RCE channel. Every call uses execFile (no shell interpretation) or a
// direct filesystem/Electron API — renderer-supplied strings never reach
// a subshell.

type GitOp = 'branch' | 'status' | 'diff' | 'log';
const GIT_ARGS: Record<GitOp, string[]> = {
  branch: ['rev-parse', '--abbrev-ref', 'HEAD'],
  status: ['status', '--porcelain', '--untracked-files=all'],
  diff: ['diff', '--stat'],
  log: ['log', '--oneline', '--pretty=format:%h|%s|%an|%ar', '-10'],
};

const LIST_EXCLUDES = ['node_modules', '.git', 'dist', '.next', '__pycache__'];
const GREP_DEFAULT_EXTS = ['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'md'];
const READ_FILE_MAX_BYTES = 2 * 1024 * 1024;
const READ_FILE_DEFAULT_LINES = 500;
const READ_FILE_MAX_LINES = 2000;
const GREP_MAX_LINES = 50;
const LIST_MAX_LINES = 300;
const SUBPROCESS_MAX_BUFFER = 2 * 1024 * 1024;
const WRITE_FILE_MAX_BYTES = 1 * 1024 * 1024;
const WRITE_FILE_ALLOWED_EXTS = new Set(['.md', '.json', '.txt', '.yaml', '.yml']);

// URL schemes safe to open externally. `http`/`https` are standard; app-specific
// schemes must be allowed explicitly. `file://` is NOT allowed — that would
// re-introduce the local-file arbitrary-read risk.
const OPEN_EXTERNAL_ALLOWED_SCHEMES = new Set([
  'http:', 'https:', 'mailto:', 'obsidian:', 'vscode:', 'cursor:',
]);

// CLIs permitted for `shell:cliProbe`. Each value is passed to execFile with
// `['--version']`; no shell, no user-supplied args.
const CLI_PROBE_ALLOWED: ReadonlySet<string> = new Set([
  'opencode', 'pi', 'claude', 'codex', 'gemini', 'git', 'node', 'gh', 'gcloud',
]);

type ShellOk = { success: true; output?: string };
type ShellErr = { success: false; error: string };
type ShellResult = ShellOk | ShellErr;

function invalidArg(msg: string): ShellErr {
  return { success: false, error: msg };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

// True if `resolved` is strictly within `root` (or equals root).
function isWithin(resolved: string, root: string): boolean {
  const r = path.resolve(root);
  return resolved === r || resolved.startsWith(r + path.sep);
}

// Reject paths that escape $HOME. Used for readFileAbs + writeTextFile.
function isWithinHome(resolved: string): boolean {
  return isWithin(resolved, os.homedir());
}

export function registerTypedShellHandlers() {
  // Open a path with the system default handler (Finder, Preview, etc.).
  // Uses Electron's shell.openPath — never invokes a subshell.
  ipcMain.handle('shell:openPath', async (_event, params: { path: string }): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.path)) return invalidArg('path required');
    try {
      const err = await shell.openPath(params.path);
      if (err) return { success: false, error: err };
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // Open a path with a specific named application (macOS `open -a`).
  // execFile with args array; shell metachars in either arg are rejected.
  ipcMain.handle('shell:openWithApp', async (_event, params: { app: string; path: string }): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.app) || !isNonEmptyString(params.path)) {
      return invalidArg('app and path required');
    }
    if (/[;&|`$<>(){}\\'"\n\r]/.test(params.app)) return invalidArg('invalid app name');
    return new Promise((resolve) => {
      execFile('open', ['-a', params.app, params.path], { timeout: 10_000 }, (error) => {
        if (error) resolve({ success: false, error: error.message });
        else resolve({ success: true });
      });
    });
  });

  // Read-only git queries. `op` is an enum; arguments are fixed per op.
  ipcMain.handle('shell:gitInfo', async (_event, params: { cwd: string; op: GitOp }): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.cwd)) return invalidArg('cwd required');
    const args = GIT_ARGS[params.op];
    if (!args) return invalidArg(`invalid op: ${params.op}`);
    return new Promise((resolve) => {
      execFile(
        'git',
        args,
        { cwd: params.cwd, maxBuffer: SUBPROCESS_MAX_BUFFER, timeout: 15_000 },
        (error, stdout) => {
          if (error) resolve({ success: false, error: error.message });
          else resolve({ success: true, output: stdout });
        },
      );
    });
  });

  // List files under a project root. `mode=tree` walks up to maxDepth; `mode=search`
  // matches a filename glob. `query` is passed to find as a single argv element,
  // so shell metachars are literal (no injection).
  ipcMain.handle('shell:listFiles', async (
    _event,
    params: { cwd: string; mode: 'tree' | 'search'; query?: string; maxDepth?: number },
  ): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.cwd)) return invalidArg('cwd required');
    const depth = Math.min(Math.max(Number(params.maxDepth) || 3, 1), 10);

    let args: string[];
    if (params.mode === 'tree') {
      args = ['.', '-maxdepth', String(depth), '-type', 'f'];
    } else if (params.mode === 'search') {
      if (!isNonEmptyString(params.query) || params.query.length > 200) {
        return invalidArg('query must be 1-200 chars');
      }
      args = ['.', '-maxdepth', '5', '-type', 'f', '-iname', `*${params.query}*`];
    } else {
      return invalidArg('mode must be tree or search');
    }
    for (const ex of LIST_EXCLUDES) {
      args.push('-not', '-path', `*/${ex}/*`);
    }
    return new Promise((resolve) => {
      execFile(
        'find',
        args,
        { cwd: params.cwd, maxBuffer: SUBPROCESS_MAX_BUFFER, timeout: 15_000 },
        (error, stdout) => {
          if (error && error.code !== 1) {
            resolve({ success: false, error: error.message });
            return;
          }
          const lines = stdout.split('\n').filter(Boolean).slice(0, LIST_MAX_LINES);
          resolve({ success: true, output: lines.join('\n') });
        },
      );
    });
  });

  // Read a file within a project root. Rejects paths that escape the root via
  // path.resolve + prefix check. No shell, no `cat`.
  ipcMain.handle('shell:readFile', async (
    _event,
    params: { projectRoot: string; relativePath: string; maxLines?: number },
  ): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.projectRoot) || !isNonEmptyString(params.relativePath)) {
      return invalidArg('projectRoot and relativePath required');
    }
    try {
      const resolvedRoot = path.resolve(params.projectRoot);
      const resolvedTarget = path.resolve(resolvedRoot, params.relativePath);
      if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(resolvedRoot + path.sep)) {
        return invalidArg('path escapes project root');
      }
      if (!fs.existsSync(resolvedTarget) || !fs.statSync(resolvedTarget).isFile()) {
        return { success: false, error: 'file not found' };
      }
      if (fs.statSync(resolvedTarget).size > READ_FILE_MAX_BYTES) {
        return { success: false, error: 'file too large (>2MB)' };
      }
      const content = fs.readFileSync(resolvedTarget, 'utf-8');
      const lineLimit = Math.min(Math.max(Number(params.maxLines) || READ_FILE_DEFAULT_LINES, 1), READ_FILE_MAX_LINES);
      const output = content.split('\n').slice(0, lineLimit).join('\n');
      return { success: true, output };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // Open a URL with the system default handler. Scheme is allowlisted.
  ipcMain.handle('shell:openExternal', async (_event, params: { url: string }): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.url)) return invalidArg('url required');
    try {
      const u = new URL(params.url);
      if (!OPEN_EXTERNAL_ALLOWED_SCHEMES.has(u.protocol)) {
        return invalidArg(`scheme ${u.protocol} not allowed`);
      }
      await shell.openExternal(u.toString());
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // Run an allowlisted CLI with `--version` for a capability probe. No
  // user args; binary is from a fixed allowlist; execFile (no shell).
  ipcMain.handle('shell:cliProbe', async (_event, params: { binary: string; binaryPath?: string }): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.binary)) return invalidArg('binary required');
    if (!CLI_PROBE_ALLOWED.has(params.binary)) return invalidArg(`binary ${params.binary} not allowed`);
    // If caller supplies binaryPath (from detected cliPaths), validate it's
    // an absolute path to a file; otherwise let execFile resolve via PATH.
    let invoke = params.binary;
    if (isNonEmptyString(params.binaryPath)) {
      const abs = path.resolve(expandHome(params.binaryPath));
      if (path.isAbsolute(abs) && fs.existsSync(abs)) invoke = abs;
    }
    return new Promise((resolve) => {
      execFile(
        invoke,
        ['--version'],
        { maxBuffer: SUBPROCESS_MAX_BUFFER, timeout: 10_000 },
        (error, stdout, stderr) => {
          if (error) resolve({ success: false, error: error.message });
          else resolve({ success: true, output: (stdout || stderr || '').trim() });
        },
      );
    });
  });

  // Read a file by absolute path, bounded to $HOME. No project root required.
  // For reading instruction files, ~/.claude/mcp.json, etc.
  ipcMain.handle('shell:readFileAbs', async (
    _event,
    params: { absolutePath: string; maxLines?: number },
  ): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.absolutePath)) return invalidArg('absolutePath required');
    try {
      const resolved = path.resolve(expandHome(params.absolutePath));
      if (!isWithinHome(resolved)) return invalidArg('path must be within $HOME');
      if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        return { success: false, error: 'file not found' };
      }
      if (fs.statSync(resolved).size > READ_FILE_MAX_BYTES) {
        return { success: false, error: 'file too large (>2MB)' };
      }
      const content = fs.readFileSync(resolved, 'utf-8');
      const lineLimit = Math.min(Math.max(Number(params.maxLines) || READ_FILE_DEFAULT_LINES, 1), READ_FILE_MAX_LINES);
      const output = content.split('\n').slice(0, lineLimit).join('\n');
      return { success: true, output };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // Batch read with fallback semantics: reads each path in order, returns the
  // content of the first one that exists + is readable + is within $HOME.
  // For the "cat A || cat B || cat C" pattern.
  ipcMain.handle('shell:readAny', async (
    _event,
    params: { paths: string[]; maxLines?: number },
  ): Promise<ShellResult & { path?: string }> => {
    if (!params || !Array.isArray(params.paths)) return { success: false, error: 'paths array required' };
    const lineLimit = Math.min(Math.max(Number(params.maxLines) || READ_FILE_DEFAULT_LINES, 1), READ_FILE_MAX_LINES);
    for (const raw of params.paths.slice(0, 20)) {
      if (typeof raw !== 'string' || !raw) continue;
      try {
        const resolved = path.resolve(expandHome(raw));
        if (!isWithinHome(resolved)) continue;
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) continue;
        if (fs.statSync(resolved).size > READ_FILE_MAX_BYTES) continue;
        const content = fs.readFileSync(resolved, 'utf-8');
        const output = content.split('\n').slice(0, lineLimit).join('\n');
        return { success: true, output, path: resolved };
      } catch {
        // try next
      }
    }
    return { success: true, output: '' };
  });

  // Write a text file bounded to $HOME with extension allowlist. No shell.
  // Rejects > 1MB content. Used for CLAUDE.md / JSON config saves.
  ipcMain.handle('shell:writeTextFile', async (
    _event,
    params: { absolutePath: string; content: string },
  ): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.absolutePath)) return invalidArg('absolutePath required');
    if (typeof params.content !== 'string') return invalidArg('content must be a string');
    if (Buffer.byteLength(params.content, 'utf-8') > WRITE_FILE_MAX_BYTES) {
      return invalidArg('content too large (>1MB)');
    }
    try {
      const resolved = path.resolve(expandHome(params.absolutePath));
      if (!isWithinHome(resolved)) return invalidArg('path must be within $HOME');
      const ext = path.extname(resolved).toLowerCase();
      if (!WRITE_FILE_ALLOWED_EXTS.has(ext)) {
        return invalidArg(`extension ${ext || '(none)'} not allowed`);
      }
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, params.content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });

  // Batch existence check for a list of paths. No shell. Caps at 200 paths
  // per call; caller supplies fully-qualified absolute paths.
  ipcMain.handle('shell:checkFiles', async (_event, params: { paths: string[] }): Promise<{ success: true; existing: string[] } | { success: false; error: string }> => {
    if (!params || !Array.isArray(params.paths)) return { success: false, error: 'paths array required' };
    const input = params.paths
      .slice(0, 200)
      .filter((p) => typeof p === 'string' && p.length > 0)
      .map(expandHome);
    const existing: string[] = [];
    for (const p of input) {
      try {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) existing.push(p);
      } catch {
        // ignore per-path errors (permissions etc.)
      }
    }
    return { success: true, existing };
  });

  // Grep for a query (fixed-string via -F). Query is a single argv element.
  // Only alphanumeric extension filters are accepted.
  ipcMain.handle('shell:grepCode', async (
    _event,
    params: { cwd: string; query: string; extensions?: string[] },
  ): Promise<ShellResult> => {
    if (!params || !isNonEmptyString(params.cwd)) return invalidArg('cwd required');
    if (!isNonEmptyString(params.query) || params.query.length > 200) return invalidArg('query must be 1-200 chars');
    const rawExts = Array.isArray(params.extensions) && params.extensions.length > 0
      ? params.extensions
      : GREP_DEFAULT_EXTS;
    const exts = rawExts.filter((e) => typeof e === 'string' && /^[a-zA-Z0-9]+$/.test(e)).slice(0, 10);
    if (exts.length === 0) return invalidArg('no valid extensions');
    const args: string[] = ['-rn', '--color=never'];
    for (const ext of exts) args.push(`--include=*.${ext}`);
    args.push('-F', params.query, '.');
    return new Promise((resolve) => {
      execFile(
        'grep',
        args,
        { cwd: params.cwd, maxBuffer: SUBPROCESS_MAX_BUFFER, timeout: 15_000 },
        (error, stdout) => {
          // grep returns 1 when no matches — not an error for our purposes
          if (error && error.code !== 1) {
            resolve({ success: false, error: error.message });
            return;
          }
          const lines = stdout.split('\n').filter(Boolean).slice(0, GREP_MAX_LINES);
          resolve({ success: true, output: lines.join('\n') });
        },
      );
    });
  });
}
