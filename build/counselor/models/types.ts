// build/counselor/models/types.ts — Common interface for all Counselor model clients

export interface ModelRequest {
  system: string;
  user: string;
  temperature: number;
  max_tokens: number;
}

export interface ModelResponse {
  content: string;
  model: string;
  tokens_used: number;
  rating?: number;
  duration_ms: number;
}

export interface ModelClient {
  name: string;
  lineage: string;
  invoke(request: ModelRequest): Promise<ModelResponse>;
  health(): Promise<boolean>;
}

// Stub client for testing — returns deterministic responses
export class StubModelClient implements ModelClient {
  constructor(
    public readonly name: string,
    public readonly lineage: string,
    private readonly defaultRating: number = 5,
    private readonly shouldFail: boolean = false,
  ) {}

  async invoke(request: ModelRequest): Promise<ModelResponse> {
    if (this.shouldFail) {
      throw new Error(`${this.name} unavailable`);
    }
    const start = Date.now();
    // Extract rating from the prompt if it asks for one
    const ratingMatch = request.user.match(/rate.*?(\d)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : this.defaultRating;

    return {
      content: `[${this.name}] Assessment complete. Rating: ${rating}/5`,
      model: this.name,
      tokens_used: 150,
      rating,
      duration_ms: Date.now() - start,
    };
  }

  async health(): Promise<boolean> {
    return !this.shouldFail;
  }
}
