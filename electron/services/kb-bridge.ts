/**
 * kb-bridge.ts — Knowledge Base bridge backed by mempalace.
 *
 * Implements the KB interface contract (Plan 06) on top of mempalace-client.
 * Single backend, no selection logic. Degrades gracefully when mempalace
 * is not installed (returns empty results, logs writes as no-ops).
 */

import * as mempalace from './mempalace-client';
import type { MempalaceEntry, MempalaceQueryResult, MempalaceStatus } from './mempalace-client';

// Re-export types for consumers
export type { MempalaceEntry, MempalaceQueryResult, MempalaceStatus };

// ─── Query ───────────────────────────────────────────────────────────────────

/**
 * Query the knowledge base by tags and/or semantic text.
 */
export async function query(
  tags: string[],
  semantic?: string
): Promise<MempalaceQueryResult> {
  return mempalace.query(tags, semantic);
}

// ─── Write ───────────────────────────────────────────────────────────────────

/**
 * Write an entry to the knowledge base.
 */
export async function write(entry: {
  content: string;
  tags: string[];
  type: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  return mempalace.write(entry);
}

// ─── Promote ─────────────────────────────────────────────────────────────────

/**
 * Promote a skill by writing a promotion event to the KB.
 * This records that a skill has been approved for use.
 */
export async function promote(
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  return mempalace.write({
    content: `Skill promoted: ${skillId}`,
    tags: ['skill-promotion', 'skills', skillId],
    type: 'skill-promotion',
    metadata: {
      skillId,
      promotedAt: new Date().toISOString(),
      action: 'promote',
    },
  });
}

// ─── Audit ───────────────────────────────────────────────────────────────────

/**
 * Write an audit log entry to the KB.
 * Used for tracking actions, decisions, and events.
 */
export async function audit(event: {
  action: string;
  detail?: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  const tags = ['audit', event.action];
  if (event.agentId) tags.push(`agent:${event.agentId}`);

  return mempalace.write({
    content: event.detail || `Audit event: ${event.action}`,
    tags,
    type: 'audit',
    metadata: {
      ...event.metadata,
      action: event.action,
      agentId: event.agentId,
      timestamp: new Date().toISOString(),
    },
  });
}

// ─── Status ──────────────────────────────────────────────────────────────────

/**
 * Get the KB backend connection status.
 */
export async function status(): Promise<MempalaceStatus> {
  return mempalace.getStatus();
}
