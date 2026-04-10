// build/oobe/steps/mempalace-init.ts — Step 6: Initialize mempalace knowledge base
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { OOBEStep, OOBEContext } from "../state-machine.ts";
import { MempalaceClient } from "../../lib/mempalace-client.ts";
import { GitMirror } from "../../kb/git-mirror.ts";

export const mempalaceInit: OOBEStep = {
  id: "MEMPALACE_INIT",
  mandatory: true,
  async run(ctx: OOBEContext) {
    const kbRoot = join(ctx.rootDir, "knowledge-base");
    const localPath = join(kbRoot, "local");
    const mirrorPath = join(kbRoot, "kb-git");

    mkdirSync(localPath, { recursive: true });

    // Initialize mempalace client (falls back to mock if CLI unavailable)
    const client = new MempalaceClient(localPath);
    await client.init();
    const health = await client.health();

    // Initialize git mirror for solo mode sync
    const mirror = new GitMirror(mirrorPath);
    mirror.init();

    ctx.state.kb_local_path = localPath;
    ctx.state.kb_mirror_path = mirrorPath;
    ctx.state.kb_backend = health.ok ? "mempalace" : "mock";
    ctx.state.kb_version = health.version;
  },
};
