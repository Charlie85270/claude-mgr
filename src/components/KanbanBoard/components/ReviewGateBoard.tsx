'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Code2,
  TestTube2,
  Lock,
  Swords,
  Palette,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

type GateStatus = 'pass' | 'fail' | 'pending';

interface GateResult {
  gate: string;
  status: GateStatus;
  feedback: string;
}

interface GateDefinition {
  gate: string;
  description: string;
}

interface ReviewGateUpdate {
  characterId: string;
  results: GateResult[];
}

const GATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  architecture: Shield,
  code: Code2,
  qa: TestTube2,
  security: Lock,
  adversarial: Swords,
  ui: Palette,
  refinement: Sparkles,
};

const GATE_COLORS: Record<GateStatus, string> = {
  pass: 'text-green-400',
  fail: 'text-red-400',
  pending: 'text-amber-400',
};

const GATE_BG: Record<GateStatus, string> = {
  pass: 'bg-green-500/10 border-green-500/20',
  fail: 'bg-red-500/10 border-red-500/20',
  pending: 'bg-amber-500/10 border-amber-500/20',
};

function StatusIcon({ status }: { status: GateStatus }) {
  if (status === 'pass') {
    return <CheckCircle2 className="w-5 h-5 text-green-400" />;
  }
  if (status === 'fail') {
    return <XCircle className="w-5 h-5 text-red-400" />;
  }
  return <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />;
}

interface ReviewGateBoardProps {
  characterId?: string;
  className?: string;
}

export function ReviewGateBoard({ characterId, className = '' }: ReviewGateBoardProps) {
  const [gates, setGates] = useState<GateDefinition[]>([]);
  const [results, setResults] = useState<GateResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Load gate definitions
  useEffect(() => {
    const api = (window as unknown as { electronAPI?: Record<string, unknown> }).electronAPI as
      | { reviewGate: { list: () => Promise<{ gates: GateDefinition[] }> } }
      | undefined;
    if (!api?.reviewGate) return;

    api.reviewGate.list().then((res) => {
      if (res.gates) setGates(res.gates);
    });
  }, []);

  // Listen for real-time gate updates
  useEffect(() => {
    const api = (window as unknown as { electronAPI?: Record<string, unknown> }).electronAPI as
      | { reviewGate: { onUpdated: (cb: (update: ReviewGateUpdate) => void) => () => void } }
      | undefined;
    if (!api?.reviewGate) return;

    const cleanup = api.reviewGate.onUpdated((update: ReviewGateUpdate) => {
      if (!characterId || update.characterId === characterId) {
        setResults(update.results);
        const allDone = update.results.every((r) => r.status !== 'pending');
        if (allDone) setIsRunning(false);
      }
    });

    return cleanup;
  }, [characterId]);

  // Load existing status on mount
  useEffect(() => {
    if (!characterId) return;
    const api = (window as unknown as { electronAPI?: Record<string, unknown> }).electronAPI as
      | { reviewGate: { status: (id: string) => Promise<{ results: GateResult[] | null }> } }
      | undefined;
    if (!api?.reviewGate) return;

    api.reviewGate.status(characterId).then((res) => {
      if (res.results) setResults(res.results);
    });
  }, [characterId]);

  const runGates = useCallback(async () => {
    if (!characterId) return;
    const api = (window as unknown as { electronAPI?: Record<string, unknown> }).electronAPI as
      | {
          reviewGate: {
            run: (id: string, summary: string) => Promise<{ success: boolean; results?: GateResult[] }>;
          };
        }
      | undefined;
    if (!api?.reviewGate) return;

    setIsRunning(true);
    await api.reviewGate.run(characterId, 'Manual review gate run');
  }, [characterId]);

  // Merge gate definitions with results
  const gateColumns = gates.map((def) => {
    const result = results.find((r) => r.gate === def.gate);
    return {
      ...def,
      status: result?.status ?? ('pending' as GateStatus),
      feedback: result?.feedback ?? '',
    };
  });

  const passCount = results.filter((r) => r.status === 'pass').length;
  const failCount = results.filter((r) => r.status === 'fail').length;
  const totalGates = gates.length || 7;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">Review Gates</h3>
          {results.length > 0 && (
            <span className="text-xs text-zinc-500">
              {passCount}/{totalGates} passed
              {failCount > 0 && (
                <span className="text-red-400 ml-1">({failCount} failed)</span>
              )}
            </span>
          )}
        </div>
        {characterId && (
          <button
            onClick={runGates}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Run Gates
              </>
            )}
          </button>
        )}
      </div>

      {/* Gate columns */}
      <div className="grid grid-cols-7 gap-2">
        <AnimatePresence mode="popLayout">
          {gateColumns.map((gate) => {
            const Icon = GATE_ICONS[gate.gate] ?? Shield;
            return (
              <motion.div
                key={gate.gate}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border ${GATE_BG[gate.status]} transition-colors`}
              >
                <div className={`${GATE_COLORS[gate.status]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-zinc-300 capitalize text-center leading-tight">
                  {gate.gate}
                </span>
                <StatusIcon status={gate.status} />
                {gate.feedback && (
                  <p className="text-[10px] text-zinc-500 text-center mt-1 leading-tight line-clamp-3">
                    {gate.feedback}
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {gateColumns.length === 0 && (
        <div className="text-center py-8 text-zinc-500 text-sm">
          No gate definitions loaded. Ensure the Electron backend is running.
        </div>
      )}
    </div>
  );
}
