/**
 * Counselor Service — Multi-model consensus engine for Echelon placements
 *
 * Fans out to 4 model endpoints in parallel, applies placement-specific
 * consensus rules, and returns a structured verdict.
 *
 * Model calls are currently stubs returning mock verdicts.
 * Real API integration will follow once keys are provisioned.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CounselorPlacement =
  | 'skill-promotion'
  | 'design-review'
  | 'deadlock-escalation'
  | 'adversarial';

export type CounselorDecision = 'approve' | 'reject' | 'escalate';

export interface ModelVerdict {
  model: string;
  decision: CounselorDecision;
  confidence: number;
  reasoning: string;
  latencyMs: number;
}

export interface CounselorVerdict {
  placement: CounselorPlacement;
  decision: CounselorDecision;
  confidence: number;
  modelVerdicts: ModelVerdict[];
  timestamp: string;
}

interface ModelKeys {
  geminiKey?: string;
  openaiKey?: string;
  anthropicKey?: string;
  grokKey?: string;
}

// ---------------------------------------------------------------------------
// Available placements with metadata
// ---------------------------------------------------------------------------

export const PLACEMENTS: Record<CounselorPlacement, { label: string; description: string; algorithm: string }> = {
  'skill-promotion': {
    label: 'Skill Promotion',
    description: 'Majority vote (3/4 agree) to promote a skill',
    algorithm: 'majority',
  },
  'design-review': {
    label: 'Design Review',
    description: 'Majority vote (3/4 agree) to approve a design',
    algorithm: 'majority',
  },
  'deadlock-escalation': {
    label: 'Deadlock Escalation',
    description: 'Weighted average confidence to break a deadlock',
    algorithm: 'weighted-average',
  },
  'adversarial': {
    label: 'Adversarial Review',
    description: 'Any red flag vetoes — unanimous pass required',
    algorithm: 'unanimous',
  },
};

// ---------------------------------------------------------------------------
// Model identifiers
// ---------------------------------------------------------------------------

const MODELS = [
  'gemini-2.5-pro',
  'gpt-5',
  'claude-opus-4',
  'grok-3',
] as const;

// ---------------------------------------------------------------------------
// Stub model invocation (returns mock verdict)
// ---------------------------------------------------------------------------

async function invokeModelStub(
  model: string,
  _placement: CounselorPlacement,
  _context: string,
  _keys: ModelKeys,
): Promise<ModelVerdict> {
  // Simulate network latency (50-300ms)
  const latency = 50 + Math.random() * 250;
  await new Promise((resolve) => setTimeout(resolve, latency));

  // Deterministic-ish mock: most models approve, with some variance
  const roll = Math.random();
  let decision: CounselorDecision;
  let confidence: number;

  if (roll < 0.7) {
    decision = 'approve';
    confidence = 0.75 + Math.random() * 0.2;
  } else if (roll < 0.9) {
    decision = 'reject';
    confidence = 0.6 + Math.random() * 0.25;
  } else {
    decision = 'escalate';
    confidence = 0.4 + Math.random() * 0.3;
  }

  return {
    model,
    decision,
    confidence: Math.round(confidence * 100) / 100,
    reasoning: `[STUB] ${model} returned ${decision} with ${(confidence * 100).toFixed(0)}% confidence`,
    latencyMs: Math.round(latency),
  };
}

// ---------------------------------------------------------------------------
// Consensus algorithms
// ---------------------------------------------------------------------------

function majorityConsensus(verdicts: ModelVerdict[]): { decision: CounselorDecision; confidence: number } {
  const approveCount = verdicts.filter((v) => v.decision === 'approve').length;
  const rejectCount = verdicts.filter((v) => v.decision === 'reject').length;
  const majorityThreshold = Math.ceil(verdicts.length * 0.75); // 3 of 4

  const avgConfidence =
    verdicts.reduce((sum, v) => sum + v.confidence, 0) / verdicts.length;

  if (approveCount >= majorityThreshold) {
    return { decision: 'approve', confidence: Math.round(avgConfidence * 100) / 100 };
  }
  if (rejectCount >= majorityThreshold) {
    return { decision: 'reject', confidence: Math.round(avgConfidence * 100) / 100 };
  }
  return { decision: 'escalate', confidence: Math.round(avgConfidence * 100) / 100 };
}

function weightedAverageConsensus(verdicts: ModelVerdict[]): { decision: CounselorDecision; confidence: number } {
  // Weights per model (higher = more influence)
  const weights: Record<string, number> = {
    'claude-opus-4': 1.3,
    'gpt-5': 1.2,
    'gemini-2.5-pro': 1.0,
    'grok-3': 0.9,
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const v of verdicts) {
    const w = weights[v.model] ?? 1.0;
    const score = v.decision === 'approve' ? 1 : v.decision === 'reject' ? 0 : 0.5;
    weightedScore += score * w * v.confidence;
    totalWeight += w;
  }

  const avg = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const confidence = Math.round(avg * 100) / 100;

  if (avg >= 0.6) return { decision: 'approve', confidence };
  if (avg <= 0.35) return { decision: 'reject', confidence };
  return { decision: 'escalate', confidence };
}

function unanimousConsensus(verdicts: ModelVerdict[]): { decision: CounselorDecision; confidence: number } {
  // Any rejection vetoes the entire decision
  const hasRejection = verdicts.some((v) => v.decision === 'reject');
  const avgConfidence =
    verdicts.reduce((sum, v) => sum + v.confidence, 0) / verdicts.length;
  const confidence = Math.round(avgConfidence * 100) / 100;

  if (hasRejection) {
    return { decision: 'reject', confidence };
  }

  const hasEscalation = verdicts.some((v) => v.decision === 'escalate');
  if (hasEscalation) {
    return { decision: 'escalate', confidence };
  }

  return { decision: 'approve', confidence };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Invoke the Counselor panel for a given placement and context.
 * Fans out to all 4 models in parallel, then applies placement-specific consensus.
 */
export async function invokeCounselor(
  placement: CounselorPlacement,
  context: string,
  keys: ModelKeys = {},
): Promise<CounselorVerdict> {
  // Fan out to all models in parallel
  const modelVerdicts = await Promise.all(
    MODELS.map((model) => invokeModelStub(model, placement, context, keys)),
  );

  // Apply placement-specific consensus
  let result: { decision: CounselorDecision; confidence: number };

  switch (placement) {
    case 'skill-promotion':
    case 'design-review':
      result = majorityConsensus(modelVerdicts);
      break;
    case 'deadlock-escalation':
      result = weightedAverageConsensus(modelVerdicts);
      break;
    case 'adversarial':
      result = unanimousConsensus(modelVerdicts);
      break;
    default:
      result = majorityConsensus(modelVerdicts);
  }

  return {
    placement,
    decision: result.decision,
    confidence: result.confidence,
    modelVerdicts,
    timestamp: new Date().toISOString(),
  };
}

/**
 * List available placements with their descriptions.
 */
export function listPlacements() {
  return Object.entries(PLACEMENTS).map(([id, meta]) => ({
    id,
    ...meta,
  }));
}

/**
 * Resolve model API keys from CLI auth configs and app settings.
 *
 * - Anthropic: ANTHROPIC_API_KEY env var (set when Claude CLI is configured)
 * - OpenAI: access_token from ~/.codex/auth.json (Codex CLI OAuth)
 * - Gemini: GOOGLE_API_KEY or GEMINI_API_KEY env var, or gcloud ADC
 * - Grok: dedicated field in app settings (no CLI tool to piggyback on)
 */
export function resolveModelKeys(appSettings: Record<string, unknown>): ModelKeys {
  return {
    anthropicKey: resolveAnthropicKey(),
    openaiKey: resolveOpenAIKey(),
    geminiKey: resolveGeminiKey(),
    grokKey: (appSettings.grokApiKey as string) || undefined,
  };
}

function resolveAnthropicKey(): string | undefined {
  // 1. Environment variable (standard Anthropic SDK pattern)
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

  // 2. Check ~/.anthropic/config if it exists
  try {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(require('os').homedir(), '.anthropic', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.api_key) return config.api_key;
    }
  } catch { /* ignore */ }

  return undefined;
}

function resolveOpenAIKey(): string | undefined {
  // 1. Environment variable
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  // 2. Codex CLI auth — uses OAuth access_token
  try {
    const fs = require('fs');
    const path = require('path');
    const authPath = path.join(require('os').homedir(), '.codex', 'auth.json');
    if (fs.existsSync(authPath)) {
      const auth = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
      // Prefer explicit API key, fall back to OAuth access token
      if (auth.OPENAI_API_KEY) return auth.OPENAI_API_KEY;
      if (auth.tokens?.access_token) return auth.tokens.access_token;
    }
  } catch { /* ignore */ }

  return undefined;
}

function resolveGeminiKey(): string | undefined {
  // 1. Environment variables (Google AI Studio / Vertex patterns)
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  // 2. gcloud application default credentials (ADC)
  try {
    const fs = require('fs');
    const path = require('path');
    const adcPath = path.join(require('os').homedir(), '.config', 'gcloud', 'application_default_credentials.json');
    if (fs.existsSync(adcPath)) {
      const adc = JSON.parse(fs.readFileSync(adcPath, 'utf-8'));
      // ADC uses OAuth — return the client_id as a signal that auth exists
      if (adc.client_id) return `adc:${adc.client_id}`;
    }
  } catch { /* ignore */ }

  return undefined;
}
