import { expect, test, describe, beforeEach } from "bun:test";
import { dispatch, type CLICommand } from "../../build/cli/dispatch.ts";
import { getAuditLog, clearAuditLog } from "../../build/cli/audit-log.ts";

beforeEach(() => clearAuditLog());

describe("CLI dispatch", () => {
  test("unknown command returns failure", async () => {
    const result = await dispatch({ name: "nonexistent", args: [], flags: {} });
    expect(result.success).toBe(false);
    expect(result.output).toContain("unknown command");
  });

  test("dispatch logs every command to audit", async () => {
    await dispatch({ name: "cancel", args: ["task", "t-001"], flags: {} });
    const log = getAuditLog();
    expect(log.length).toBe(1);
    expect(log[0].command).toBe("cancel");
    expect(log[0].result).toBe("success");
  });
});

describe("cancel commands", () => {
  test("cancel season", async () => {
    const result = await dispatch({ name: "cancel", args: ["season", "my-project"], flags: {} });
    expect(result.success).toBe(true);
    expect(result.output).toContain("my-project");
  });

  test("cancel task", async () => {
    const result = await dispatch({ name: "cancel", args: ["task", "task-42"], flags: {} });
    expect(result.success).toBe(true);
    expect(result.output).toContain("task-42");
  });

  test("cancel expansion", async () => {
    const result = await dispatch({ name: "cancel", args: ["expansion"], flags: {} });
    expect(result.success).toBe(true);
  });
});

describe("override commands", () => {
  test("override requires reason", async () => {
    const result = await dispatch({ name: "override", args: ["review", "t-1", "security"], flags: {} });
    expect(result.success).toBe(false);
    expect(result.output).toContain("--reason");
  });

  test("override review with reason succeeds", async () => {
    const result = await dispatch({
      name: "override",
      args: ["review", "t-1", "security"],
      flags: { reason: "false positive" },
      reason: "false positive",
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("force-passed");
  });

  test("override merge with reason succeeds", async () => {
    const result = await dispatch({
      name: "override",
      args: ["merge", "t-1"],
      flags: { reason: "emergency hotfix" },
      reason: "emergency hotfix",
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("force-merged");
  });
});

describe("season commands", () => {
  test("season new", async () => {
    const result = await dispatch({ name: "season", args: ["new", "Build", "a", "chat", "app"], flags: {} });
    expect(result.success).toBe(true);
    expect(result.output).toContain("ingestion started");
  });

  test("season list on empty dir", async () => {
    const result = await dispatch({ name: "season", args: ["list"], flags: { rootDir: "/tmp/nonexistent-" + Date.now() } });
    expect(result.success).toBe(true);
    expect(result.output).toContain("no seasons");
  });

  test("season set-tier validates tier", async () => {
    const result = await dispatch({ name: "season", args: ["set-tier", "my-proj", "mega"], flags: {} });
    expect(result.success).toBe(false);
    expect(result.output).toContain("medium");
  });

  test("season set-tier with valid tier", async () => {
    const result = await dispatch({ name: "season", args: ["set-tier", "my-proj", "enterprise"], flags: {} });
    expect(result.success).toBe(true);
  });
});

describe("character commands", () => {
  test("character add", async () => {
    const result = await dispatch({ name: "character", args: ["add", "s01", "ml-engineer"], flags: {} });
    expect(result.success).toBe(true);
  });

  test("character pause", async () => {
    const result = await dispatch({ name: "character", args: ["pause", "penny"], flags: {} });
    expect(result.success).toBe(true);
    expect(result.output).toContain("paused");
  });
});

describe("kb commands", () => {
  test("kb delete requires reason", async () => {
    const result = await dispatch({ name: "kb", args: ["delete", "room-1"], flags: {} });
    expect(result.success).toBe(false);
  });

  test("kb delete with reason", async () => {
    const result = await dispatch({
      name: "kb",
      args: ["delete", "room-1"],
      flags: { reason: "poisoned data" },
      reason: "poisoned data",
    });
    expect(result.success).toBe(true);
    expect(result.output).toContain("quarantined");
  });

  test("kb export", async () => {
    const result = await dispatch({ name: "kb", args: ["export", "/tmp/kb-backup.tar.gz"], flags: {} });
    expect(result.success).toBe(true);
  });
});

describe("counselor commands", () => {
  test("counselor budget", async () => {
    const result = await dispatch({ name: "counselor", args: ["budget"], flags: {} });
    expect(result.success).toBe(true);
    expect(result.output).toContain("$");
  });

  test("counselor history", async () => {
    const result = await dispatch({ name: "counselor", args: ["history", "A"], flags: {} });
    expect(result.success).toBe(true);
  });
});

describe("uninstall", () => {
  test("uninstall without --force is dry-run", async () => {
    const result = await dispatch({ name: "uninstall", args: [], flags: {} });
    expect(result.success).toBe(true);
    expect(result.output).toContain("would uninstall");
  });

  test("uninstall with --force removes directory", async () => {
    const tmpDir = `/tmp/factor-echelon-uninstall-${Date.now()}`;
    const { mkdirSync } = await import("node:fs");
    mkdirSync(tmpDir, { recursive: true });

    const result = await dispatch({ name: "uninstall", args: [], flags: { force: true, rootDir: tmpDir } });
    expect(result.success).toBe(true);
    expect(result.output).toContain("uninstalled");
  });
});

describe("audit log", () => {
  test("all commands are audit-logged", async () => {
    await dispatch({ name: "cancel", args: ["task", "t-1"], flags: {} });
    await dispatch({ name: "season", args: ["list"], flags: { rootDir: "/tmp/x" } });
    await dispatch({ name: "counselor", args: ["budget"], flags: {} });

    const log = getAuditLog();
    expect(log.length).toBe(3);
    expect(log.map((e) => e.command)).toEqual(["cancel", "season", "counselor"]);
  });

  test("audit log can filter by command", async () => {
    await dispatch({ name: "cancel", args: ["task", "t-1"], flags: {} });
    await dispatch({ name: "season", args: ["list"], flags: { rootDir: "/tmp/x" } });

    const filtered = getAuditLog({ command: "cancel" });
    expect(filtered.length).toBe(1);
  });
});
