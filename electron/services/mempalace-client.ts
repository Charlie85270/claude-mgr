/**
 * mempalace-client.ts — Thin wrapper around the mempalace MCP tools.
 *
 * Uses the mempalace MCP server (if installed) for knowledge graph operations.
 * Falls back gracefully to empty results when mempalace is not available.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MempalaceEntry {
  id?: string;
  content: string;
  tags: string[];
  type: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface MempalaceQueryResult {
  entries: MempalaceEntry[];
  total: number;
}

export interface MempalaceStatus {
  connected: boolean;
  entryCount: number;
  version?: string;
  palacePath?: string;
}

// ─── Client ──────────────────────────────────────────────────────────────────

let cachedStatus: MempalaceStatus | null = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30_000; // 30s

/**
 * Locate the mempalace CLI binary.
 * Checks common install locations and PATH.
 */
function findMempalaceBinary(): string | null {
  // Check common locations
  const candidates = [
    path.join(os.homedir(), '.local', 'bin', 'mempalace'),
    '/usr/local/bin/mempalace',
    '/opt/homebrew/bin/mempalace',
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // Check if it's a pip-installed package (try python -m)
  return null;
}

/**
 * Run a mempalace CLI command and return the parsed JSON output.
 */
function runMempalaceCommand(args: string[], timeout = 10_000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const binary = findMempalaceBinary();

    let cmd: string;
    let cmdArgs: string[];

    if (binary) {
      cmd = binary;
      cmdArgs = [...args, '--json'];
    } else {
      // Try as a Python module
      cmd = 'python3';
      cmdArgs = ['-m', 'mempalace', ...args, '--json'];
    }

    const child = spawn(cmd, cmdArgs, {
      timeout,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`mempalace command failed: ${err.message}`));
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`mempalace exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch {
        // If no JSON output, return raw text
        resolve({ raw: stdout.trim() });
      }
    });
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Query mempalace for entries matching tags and/or semantic text.
 */
export async function query(
  tags: string[],
  semantic?: string
): Promise<MempalaceQueryResult> {
  try {
    const args: string[] = ['search'];

    if (semantic) {
      args.push(semantic);
    }

    if (tags.length > 0) {
      args.push('--tags', tags.join(','));
    }

    const result = await runMempalaceCommand(args) as Record<string, unknown>;

    // Normalize the result into our standard shape
    const entries: MempalaceEntry[] = Array.isArray(result)
      ? (result as MempalaceEntry[])
      : Array.isArray((result as Record<string, unknown>).entries)
        ? (result as { entries: MempalaceEntry[] }).entries
        : Array.isArray((result as Record<string, unknown>).results)
          ? (result as { results: MempalaceEntry[] }).results
          : [];

    return {
      entries,
      total: entries.length,
    };
  } catch {
    // Fallback: mempalace not installed or query failed
    return { entries: [], total: 0 };
  }
}

/**
 * Write an entry to mempalace.
 */
export async function write(entry: {
  content: string;
  tags: string[];
  type: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const args: string[] = ['kg', 'add'];
    args.push('--content', entry.content);

    if (entry.tags.length > 0) {
      args.push('--tags', entry.tags.join(','));
    }

    if (entry.type) {
      args.push('--type', entry.type);
    }

    const result = await runMempalaceCommand(args) as Record<string, unknown>;
    return {
      success: true,
      id: (result?.id as string) || undefined,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to write to mempalace',
    };
  }
}

/**
 * Get mempalace connection status and entry count.
 * Caches the result for HEALTH_CHECK_INTERVAL ms.
 */
export async function getStatus(): Promise<MempalaceStatus> {
  const now = Date.now();
  if (cachedStatus && now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return cachedStatus;
  }

  try {
    const result = await runMempalaceCommand(['status'], 5_000) as Record<string, unknown>;
    cachedStatus = {
      connected: true,
      entryCount: (result?.total_entries as number) ?? (result?.entry_count as number) ?? 0,
      version: (result?.version as string) || undefined,
      palacePath: (result?.palace_path as string) || (result?.path as string) || undefined,
    };
  } catch {
    cachedStatus = {
      connected: false,
      entryCount: 0,
    };
  }

  lastHealthCheck = now;
  return cachedStatus;
}

/**
 * Force a fresh health check on next getStatus() call.
 */
export function invalidateStatusCache(): void {
  cachedStatus = null;
  lastHealthCheck = 0;
}
