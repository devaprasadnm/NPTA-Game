// ============================================
// Podium — Top 3 winner display
// ============================================

import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import type { LeaderboardEntry } from '@npta/shared';
import { getRankEmoji } from '@/styles/theme';

interface PodiumProps {
  leaderboard: LeaderboardEntry[];
}

export function Podium({ leaderboard }: PodiumProps) {
  const top3 = leaderboard.slice(0, 3);
  // Reorder for visual: [2nd, 1st, 3rd]
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];
  const heights = [140, 180, 100]; // 2nd, 1st, 3rd

  if (top3.length < 2) {
    // Only one player, just show them as winner
    const winner = top3[0];
    if (!winner) return null;
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <Crown className="w-12 h-12 text-amber-400" />
        <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-3xl font-bold text-white">
          {winner.playerName[0]?.toUpperCase()}
        </div>
        <p className="text-xl font-display font-bold text-slate-800 dark:text-white">{winner.playerName}</p>
        <p className="text-3xl font-display font-black gradient-text">{winner.totalScore} pts</p>
      </motion.div>
    );
  }

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {podiumOrder.map((entry, index) => {
        if (!entry) return null;
        const actualRank = entry.rank;
        const height = heights[index] ?? 100;
        const isFirst = actualRank === 1;

        return (
          <motion.div
            key={entry.playerId}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 + 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.2 + 0.5, type: 'spring' }}
              className={`
                relative rounded-full flex items-center justify-center font-bold text-white
                ${isFirst ? 'w-16 h-16 sm:w-20 sm:h-20 text-2xl' : 'w-12 h-12 sm:w-16 sm:h-16 text-xl'}
                gradient-bg
              `}
            >
              {entry.playerName[0]?.toUpperCase()}
              {isFirst && (
                <motion.div
                  initial={{ scale: 0, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute -top-4"
                >
                  <Crown className="w-8 h-8 text-amber-400 drop-shadow-lg" />
                </motion.div>
              )}
            </motion.div>

            {/* Name */}
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[80px] sm:max-w-[100px]">
              {entry.playerName}
            </p>

            {/* Score */}
            <p className={`text-sm font-bold ${isFirst ? 'gradient-text text-lg' : 'text-slate-600 dark:text-slate-300'}`}>
              {entry.totalScore} pts
            </p>

            {/* Podium block */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height }}
              transition={{ delay: index * 0.2, duration: 0.6, ease: 'easeOut' }}
              className={`
                w-20 sm:w-28 rounded-t-2xl flex items-start justify-center pt-4
                ${isFirst
                  ? 'gradient-bg'
                  : actualRank === 2
                    ? 'bg-slate-300 dark:bg-slate-600'
                    : 'bg-amber-700/60 dark:bg-amber-900/40'
                }
              `}
            >
              <span className="text-2xl font-display font-black text-white/80">
                {getRankEmoji(actualRank)}
              </span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
