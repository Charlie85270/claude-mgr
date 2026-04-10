'use client';

const THEME_COLORS: Record<string, { bg: string; text: string }> = {
  default: { bg: 'bg-primary/15', text: 'text-primary' },
  creative: { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  engineering: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  research: { bg: 'bg-green-500/15', text: 'text-green-400' },
  operations: { bg: 'bg-orange-500/15', text: 'text-orange-400' },
  security: { bg: 'bg-red-500/15', text: 'text-red-400' },
  data: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  design: { bg: 'bg-pink-500/15', text: 'text-pink-400' },
};

interface ThemeBadgeProps {
  theme: string;
  className?: string;
}

export default function ThemeBadge({ theme, className = '' }: ThemeBadgeProps) {
  const colors = THEME_COLORS[theme.toLowerCase()] || THEME_COLORS.default;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text} ${className}`}
    >
      {theme}
    </span>
  );
}
