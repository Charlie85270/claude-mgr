// build/cli/audit-log.ts — Every intervention is logged to mempalace
import { randomUUID } from "node:crypto";

export interface AuditEntry {
  id: string;
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  reason?: string;
  result: "success" | "failure" | "cancelled";
  output: string;
  timestamp: Date;
  season_id?: string;
}

// In-memory store for v0.1; real impl writes to mempalace via kb-bridge
const auditLog: AuditEntry[] = [];

export function logAudit(entry: Omit<AuditEntry, "id" | "timestamp">): string {
  const id = randomUUID();
  auditLog.push({ ...entry, id, timestamp: new Date() });
  return id;
}

export function getAuditLog(filter?: { command?: string; season_id?: string }): AuditEntry[] {
  let entries = [...auditLog];
  if (filter?.command) entries = entries.filter((e) => e.command === filter.command);
  if (filter?.season_id) entries = entries.filter((e) => e.season_id === filter.season_id);
  return entries;
}

export function clearAuditLog(): void {
  auditLog.length = 0;
}
