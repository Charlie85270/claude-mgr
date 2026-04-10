/**
 * Review Gate Runner
 *
 * Orchestrates the 7 review gates for character work validation.
 * The first 6 gates run in parallel; 'refinement' runs sequentially after all pass.
 * Gate execution is currently stubbed — real logic will come from Plan 05 shared-skills.
 */

import { broadcastToAllWindows } from '../utils/broadcast';

export type GateType =
  | 'architecture'
  | 'code'
  | 'qa'
  | 'security'
  | 'adversarial'
  | 'ui'
  | 'refinement';

export type GateStatus = 'pass' | 'fail' | 'pending';

export interface GateResult {
  gate: GateType;
  status: GateStatus;
  feedback: string;
}

export const GATE_DEFINITIONS: { gate: GateType; description: string }[] = [
  { gate: 'architecture', description: 'Validates structural design and system boundaries' },
  { gate: 'code', description: 'Reviews code quality, patterns, and correctness' },
  { gate: 'qa', description: 'Checks test coverage and quality assurance criteria' },
  { gate: 'security', description: 'Scans for vulnerabilities and security best practices' },
  { gate: 'adversarial', description: 'Stress-tests edge cases and failure modes' },
  { gate: 'ui', description: 'Validates UI/UX consistency and accessibility' },
  { gate: 'refinement', description: 'Final polish pass after all other gates pass' },
];

const PARALLEL_GATES: GateType[] = [
  'architecture',
  'code',
  'qa',
  'security',
  'adversarial',
  'ui',
];

// In-memory store of current gate results keyed by characterId
const currentResults = new Map<string, GateResult[]>();

/**
 * Stub gate execution — resolves with 'pass'.
 * Real implementation will delegate to Plan 05 shared-skills at runtime.
 */
async function executeGate(
  _gate: GateType,
  _characterId: string,
  _workSummary: string
): Promise<GateResult> {
  // Simulate a small delay for realism
  await new Promise((resolve) => setTimeout(resolve, 50));
  return {
    gate: _gate,
    status: 'pass',
    feedback: '',
  };
}

/**
 * Run all 7 review gates for a character's work.
 * - First 6 run in parallel
 * - Refinement runs sequentially only if all parallel gates pass
 */
export async function runReviewGates(
  characterId: string,
  workSummary: string
): Promise<GateResult[]> {
  // Initialize all gates as pending
  const initialResults: GateResult[] = GATE_DEFINITIONS.map((def) => ({
    gate: def.gate,
    status: 'pending' as GateStatus,
    feedback: '',
  }));
  currentResults.set(characterId, initialResults);
  broadcastToAllWindows('review-gate:updated', { characterId, results: initialResults });

  // Run parallel gates
  const parallelPromises = PARALLEL_GATES.map(async (gate) => {
    const result = await executeGate(gate, characterId, workSummary);
    // Update in-memory results and broadcast
    const results = currentResults.get(characterId)!;
    const idx = results.findIndex((r) => r.gate === gate);
    if (idx !== -1) {
      results[idx] = result;
    }
    broadcastToAllWindows('review-gate:updated', { characterId, results: [...results] });
    return result;
  });

  const parallelResults = await Promise.all(parallelPromises);

  // Check if all parallel gates passed
  const allPassed = parallelResults.every((r) => r.status === 'pass');

  let refinementResult: GateResult;
  if (allPassed) {
    refinementResult = await executeGate('refinement', characterId, workSummary);
  } else {
    refinementResult = {
      gate: 'refinement',
      status: 'fail',
      feedback: 'Skipped: one or more prerequisite gates failed',
    };
  }

  // Final update
  const results = currentResults.get(characterId)!;
  const refIdx = results.findIndex((r) => r.gate === 'refinement');
  if (refIdx !== -1) {
    results[refIdx] = refinementResult;
  }

  const finalResults = [...results];
  currentResults.set(characterId, finalResults);
  broadcastToAllWindows('review-gate:updated', { characterId, results: finalResults });

  return finalResults;
}

/**
 * Get current gate status for a given character (or season).
 */
export function getGateStatus(characterId: string): GateResult[] | null {
  return currentResults.get(characterId) ?? null;
}

/**
 * List all gate definitions.
 */
export function listGateDefinitions(): { gate: GateType; description: string }[] {
  return GATE_DEFINITIONS;
}
