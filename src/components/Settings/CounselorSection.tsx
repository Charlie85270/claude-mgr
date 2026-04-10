'use client';

import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import type { AppSettings } from './types';

interface CounselorSectionProps {
  appSettings: AppSettings;
  onSaveAppSettings: (updates: Partial<AppSettings>) => void;
  onUpdateLocalSettings: (updates: Partial<AppSettings>) => void;
}

export const CounselorSection = ({ appSettings, onSaveAppSettings, onUpdateLocalSettings }: CounselorSectionProps) => {
  const [showGrokKey, setShowGrokKey] = useState(false);
  const grokKey = appSettings.grokApiKey || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Counselor</h2>
        <p className="text-sm text-muted-foreground">
          Configure the 4-model consensus council for high-stakes decisions.
        </p>
      </div>

      {/* Auto-resolved models */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Model Authentication</h3>
        <p className="text-xs text-muted-foreground">
          Three of four models use credentials from their CLI tools. Only Grok requires a separate API key.
        </p>

        <div className="space-y-2">
          <ModelStatus
            name="Claude Opus"
            source="ANTHROPIC_API_KEY env var or Claude CLI auth"
            detected={!!process.env?.ANTHROPIC_API_KEY}
          />
          <ModelStatus
            name="GPT-5"
            source="Codex CLI auth (~/.codex/auth.json)"
            detected={true}
          />
          <ModelStatus
            name="Gemini Pro"
            source="GEMINI_API_KEY / GOOGLE_API_KEY env var or gcloud ADC"
            detected={!!process.env?.GEMINI_API_KEY || !!process.env?.GOOGLE_API_KEY}
          />
        </div>
      </div>

      {/* Grok API Key */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Grok API Key</h3>
        <p className="text-xs text-muted-foreground">
          Get your API key from{' '}
          <span className="text-foreground">console.x.ai</span>
        </p>
        <div className="relative">
          <input
            type={showGrokKey ? 'text' : 'password'}
            value={grokKey}
            onChange={(e) => onUpdateLocalSettings({ grokApiKey: e.target.value })}
            onBlur={() => onSaveAppSettings({ grokApiKey: grokKey })}
            placeholder="xai-..."
            className="w-full px-3 py-2 pr-10 bg-secondary border border-border text-sm font-mono focus:border-foreground focus:outline-none"
          />
          <button
            onClick={() => setShowGrokKey(!showGrokKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            {showGrokKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Placement info */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Consensus Placements</h3>
        <div className="grid gap-2">
          <PlacementCard
            name="Skill Promotion"
            algorithm="Majority vote (3/4 agree)"
          />
          <PlacementCard
            name="Design Review"
            algorithm="Majority vote (3/4 agree)"
          />
          <PlacementCard
            name="Deadlock Escalation"
            algorithm="Weighted average with model weights"
          />
          <PlacementCard
            name="Adversarial Review"
            algorithm="Unanimous pass required (any red flag vetoes)"
          />
        </div>
      </div>
    </div>
  );
};

function ModelStatus({ name, source, detected }: { name: string; source: string; detected: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-secondary/50 rounded-lg">
      {detected ? (
        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground truncate">{source}</div>
      </div>
    </div>
  );
}

function PlacementCard({ name, algorithm }: { name: string; algorithm: string }) {
  return (
    <div className="px-3 py-2 bg-secondary/30 rounded-lg">
      <div className="text-sm font-medium">{name}</div>
      <div className="text-xs text-muted-foreground">{algorithm}</div>
    </div>
  );
}
