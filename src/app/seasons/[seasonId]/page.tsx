'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Shield, Settings, Archive, RotateCcw } from 'lucide-react';
import ThemeBadge from '@/components/Echelon/ThemeBadge';
import Link from 'next/link';

interface Season {
  id: string;
  name: string;
  theme: string;
  status: string;
  characterIds: string[];
  createdAt: string;
  archivedAt?: string;
  workspacePath: string;
  rosterManifestPath: string;
}

type Tab = 'roster' | 'gates' | 'settings';

export default function SeasonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const seasonId = params.seasonId as string;

  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('roster');
  const [actionLoading, setActionLoading] = useState(false);

  const api = typeof window !== 'undefined'
    ? (window as unknown as { electronAPI: any }).electronAPI
    : null;

  useEffect(() => {
    const fetchSeason = async () => {
      if (!api) return;
      try {
        setLoading(true);
        const result = await api.season.get(seasonId);
        if (result.season) {
          setSeason(result.season);
        }
      } catch (err) {
        console.error('Failed to fetch season:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSeason();

    if (api) {
      const unsub = api.season.onUpdated((updated: Season) => {
        if (updated.id === seasonId) {
          setSeason(updated);
        }
      });
      return () => { unsub(); };
    }
  }, [seasonId]);

  const handleArchive = async () => {
    if (!api || !season) return;
    setActionLoading(true);
    try {
      await api.season.archive(season.id);
    } catch (err) {
      console.error('Failed to archive season:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!api || !season) return;
    setActionLoading(true);
    try {
      await api.season.restore(season.id);
    } catch (err) {
      console.error('Failed to restore season:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-3rem)] flex items-center justify-center text-muted-foreground text-sm">
        Loading season...
      </div>
    );
  }

  if (!season) {
    return (
      <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-3rem)] flex flex-col items-center justify-center text-muted-foreground">
        <p className="text-sm">Season not found</p>
        <Link href="/seasons" className="text-xs text-primary mt-2 hover:underline">
          Back to Seasons
        </Link>
      </div>
    );
  }

  const createdDate = new Date(season.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'roster', label: 'Roster', icon: Users },
    { key: 'gates', label: 'Review Gates', icon: Shield },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-3rem)] flex flex-col pt-4 lg:pt-6">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/seasons"
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground truncate">
              {season.name}
            </h1>
            <ThemeBadge theme={season.theme} />
          </div>
          <p className="text-muted-foreground text-xs mt-0.5">
            Created {createdDate} &middot; {season.characterIds.length} character{season.characterIds.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {season.status === 'archived' ? (
            <button
              onClick={handleRestore}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore
            </button>
          ) : (
            <button
              onClick={handleArchive}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary text-muted-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all border-b-2 -mb-px
              ${activeTab === tab.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-4">
        {activeTab === 'roster' && <RosterTab season={season} />}
        {activeTab === 'gates' && <GatesTab season={season} />}
        {activeTab === 'settings' && <SettingsTab season={season} />}
      </div>
    </div>
  );
}

/* ─── Roster Tab ─────────────────────────────────────────────── */

function RosterTab({ season }: { season: Season }) {
  if (season.characterIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
        <Users className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No characters in this season</p>
        <p className="text-xs mt-1">Characters are added when the season roster is populated</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {season.characterIds.map(charId => (
        <div
          key={charId}
          className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{charId}</p>
              <p className="text-xs text-muted-foreground">Character</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Review Gates Tab ───────────────────────────────────────── */

function GatesTab({ season }: { season: Season }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
      <Shield className="w-8 h-8 mb-2 opacity-50" />
      <p className="text-sm">Review gates are not yet configured</p>
      <p className="text-xs mt-1">Gates define quality checkpoints for season outputs</p>
    </div>
  );
}

/* ─── Settings Tab ───────────────────────────────────────────── */

function SettingsTab({ season }: { season: Season }) {
  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Season Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID</span>
            <span className="text-foreground font-mono text-xs">{season.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="text-foreground capitalize">{season.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Theme</span>
            <span className="text-foreground">{season.theme}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Workspace</span>
            <span className="text-foreground font-mono text-xs truncate max-w-[60%]" title={season.workspacePath}>
              {season.workspacePath}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Roster Manifest</span>
            <span className="text-foreground font-mono text-xs truncate max-w-[60%]" title={season.rosterManifestPath}>
              {season.rosterManifestPath}
            </span>
          </div>
          {season.archivedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Archived</span>
              <span className="text-foreground">
                {new Date(season.archivedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

