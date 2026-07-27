// ============================================
// PlayerCard — Player avatar, name, status
// ============================================

import { motion } from 'framer-motion';
import { Crown, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { PlayerInfo } from '@npta/shared';

interface PlayerCardProps {
  player: PlayerInfo;
  isCurrentUser?: boolean;
}

export function PlayerCard({ player, isCurrentUser = false }: PlayerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`
        flex items-center gap-3 p-3 rounded-2xl transition-all
        ${isCurrentUser
          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
          : 'bg-slate-50 dark:bg-surface-dark-2 border border-slate-100 dark:border-slate-800'
        }
        ${!player.isOnline ? 'opacity-50' : ''}
      `}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white font-bold text-lg">
          {player.displayName[0]?.toUpperCase()}
        </div>
        {player.isHost && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
            <Crown className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-800 dark:text-white truncate">
            {player.displayName}
          </p>
          {isCurrentUser && (
            <Badge variant="primary">You</Badge>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {player.isReady && (
          <Badge variant="success" dot>Ready</Badge>
        )}
        {player.isOnline ? (
          <Wifi className="w-4 h-4 text-emerald-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-slate-400" />
        )}
      </div>
    </motion.div>
  );
}
