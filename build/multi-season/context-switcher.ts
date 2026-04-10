// build/multi-season/context-switcher.ts — Active season state
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";

export function setActiveSeason(slug: string, rootDir: string): void {
  const contextFile = join(rootDir, ".context");
  mkdirSync(dirname(contextFile), { recursive: true });
  writeFileSync(contextFile, JSON.stringify({ active_season: slug, set_at: new Date().toISOString() }));
}

export function getActiveSeason(rootDir: string): string | null {
  const contextFile = join(rootDir, ".context");
  if (!existsSync(contextFile)) return null;
  try {
    const data = JSON.parse(readFileSync(contextFile, "utf-8"));
    return data.active_season ?? null;
  } catch {
    return null;
  }
}

export function clearActiveSeason(rootDir: string): void {
  const contextFile = join(rootDir, ".context");
  if (existsSync(contextFile)) {
    writeFileSync(contextFile, JSON.stringify({ active_season: null }));
  }
}
