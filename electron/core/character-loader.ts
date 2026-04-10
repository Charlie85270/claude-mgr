import * as fs from 'fs';
import * as path from 'path';
import type { SoulPackage } from '../types/echelon';

const SOUL_FILES = ['SOUL.md', 'AGENTS.md', 'HEARTBEAT.md', 'MEMORY.seed.md', 'persona.md'];
const OPTIONAL_FILES = ['USER.md', 'COMMITMENTS.md', 'DEPLOY-CHECKLIST.md'];

function readFileOrEmpty(filePath: string): string {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

function parseFrontmatter(content: string): { data: Record<string, unknown>; content: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content };

  const data: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      data[key] = value;
    }
  }
  return { data, content: match[2] };
}

export function loadSoulPackage(characterDir: string): SoulPackage {
  if (!fs.existsSync(characterDir)) {
    throw new Error(`Character directory does not exist: ${characterDir}`);
  }

  const soulRaw = readFileOrEmpty(path.join(characterDir, 'SOUL.md'));
  const { data: frontmatter, content: soul } = parseFrontmatter(soulRaw);

  return {
    soul,
    agents: readFileOrEmpty(path.join(characterDir, 'AGENTS.md')),
    heartbeat: readFileOrEmpty(path.join(characterDir, 'HEARTBEAT.md')),
    memorySeed: readFileOrEmpty(path.join(characterDir, 'MEMORY.seed.md')),
    persona: readFileOrEmpty(path.join(characterDir, 'persona.md')),
    user: readFileOrEmpty(path.join(characterDir, 'USER.md')) || undefined,
    commitments: readFileOrEmpty(path.join(characterDir, 'COMMITMENTS.md')) || undefined,
    deployChecklist: readFileOrEmpty(path.join(characterDir, 'DEPLOY-CHECKLIST.md')) || undefined,
    frontmatter,
  };
}

export function extractCapabilities(soulPackage: SoulPackage): string[] {
  const caps: string[] = [];
  const fm = soulPackage.frontmatter;
  if (fm.capabilities && typeof fm.capabilities === 'string') {
    caps.push(...fm.capabilities.split(',').map(s => s.trim()).filter(Boolean));
  }
  return caps;
}

export function getSoulFiles(characterDir: string): string[] {
  return [...SOUL_FILES, ...OPTIONAL_FILES]
    .map(f => path.join(characterDir, f))
    .filter(f => fs.existsSync(f));
}
