import type { AgentStatus } from './index';

export type SeasonStatus = 'spawning' | 'active' | 'paused' | 'archived' | 'restoring';

export interface Season {
  id: string;
  name: string;
  theme: string;
  status: SeasonStatus;
  rosterManifestPath: string;
  workspacePath: string;
  characterIds: string[];
  createdAt: string;
  archivedAt?: string;
}

export interface Character extends AgentStatus {
  seasonId: string;
  archetypeId: string;
  soulPackagePath: string;
  canonName: string;
  theme: string;
}

export interface SoulPackage {
  soul: string;
  agents: string;
  heartbeat: string;
  memorySeed: string;
  persona: string;
  user?: string;
  commitments?: string;
  deployChecklist?: string;
  frontmatter: Record<string, unknown>;
}

export interface RosterEntry {
  characterSlug: string;
  archetypeId: string;
  canonName: string;
  theme: string;
  soulPackagePath: string;
  capabilities: string[];
}

export interface RosterManifest {
  seasonId: string;
  theme: string;
  tier: 'small' | 'medium' | 'large' | 'enterprise';
  characters: RosterEntry[];
}
