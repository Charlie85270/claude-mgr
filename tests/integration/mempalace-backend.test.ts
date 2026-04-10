import { expect, test, describe, beforeEach } from "bun:test";
import { MempalaceBackend } from "../../build/kb/mempalace-backend.ts";
import { KBRoomNotFoundError } from "../../build/kb/kb-interface.ts";
import type { KBConfig } from "../../build/kb/kb-interface.ts";

describe("MempalaceBackend", () => {
  let backend: MempalaceBackend;

  beforeEach(async () => {
    backend = new MempalaceBackend();
    await backend.init({
      mode: "solo",
      backend: "mempalace",
      localPath: `/tmp/factor-echelon-test-mp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
  });

  test("capture stores a room and returns it with an id", async () => {
    const room = await backend.capture({
      wing: "season-test-01",
      hall: "learnings",
      content: "Always validate input before database insert",
      tags: ["security", "database"],
    });
    expect(room.id).toBeDefined();
    expect(room.wing).toBe("season-test-01");
    expect(room.hall).toBe("learnings");
    expect(room.content).toContain("validate input");
    expect(room.tags).toContain("security");
    expect(room.created_at).toBeInstanceOf(Date);
  });

  test("getById retrieves a captured room", async () => {
    const room = await backend.capture({
      wing: "private-user-1",
      hall: "patterns",
      content: "Use exponential backoff for retries",
      tags: ["resilience"],
    });
    const fetched = await backend.getById(room.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(room.id);
    expect(fetched!.content).toBe(room.content);
  });

  test("getById returns null for unknown id", async () => {
    const fetched = await backend.getById("nonexistent-id");
    expect(fetched).toBeNull();
  });

  test("query filters by wing", async () => {
    await backend.capture({ wing: "season-a", hall: "learnings", content: "insight A" });
    await backend.capture({ wing: "season-b", hall: "learnings", content: "insight B" });

    const results = await backend.query({ wing: "season-a" });
    expect(results.length).toBe(1);
    expect(results[0].content).toBe("insight A");
  });

  test("query filters by hall", async () => {
    await backend.capture({ wing: "season-a", hall: "learnings", content: "a learning" });
    await backend.capture({ wing: "season-a", hall: "patterns", content: "a pattern" });

    const results = await backend.query({ wing: "season-a", hall: "patterns" });
    expect(results.length).toBe(1);
    expect(results[0].content).toBe("a pattern");
  });

  test("query filters by tags", async () => {
    await backend.capture({
      wing: "season-a",
      hall: "learnings",
      content: "security insight",
      tags: ["security", "backend"],
    });
    await backend.capture({
      wing: "season-a",
      hall: "learnings",
      content: "frontend tip",
      tags: ["frontend", "css"],
    });

    const results = await backend.query({ tags: ["security"] });
    expect(results.length).toBe(1);
    expect(results[0].content).toContain("security");
  });

  test("query does semantic (substring) matching", async () => {
    await backend.capture({
      wing: "season-a",
      hall: "learnings",
      content: "Always validate input before database insert to prevent injection",
      tags: ["security"],
    });
    await backend.capture({
      wing: "season-a",
      hall: "learnings",
      content: "CSS grid is better than flexbox for 2D layouts",
      tags: ["frontend"],
    });

    const results = await backend.query({
      semantic_query: "prevent injection database",
    });
    expect(results.length).toBe(1);
    expect(results[0].content).toContain("validate input");
  });

  test("query respects limit", async () => {
    for (let i = 0; i < 5; i++) {
      await backend.capture({
        wing: "season-a",
        hall: "learnings",
        content: `insight number ${i}`,
      });
    }
    const results = await backend.query({ wing: "season-a", limit: 2 });
    expect(results.length).toBe(2);
  });

  test("delete removes a room", async () => {
    const room = await backend.capture({
      wing: "season-a",
      hall: "learnings",
      content: "to be deleted",
    });
    await backend.delete(room.id, "test cleanup");
    const fetched = await backend.getById(room.id);
    expect(fetched).toBeNull();
  });

  test("delete throws KBRoomNotFoundError for unknown id", async () => {
    await expect(backend.delete("nonexistent", "test")).rejects.toThrow(KBRoomNotFoundError);
  });

  test("export and import round-trip", async () => {
    await backend.capture({
      wing: "season-a",
      hall: "learnings",
      content: "exported insight",
      tags: ["export-test"],
    });
    const exportPath = `/tmp/factor-echelon-kb-export-${Date.now()}.json`;
    await backend.export(exportPath);

    // Create a fresh backend and import
    const backend2 = new MempalaceBackend();
    await backend2.init({
      mode: "solo",
      backend: "mempalace",
      localPath: `/tmp/factor-echelon-test-mp2-${Date.now()}`,
    });
    await backend2.import(exportPath);

    const results = await backend2.query({ tags: ["export-test"] });
    expect(results.length).toBe(1);
    expect(results[0].content).toBe("exported insight");
  });

  test("health returns ok and backend name", async () => {
    const h = await backend.health();
    expect(h.ok).toBe(true);
    expect(h.backend).toBe("mempalace");
    expect(h.version).toBeDefined();
  });

  test("query with subhall filter", async () => {
    await backend.capture({
      wing: "season-a",
      hall: "reviews",
      subhall: "security",
      content: "check for XSS",
      tags: ["security"],
    });
    await backend.capture({
      wing: "season-a",
      hall: "reviews",
      subhall: "code",
      content: "use early returns",
      tags: ["style"],
    });

    const results = await backend.query({ hall: "reviews", subhall: "security" });
    expect(results.length).toBe(1);
    expect(results[0].content).toContain("XSS");
  });
});
