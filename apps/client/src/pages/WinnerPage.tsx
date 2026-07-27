// ============================================
// Winner Page — Podium, confetti, play again
// ============================================

import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Podium } from '@/components/game/Podium';
import { Confetti } from '@/components/game/Confetti';
import { useGameStore } from '@/stores/gameStore';
import { useRoomStore } from '@/stores/roomStore';
import { usePlayerStore } from '@/stores/playerStore';
import { getRankEmoji } from '@/styles/theme';

export default function WinnerPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const winner = useGameStore((s) => s.winner);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const resetGame = useGameStore((s) => s.resetGame);
  const clearRoom = useRoomStore((s) => s.clearRoom);
  const playerId = usePlayerStore((s) => s.id);

  const isWinner = winner?.playerId === playerId;

  function handlePlayAgain() {
    resetGame();
    navigate(`/room/${code}`);
  }

  function handleGoHome() {
    resetGame();
    clearRoom();
    navigate('/');
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 dark:bg-surface-dark relative overflow-hidden">
      <Confetti />

      {/* Decorative */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-lg mx-auto w-full">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-display font-black gradient-text mb-2">
            Game Over!
          </h1>
          {isWinner && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-amber-500 font-semibold"
            >
              🎉 You won! Congratulations! 🎉
            </motion.p>
          )}
        </motion.div>

        {/* Podium */}
        {leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Podium leaderboard={leaderboard} />
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <Card className="w-full mb-6">
          <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-4 text-center">
            Final Standings
          </h3>
          <div className="space-y-2">
            {leaderboard.map((entry, idx) => (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className={`
                  flex items-center gap-3 p-3 rounded-xl
                  ${entry.playerId === playerId
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                    : 'bg-slate-50 dark:bg-surface-dark-3'
                  }
                `}
              >
                <span className="text-xl w-8 text-center font-bold">
                  {getRankEmoji(entry.rank)}
                </span>
                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {entry.playerName[0]?.toUpperCase()}
                </div>
                <p className="flex-1 font-semibold text-slate-800 dark:text-white truncate">
                  {entry.playerName}
                  {entry.playerId === playerId && (
                    <span className="text-primary-500 text-sm ml-1">(You)</span>
                  )}
                </p>
                <p className="font-display font-bold text-primary-500">
                  {entry.totalScore} <span className="text-xs text-slate-400">pts</span>
                </p>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            icon={<Home className="w-5 h-5" />}
            onClick={handleGoHome}
          >
            Home
          </Button>
          <Button
            size="lg"
            fullWidth
            icon={<RotateCcw className="w-5 h-5" />}
            onClick={handlePlayAgain}
          >
            Play Again
          </Button>
        </div>
      </main>
    </div>
  );
}
