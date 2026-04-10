'use client';

import { Users, Calendar, Archive, Play, Pause } from 'lucide-react';
import ThemeBadge from './ThemeBadge';
import Link from 'next/link';

interface Season {
  id: string;
  name: string;
  theme: string;
  status: string;
  characterIds: string[];
  createdAt: string;
  archivedAt?: string;
}

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  active: { dot: 'bg-green-500', label: 'Active' },
  spawning: { dot: 'bg-yellow-500', label: 'Spawning' },
  paused: { dot: 'bg-orange-500', label: 'Paused' },
  archived: { dot: 'bg-muted-foreground', label: 'Archived' },
  restoring: { dot: 'bg-blue-500', label: 'Restoring' },
};

interface SeasonCardProps {
  season: Season;
}

export default function SeasonCard({ season }: SeasonCardProps) {
  const statusStyle = STATUS_STYLES[season.status] || STATUS_STYLES.active;
  const createdDate = new Date(season.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/seasons/${season.id}`}
      className="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-card/80 transition-all duration-150 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground truncate">{season.name}</h3>
        <ThemeBadge theme={season.theme} />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2 w-2">
          <span className={`${season.status === 'active' ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full ${statusStyle.dot} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${statusStyle.dot}`} />
        </span>
        <span className="text-xs text-muted-foreground">{statusStyle.label}</span>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{season.characterIds.length} character{season.characterIds.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{createdDate}</span>
        </div>
      </div>
    </Link>
  );
}
