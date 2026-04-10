import { randomUUID } from "node:crypto";
import type {
  KnowledgeBase,
  KBConfig,
  KBCaptureInput,
  KBQuery,
  KBRoom,
  KBHealth,
} from "./kb-interface.ts";
import { KBNotInitializedError, KBRoomNotFoundError, KBBackendError } from "./kb-interface.ts";
import { MempalaceClient } from "../lib/mempalace-client.ts";
import { GitMirror } from "./git-mirror.ts";

export class MempalaceBackend implements KnowledgeBase {
  private client: MempalaceClient | null = null;
  private mirror: GitMirror | null = null;
  private config: KBConfig | null = null;
  private rooms: Map<string, KBRoom> = new Map();

  async init(config: KBConfig): Promise<void> {
    this.config = config;
    const localPath = config.localPath ?? `/tmp/factor-echelon-kb-${randomUUID()}`;

    this.client = new MempalaceClient(localPath);
    await this.client.init();

    if (config.gitMirrorPath) {
      this.mirror = new GitMirror(config.gitMirrorPath);
      this.mirror.init();
    }
  }

  private ensureInitialized(): void {
    if (!this.client || !this.config) throw new KBNotInitializedError();
  }

  async capture(input: KBCaptureInput): Promise<KBRoom> {
    this.ensureInitialized();
    try {
      const backendId = await this.client!.ingest(input.content, input.metadata ?? {});
      const room: KBRoom = {
        id: backendId,
        wing: input.wing,
        hall: input.hall,
        subhall: input.subhall,
        content: input.content,
        metadata: input.metadata ?? {},
        created_at: new Date(),
        tags: input.tags ?? [],
      };
      this.rooms.set(room.id, room);

      if (this.mirror) {
        const filePath = `${input.wing}/${input.hall}/${room.id}.json`;
        const { mkdirSync, writeFileSync } = await import("node:fs");
        const { join, dirname } = await import("node:path");
        const fullPath = join(this.mirror.getMirrorPath(), filePath);
        mkdirSync(dirname(fullPath), { recursive: true });
        writeFileSync(fullPath, JSON.stringify(room, null, 2));
        this.mirror.commitChange(`capture: ${input.hall} — ${room.id}`, [filePath]);
      }
      return room;
    } catch (e) {
      if (e instanceof KBNotInitializedError) throw e;
      throw new KBBackendError(`Capture failed: ${(e as Error).message}`, e as Error);
    }
  }

  async query(query: KBQuery): Promise<KBRoom[]> {
    this.ensureInitialized();
    let results = Array.from(this.rooms.values());

    if (query.wing) results = results.filter((r) => r.wing === query.wing);
    if (query.hall) results = results.filter((r) => r.hall === query.hall);
    if (query.subhall) results = results.filter((r) => r.subhall === query.subhall);
    if (query.tags?.length) {
      results = results.filter((r) => query.tags!.some((t) => r.tags.includes(t)));
    }
    if (query.semantic_query) {
      const terms = query.semantic_query.toLowerCase().split(/\s+/);
      results = results.filter((r) =>
        terms.some((t) => r.content.toLowerCase().includes(t))
      );
    }
    if (query.limit) results = results.slice(0, query.limit);
    return results;
  }

  async getById(id: string): Promise<KBRoom | null> {
    this.ensureInitialized();
    return this.rooms.get(id) ?? null;
  }

  async delete(id: string, reason: string): Promise<void> {
    this.ensureInitialized();
    const room = this.rooms.get(id);
    if (!room) throw new KBRoomNotFoundError(id);

    await this.client!.deleteRoom(id);
    this.rooms.delete(id);

    if (this.mirror) {
      const filePath = `${room.wing}/${room.hall}/${id}.json`;
      this.mirror.commitChange(`delete(${reason}): ${room.hall} — ${id}`, [filePath]);
    }
  }

  async export(path: string): Promise<void> {
    this.ensureInitialized();
    const data = Array.from(this.rooms.values());
    await Bun.write(path, JSON.stringify(data, null, 2));
  }

  async import(path: string): Promise<void> {
    this.ensureInitialized();
    const file = Bun.file(path);
    const data: KBRoom[] = JSON.parse(await file.text());
    for (const room of data) {
      this.rooms.set(room.id, { ...room, created_at: new Date(room.created_at) });
    }
  }

  async health(): Promise<KBHealth> {
    this.ensureInitialized();
    const h = await this.client!.health();
    return { ok: h.ok, backend: "mempalace", version: h.version };
  }
}
