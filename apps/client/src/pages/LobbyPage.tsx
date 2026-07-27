// ============================================
// Lobby Page — Room code, players, settings, start
// ============================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, LogOut, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RoomCode } from '@/components/room/RoomCode';
import { PlayerCard } from '@/components/room/PlayerCard';
import { useRoomStore } from '@/stores/roomStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useSocketStore } from '@/stores/socketStore';
import { useGameStore } from '@/stores/gameStore';

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const room = useRoomStore((s) => s.room);
  const players = useRoomStore((s) => s.players);
  const settings = useRoomStore((s) => s.settings);
  const clearRoom = useRoomStore((s) => s.clearRoom);
  const playerId = usePlayerStore((s) => s.id);
  const socket = useSocketStore((s) => s.socket);
  const game = useGameStore((s) => s.game);

  const isHost = room?.hostId === playerId;
  const onlinePlayers = players.filter((p) => p.isOnline);
  const canStart = onlinePlayers.length >= settings.minPlayers;

  // Navigate to game when game starts
  useEffect(() => {
    if (game) {
      navigate(`/game/${code}`);
    }
  }, [game, code, navigate]);

  function handleStartGame() {
    socket?.emit('game:start');
  }

  function handleLeaveRoom() {
    socket?.emit('room:leave');
    clearRoom();
    navigate('/');
  }

  function handleUpdateSettings(key: string, value: number) {
    socket?.emit('room:settings', {
      settings: { [key]: value },
    });
  }

  function handleToggleReady() {
    const currentPlayer = players.find((p) => p.id === playerId);
    socket?.emit('player:ready', { isReady: !currentPlayer?.isReady });
  }

  if (!room || !code) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Card>
          <p className="text-slate-500">Room not found</p>
          <Button variant="secondary" onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  const joinUrl = `${window.location.origin}/join/${code}`;

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 dark:bg-surface-dark">
      {/* Decorative */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary-500/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 glass-light p-4 flex items-center justify-between safe-bottom">
        <button onClick={handleLeaveRoom} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Room Code</p>
          <p className="font-display font-bold text-lg tracking-widest text-slate-800 dark:text-white">{code}</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl transition-colors ${showSettings ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-lg mx-auto w-full space-y-4">
        {/* Room Code & QR */}
        <Card padding="md">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">
                {onlinePlayers.length}/{settings.maxPlayers} Players
              </span>
            </div>
            <RoomCode code={code} />
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
            >
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            <AnimatePresence>
              {showQR && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-white rounded-2xl">
                    <QRCodeSVG value={joinUrl} size={160} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Settings Panel (host only) */}
        <AnimatePresence>
          {showSettings && isHost && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card>
                <h3 className="font-display font-bold text-lg text-slate-800 dark:text-white mb-4">Game Settings</h3>
                <div className="space-y-4">
                  <SettingRow
                    label="Rounds"
                    value={settings.rounds}
                    min={1}
                    max={26}
                    onChange={(v) => handleUpdateSettings('rounds', v)}
                  />
                  <SettingRow
                    label="Round Duration"
                    value={settings.roundDuration}
                    min={15}
                    max={180}
                    step={15}
                    suffix="s"
                    onChange={(v) => handleUpdateSettings('roundDuration', v)}
                  />
                  <SettingRow
                    label="Min Players"
                    value={settings.minPlayers}
                    min={1}
                    max={20}
                    onChange={(v) => handleUpdateSettings('minPlayers', v)}
                  />
                  <SettingRow
                    label="Max Players"
                    value={settings.maxPlayers}
                    min={1}
                    max={20}
                    onChange={(v) => handleUpdateSettings('maxPlayers', v)}
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player List */}
        <Card>
          <h3 className="font-display font-bold text-base text-slate-800 dark:text-white mb-3">Players</h3>
          <div className="space-y-2">
            <AnimatePresence>
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isCurrentUser={player.id === playerId}
                />
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </main>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 p-4 glass-light safe-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          {!isHost && (
            <Button
              fullWidth
              variant={players.find((p) => p.id === playerId)?.isReady ? 'secondary' : 'accent'}
              size="lg"
              onClick={handleToggleReady}
            >
              {players.find((p) => p.id === playerId)?.isReady ? 'Not Ready' : 'Ready!'}
            </Button>
          )}
          {isHost && (
            <Button
              fullWidth
              size="lg"
              icon={<Play className="w-5 h-5" />}
              onClick={handleStartGame}
              disabled={!canStart}
            >
              {canStart ? 'Start Game' : `Need ${settings.minPlayers - onlinePlayers.length} more`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Settings Row Component ----
function SettingRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-surface-dark-3 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          disabled={value <= min}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <span className="w-12 text-center font-bold text-slate-800 dark:text-white">
          {value}{suffix}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-surface-dark-3 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
          disabled={value >= max}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
