// build/counselor/models/gemini.ts — Google Gemini Pro client
import type { ModelClient, ModelRequest, ModelResponse } from "./types.ts";
import { InMemoryKeychain } from "../../oobe/keychain.ts";

const KEYCHAIN_SERVICE = "factor-echelon-counselor";

export class GeminiClient implements ModelClient {
  readonly name = "gemini";
  readonly lineage = "gemini-family";

  async invoke(request: ModelRequest): Promise<ModelResponse> {
    const start = Date.now();
    const keychain = new InMemoryKeychain(); // real impl uses getKeychain()
    const apiKey = keychain.get(KEYCHAIN_SERVICE, "gemini");

    // In v0.1, stub the API call — real implementation uses @google/generative-ai
    return {
      content: `[gemini] Analysis complete based on provided context.`,
      model: "gemini-2.5-pro-latest",
      tokens_used: 200,
      rating: 4,
      duration_ms: Date.now() - start,
    };
  }

  async health(): Promise<boolean> {
    return true;
  }
}
