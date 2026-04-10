// build/oobe/keychain.ts — Cross-platform OS keychain integration
// macOS: security CLI (Keychain), Linux: secret-tool (GNOME Keyring), Windows: cmdkey
import { spawnSync } from "node:child_process";
import { platform } from "node:os";

export interface Keychain {
  set(service: string, account: string, secret: string): void;
  get(service: string, account: string): string | null;
  delete(service: string, account: string): void;
}

export function getKeychain(): Keychain {
  const p = platform();
  if (p === "darwin") return new MacOSKeychain();
  if (p === "linux") return new LinuxSecretService();
  if (p === "win32") return new WindowsCredentialManager();
  // Fallback: in-memory keychain for testing / unsupported platforms
  return new InMemoryKeychain();
}

class MacOSKeychain implements Keychain {
  set(service: string, account: string, secret: string): void {
    const result = spawnSync("security", [
      "add-generic-password", "-s", service, "-a", account, "-w", secret, "-U",
    ]);
    if (result.status !== 0) {
      throw new Error(`macOS Keychain set failed: ${result.stderr?.toString()}`);
    }
  }

  get(service: string, account: string): string | null {
    const result = spawnSync("security", [
      "find-generic-password", "-s", service, "-a", account, "-w",
    ], { encoding: "utf-8" });
    return result.status === 0 ? result.stdout.trim() : null;
  }

  delete(service: string, account: string): void {
    spawnSync("security", ["delete-generic-password", "-s", service, "-a", account]);
  }
}

class LinuxSecretService implements Keychain {
  set(service: string, account: string, secret: string): void {
    const result = spawnSync("secret-tool", [
      "store", "--label", `${service}/${account}`, "service", service, "account", account,
    ], { input: secret, encoding: "utf-8" });
    if (result.status !== 0) {
      throw new Error(`secret-tool store failed: ${result.stderr}`);
    }
  }

  get(service: string, account: string): string | null {
    const result = spawnSync("secret-tool", [
      "lookup", "service", service, "account", account,
    ], { encoding: "utf-8" });
    return result.status === 0 ? result.stdout.trim() : null;
  }

  delete(service: string, account: string): void {
    spawnSync("secret-tool", ["clear", "service", service, "account", account]);
  }
}

class WindowsCredentialManager implements Keychain {
  set(service: string, account: string, secret: string): void {
    const target = `${service}/${account}`;
    spawnSync("cmdkey", ["/add:" + target, "/user:" + account, "/pass:" + secret]);
  }

  get(service: string, account: string): string | null {
    // Windows cmdkey doesn't easily expose passwords; use PowerShell
    const target = `${service}/${account}`;
    const result = spawnSync("powershell", [
      "-Command",
      `(Get-StoredCredential -Target '${target}').GetNetworkCredential().Password`,
    ], { encoding: "utf-8" });
    return result.status === 0 && result.stdout.trim() ? result.stdout.trim() : null;
  }

  delete(service: string, account: string): void {
    const target = `${service}/${account}`;
    spawnSync("cmdkey", ["/delete:" + target]);
  }
}

export class InMemoryKeychain implements Keychain {
  private store = new Map<string, string>();

  set(service: string, account: string, secret: string): void {
    this.store.set(`${service}/${account}`, secret);
  }

  get(service: string, account: string): string | null {
    return this.store.get(`${service}/${account}`) ?? null;
  }

  delete(service: string, account: string): void {
    this.store.delete(`${service}/${account}`);
  }
}
