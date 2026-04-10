import { randomUUID } from "node:crypto";

interface MempalaceRoom {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export class MempalaceClient {
  private mockStore: Map<string, MempalaceRoom> | null = null;
  private initialized = false;

  constructor(private readonly localPath: string) {}

  private isMockMode(): boolean {
    return this.mockStore !== null;
  }

  async init(): Promise<void> {
    // Try real mempalace first; fall back to mock mode
    try {
      const proc = Bun.spawnSync(["mempalace", "--version"]);
      if (proc.exitCode !== 0) throw new Error("not available");
      Bun.spawnSync(["mempalace", "init", this.localPath]);
    } catch {
      this.mockStore = new Map();
    }
    this.initialized = true;
  }

  async ingest(content: string, metadata: Record<string, unknown>): Promise<string> {
    if (!this.initialized) throw new Error("Client not initialized");
    const id = randomUUID();
    if (this.isMockMode()) {
      this.mockStore!.set(id, { id, content, metadata, created_at: new Date().toISOString() });
      return id;
    }
    // Real mode: write to temp file then call mempalace mine
    const tmpFile = `${this.localPath}/.tmp-${id}.md`;
    await Bun.write(tmpFile, content);
    const proc = Bun.spawnSync(["mempalace", "mine", "--mode", "general", "--source", tmpFile, "--json"], {
      cwd: this.localPath,
    });
    const { unlink } = await import("node:fs/promises");
    await unlink(tmpFile).catch(() => {});
    if (proc.exitCode !== 0) throw new Error(`mempalace mine failed: ${proc.stderr.toString()}`);
    return id;
  }

  async search(query: string, _filters?: Record<string, unknown>): Promise<MempalaceRoom[]> {
    if (!this.initialized) throw new Error("Client not initialized");
    if (this.isMockMode()) {
      const terms = query.toLowerCase().split(/\s+/);
      return Array.from(this.mockStore!.values()).filter((room) =>
        terms.some((t) => room.content.toLowerCase().includes(t))
      );
    }
    const proc = Bun.spawnSync(["mempalace", "search", query, "--json"], {
      cwd: this.localPath,
      env: { ...process.env },
    });
    if (proc.exitCode !== 0) return [];
    return JSON.parse(proc.stdout.toString());
  }

  async getRoom(id: string): Promise<MempalaceRoom | null> {
    if (!this.initialized) throw new Error("Client not initialized");
    if (this.isMockMode()) {
      return this.mockStore!.get(id) ?? null;
    }
    const proc = Bun.spawnSync(["mempalace", "get", id, "--json"], { cwd: this.localPath });
    if (proc.exitCode !== 0) return null;
    return JSON.parse(proc.stdout.toString());
  }

  async deleteRoom(id: string): Promise<boolean> {
    if (!this.initialized) throw new Error("Client not initialized");
    if (this.isMockMode()) {
      return this.mockStore!.delete(id);
    }
    const proc = Bun.spawnSync(["mempalace", "delete", id], { cwd: this.localPath });
    return proc.exitCode === 0;
  }

  async health(): Promise<{ ok: boolean; version: string }> {
    if (this.isMockMode()) {
      return { ok: true, version: "mock-1.0.0" };
    }
    const proc = Bun.spawnSync(["mempalace", "--version"]);
    return {
      ok: proc.exitCode === 0,
      version: proc.exitCode === 0 ? proc.stdout.toString().trim() : "unavailable",
    };
  }
}
