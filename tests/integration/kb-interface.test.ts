import { expect, test, describe } from "bun:test";
import type { KnowledgeBase, KBConfig, KBRoom } from "../../build/kb/kb-interface.ts";
import {
  KBNotInitializedError,
  KBRoomNotFoundError,
  KBBackendError,
} from "../../build/kb/kb-interface.ts";
import { MempalaceBackend } from "../../build/kb/mempalace-backend.ts";

const testConfig: KBConfig = {
  mode: "solo",
  backend: "mempalace",
  localPath: `/tmp/factor-echelon-test-iface-${Date.now()}`,
};

describe("KB interface contract", () => {
  test("MempalaceBackend implements KnowledgeBase interface", () => {
    const backend: KnowledgeBase = new MempalaceBackend();
    expect(backend.init).toBeFunction();
    expect(backend.capture).toBeFunction();
    expect(backend.query).toBeFunction();
    expect(backend.getById).toBeFunction();
    expect(backend.delete).toBeFunction();
    expect(backend.export).toBeFunction();
    expect(backend.import).toBeFunction();
    expect(backend.health).toBeFunction();
  });

  test("throws KBNotInitializedError before init", async () => {
    const backend = new MempalaceBackend();
    await expect(
      backend.capture({ wing: "test", hall: "learnings", content: "test" })
    ).rejects.toThrow(KBNotInitializedError);
  });

  test("init succeeds with solo config", async () => {
    const backend = new MempalaceBackend();
    await backend.init(testConfig);
    const h = await backend.health();
    expect(h.ok).toBe(true);
    expect(h.backend).toBe("mempalace");
  });

  test("typed errors have correct names", () => {
    const notInit = new KBNotInitializedError();
    expect(notInit.name).toBe("KBNotInitializedError");

    const notFound = new KBRoomNotFoundError("abc-123");
    expect(notFound.name).toBe("KBRoomNotFoundError");
    expect(notFound.message).toContain("abc-123");

    const backendErr = new KBBackendError("oops");
    expect(backendErr.name).toBe("KBBackendError");
  });
});
