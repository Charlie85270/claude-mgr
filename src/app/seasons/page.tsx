'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import SeasonCard from '@/components/Echelon/SeasonCard';

interface Season {
  id: string;
  name: string;
  theme: string;
  status: string;
  characterIds: string[];
  createdAt: string;
  archivedAt?: string;
}

type FilterTab = 'all' | 'active' | 'archived';

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  const fetchSeasons = async () => {
    try {
      setLoading(true);
      const api = (window as unknown as { electronAPI: any }).electronAPI;
      if (!api?.season) { setSeasons([]); return; }
      const result = await api.season.list();
      setSeasons(result.seasons || []);
    } catch (err) {
      console.error('Failed to fetch seasons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();

    // Subscribe to season updates
    const api = (window as unknown as { electronAPI: any }).electronAPI;
    if (!api?.season) return;
    const unsub = api.season.onUpdated((season: Season) => {
      setSeasons(prev => {
        const idx = prev.findIndex(s => s.id === season.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = season;
          return next;
        }
        return [season, ...prev];
      });
    });

    return () => { unsub(); };
  }, []);

  const filtered = seasons.filter(s => {
    if (filter === 'active') return s.status !== 'archived';
    if (filter === 'archived') return s.status === 'archived';
    return true;
  });

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: seasons.length },
    { key: 'active', label: 'Active', count: seasons.filter(s => s.status !== 'archived').length },
    { key: 'archived', label: 'Archived', count: seasons.filter(s => s.status === 'archived').length },
  ];

  return (
    <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-3rem)] flex flex-col pt-4 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 lg:mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">Seasons</h1>
          <p className="text-muted-foreground text-xs lg:text-sm mt-1 hidden sm:block">
            Manage character rosters and themed agent ensembles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSeasons}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`
              flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all whitespace-nowrap
              ${filter === tab.key
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
              }
            `}
          >
            {tab.label}
            <span className={`text-xs ${filter === tab.key ? 'text-background/70' : 'text-muted-foreground/60'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && seasons.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Loading seasons...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <p className="text-sm">No seasons found</p>
            <p className="text-xs mt-1">Seasons are spawned through the Echelon roster system</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            {filtered.map(season => (
              <SeasonCard key={season.id} season={season} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
