'use client';

import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ModelVerdict {
  model: string;
  decision: 'approve' | 'reject' | 'escalate';
  confidence: number;
  reasoning: string;
  latencyMs: number;
}

interface CounselorVerdictData {
  placement: string;
  decision: 'approve' | 'reject' | 'escalate';
  confidence: number;
  modelVerdicts: ModelVerdict[];
  timestamp: string;
}

const DECISION_STYLES: Record<string, { bg: string; text: string; border: string; icon: typeof CheckCircle; label: string }> = {
  approve: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    border: 'border-green-500/30',
    icon: CheckCircle,
    label: 'Approved',
  },
  reject: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    icon: XCircle,
    label: 'Rejected',
  },
  escalate: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    icon: AlertTriangle,
    label: 'Escalated',
  },
};

const PLACEMENT_LABELS: Record<string, string> = {
  'skill-promotion': 'Skill Promotion',
  'design-review': 'Design Review',
  'deadlock-escalation': 'Deadlock Escalation',
  'adversarial': 'Adversarial Review',
};

const MODEL_LABELS: Record<string, string> = {
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gpt-5': 'GPT-5',
  'claude-opus-4': 'Claude Opus 4',
  'grok-3': 'Grok 3',
};

interface CounselorVerdictProps {
  verdict: CounselorVerdictData;
}

export default function CounselorVerdict({ verdict }: CounselorVerdictProps) {
  const style = DECISION_STYLES[verdict.decision] || DECISION_STYLES.escalate;
  const DecisionIcon = style.icon;
  const placementLabel = PLACEMENT_LABELS[verdict.placement] || verdict.placement;
  const confidencePct = Math.round(verdict.confidence * 100);

  const formattedTime = new Date(verdict.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className={`border ${style.border} rounded-lg overflow-hidden`}>
      {/* Header */}
      <div className={`${style.bg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {placementLabel}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{formattedTime}</span>
      </div>

      {/* Decision + Confidence */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <DecisionIcon className={`w-5 h-5 ${style.text}`} />
          <span className={`text-sm font-semibold ${style.text}`}>{style.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                confidencePct >= 70
                  ? 'bg-green-500'
                  : confidencePct >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{confidencePct}%</span>
        </div>
      </div>

      {/* Per-model breakdown */}
      <div className="px-4 py-2 space-y-1.5">
        {verdict.modelVerdicts.map((mv) => {
          const mvStyle = DECISION_STYLES[mv.decision] || DECISION_STYLES.escalate;
          const MvIcon = mvStyle.icon;
          const mvConfPct = Math.round(mv.confidence * 100);
          const modelLabel = MODEL_LABELS[mv.model] || mv.model;

          return (
            <div key={mv.model} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <MvIcon className={`w-3.5 h-3.5 flex-shrink-0 ${mvStyle.text}`} />
                <span className="text-xs text-foreground truncate">{modelLabel}</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs font-medium ${mvStyle.text}`}>
                  {mv.decision}
                </span>
                <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                  {mvConfPct}%
                </span>
                <span className="text-xs text-muted-foreground/60 w-12 text-right">
                  {mv.latencyMs}ms
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
