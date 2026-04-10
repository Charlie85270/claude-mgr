// build/kb/kb-interface.ts — KB abstraction boundary
// Every backend (mempalace, mock, future alternatives) implements KnowledgeBase.
// Callers import only from this file; never directly from a backend.

export interface KBRoom {
  id: string;
  wing: string;
  hall: string;
  subhall?: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  tags: string[];
}

export interface KBQuery {
  wing?: string;
  hall?: string;
  subhall?: string;
  tags?: string[];
  semantic_query?: string;
  limit?: number;
}

export interface KBCaptureInput {
  wing: string;
  hall: string;
  subhall?: string;
  content: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface KBConfig {
  mode: "solo" | "team";
  backend: "mempalace" | "mock" | string;
  localPath?: string;
  teamBackendUrl?: string;
  gitMirrorPath?: string;
}

export interface KBHealth {
  ok: boolean;
  backend: string;
  version: string;
}

export class KBNotInitializedError extends Error {
  constructor() {
    super("Knowledge base has not been initialized. Call init() first.");
    this.name = "KBNotInitializedError";
  }
}

export class KBRoomNotFoundError extends Error {
  constructor(id: string) {
    super(`KB room not found: ${id}`);
    this.name = "KBRoomNotFoundError";
  }
}

export class KBBackendError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "KBBackendError";
  }
}

export interface KnowledgeBase {
  init(config: KBConfig): Promise<void>;
  capture(input: KBCaptureInput): Promise<KBRoom>;
  query(query: KBQuery): Promise<KBRoom[]>;
  getById(id: string): Promise<KBRoom | null>;
  delete(id: string, reason: string): Promise<void>;
  export(path: string): Promise<void>;
  import(path: string): Promise<void>;
  health(): Promise<KBHealth>;
}
