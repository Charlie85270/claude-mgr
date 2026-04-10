// build/oobe/steps/counselor-api-keys.ts — Step 4: Collect Counselor model API keys
// OPTIONAL/SKIPPABLE: Counselor placements disabled until keys provided
import type { OOBEStep, OOBEContext } from "../state-machine.ts";
import { type Keychain, InMemoryKeychain } from "../keychain.ts";

const KEYCHAIN_SERVICE = "factor-echelon-counselor";

export interface CounselorKeys {
  gemini?: string;
  gpt5?: string;
  opus?: string;
  grok?: string;
}

export type KeyProvider = () => Promise<CounselorKeys>;

let keyProvider: KeyProvider = async () => ({});
let keychainOverride: Keychain | null = null;

export function setKeyProvider(provider: KeyProvider): void {
  keyProvider = provider;
}

export function setKeychainOverride(keychain: Keychain): void {
  keychainOverride = keychain;
}

export const counselorApiKeys: OOBEStep = {
  id: "COUNSELOR_API_KEYS",
  mandatory: false, // skippable
  async run(ctx: OOBEContext) {
    const keys = await keyProvider();
    const keychain = keychainOverride ?? new InMemoryKeychain();
    const configured: string[] = [];

    for (const [model, key] of Object.entries(keys)) {
      if (key) {
        keychain.set(KEYCHAIN_SERVICE, model, key);
        configured.push(model);
      }
    }

    ctx.state.counselor_keys_configured = configured;
    ctx.state.counselor_enabled = configured.length >= 3; // need at least 3 for consensus
  },
};
