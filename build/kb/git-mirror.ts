import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export class GitMirror {
  constructor(private readonly mirrorPath: string) {}

  getMirrorPath(): string {
    return this.mirrorPath;
  }

  init(): void {
    if (!existsSync(this.mirrorPath)) {
      mkdirSync(this.mirrorPath, { recursive: true });
      spawnSync("git", ["init"], { cwd: this.mirrorPath });
      spawnSync("git", ["config", "user.email", "kb-mirror@factor-echelon.local"], { cwd: this.mirrorPath });
      spawnSync("git", ["config", "user.name", "factor-echelon KB"], { cwd: this.mirrorPath });
      spawnSync("git", ["config", "commit.gpgsign", "false"], { cwd: this.mirrorPath });
      writeFileSync(
        join(this.mirrorPath, "README.md"),
        "# factor-echelon KB mirror\n\nSolo-mode git mirror of the local knowledge base.\n"
      );
      spawnSync("git", ["add", "."], { cwd: this.mirrorPath });
      spawnSync("git", ["commit", "-m", "init: factor-echelon KB mirror"], { cwd: this.mirrorPath });
    }
  }

  commitChange(message: string, files: string[]): void {
    spawnSync("git", ["add", ...files], { cwd: this.mirrorPath });
    spawnSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", message, "--allow-empty"], { cwd: this.mirrorPath });
  }

  push(): { success: boolean; error?: string } {
    const result = spawnSync("git", ["push", "origin", "main"], {
      cwd: this.mirrorPath,
      encoding: "utf-8",
    });
    return { success: result.status === 0, error: result.stderr || undefined };
  }

  pull(): { success: boolean; error?: string } {
    const result = spawnSync("git", ["pull", "origin", "main"], {
      cwd: this.mirrorPath,
      encoding: "utf-8",
    });
    return { success: result.status === 0, error: result.stderr || undefined };
  }
}
