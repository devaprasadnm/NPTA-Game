// ============================================
// Theme Constants
// ============================================

export const theme = {
  colors: {
    primary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },
    accent: {
      400: '#2DD4BF',
      500: '#14B8A6',
      600: '#0D9488',
    },
    success: '#10B981',
    warning: '#F59E0B',
    error: '#F43F5E',
  },
  fonts: {
    display: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
  },
} as const;

/** Score color based on value */
export function getScoreColor(score: number): string {
  if (score >= 10) return 'text-emerald-500';
  if (score >= 5) return 'text-amber-500';
  return 'text-slate-400';
}

/** Rank medal emoji */
export function getRankEmoji(rank: number): string {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
}
