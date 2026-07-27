// ============================================
// Home Page — Player name, Create/Join room
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogIn, Gamepad2, Sparkles, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { usePlayerStore } from '@/stores/playerStore';
import { useSocketStore } from '@/stores/socketStore';
import { useRoomStore } from '@/stores/roomStore';
import { api } from '@/services/api';
import { MIN_DISPLAY_NAME_LENGTH, MAX_DISPLAY_NAME_LENGTH } from '@npta/shared';

export default function HomePage() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState(usePlayerStore.getState().displayName);
  const [joinCode, setJoinCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const setPlayer = usePlayerStore((s) => s.setPlayer);
  const connect = useSocketStore((s) => s.connect);
  const setRoom = useRoomStore((s) => s.setRoom);
  const addRecentRoom = useRoomStore((s) => s.addRecentRoom);
  const recentRooms = useRoomStore((s) => s.recentRooms);

  const isNameValid = playerName.trim().length >= MIN_DISPLAY_NAME_LENGTH && playerName.trim().length <= MAX_DISPLAY_NAME_LENGTH;

  async function ensureAuthenticated(): Promise<string | null> {
    // Check existing session
    const existingToken = usePlayerStore.getState().sessionToken;
    if (existingToken) {
      const validation = await api.auth.validateSession();
      if (validation.success) {
        return existingToken;
      }
    }

    // Create new guest session
    const result = await api.auth.guestLogin(playerName.trim());
    if (!result.success || !result.data) {
      setError('Failed to create session. Please try again.');
      return null;
    }

    setPlayer({
      id: result.data.player.id,
      displayName: result.data.player.displayName,
      avatarUrl: result.data.player.avatarUrl,
      token: result.data.token,
    });

    return result.data.token;
  }

  async function handleCreateRoom() {
    if (!isNameValid) return;
    setIsLoading(true);
    setError('');

    try {
      const token = await ensureAuthenticated();
      if (!token) { setIsLoading(false); return; }

      connect(token);

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const sock = useSocketStore.getState().socket;
        if (!sock) { reject(new Error('No socket')); return; }

        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);

        if (sock.connected) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        sock.once('connect', () => { clearTimeout(timeout); resolve(); });
        sock.once('connect_error', (err) => { clearTimeout(timeout); reject(err); });
      });

      const sock = useSocketStore.getState().socket;
      if (!sock) throw new Error('Not connected');

      sock.emit('room:create', {}, (res) => {
        if (res.success && res.data) {
          setRoom(res.data);
          addRecentRoom({
            code: res.data.code,
            playerCount: res.data.players.length,
            lastVisited: new Date().toISOString(),
          });
          navigate(`/room/${res.data.code}`);
        } else {
          setError(res.error ?? 'Failed to create room');
        }
        setIsLoading(false);
      });
    } catch (err) {
      setError('Failed to connect. Please try again.');
      setIsLoading(false);
    }
  }

  async function handleJoinRoom() {
    if (!isNameValid || joinCode.trim().length < 4) return;
    setIsLoading(true);
    setError('');

    try {
      const token = await ensureAuthenticated();
      if (!token) { setIsLoading(false); return; }

      connect(token);

      await new Promise<void>((resolve, reject) => {
        const sock = useSocketStore.getState().socket;
        if (!sock) { reject(new Error('No socket')); return; }

        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);

        if (sock.connected) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        sock.once('connect', () => { clearTimeout(timeout); resolve(); });
        sock.once('connect_error', (err) => { clearTimeout(timeout); reject(err); });
      });

      const sock = useSocketStore.getState().socket;
      if (!sock) throw new Error('Not connected');

      sock.emit('room:join', { roomCode: joinCode.trim().toUpperCase() }, (res) => {
        if (res.success && res.data) {
          setRoom(res.data);
          addRecentRoom({
            code: res.data.code,
            playerCount: res.data.players.length,
            lastVisited: new Date().toISOString(),
          });
          navigate(`/room/${res.data.code}`);
        } else {
          setError(res.error ?? 'Failed to join room');
        }
        setIsLoading(false);
      });
    } catch (err) {
      setError('Failed to connect. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-6 h-6 text-primary-500" />
          <span className="font-display font-bold text-lg gradient-text">NPTA</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-3"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <Sparkles className="w-4 h-4" />
              Multiplayer Word Game
            </motion.div>
            <h1 className="text-4xl sm:text-5xl font-display font-black">
              <span className="gradient-text">Name, Place</span>
              <br />
              <span className="text-slate-800 dark:text-white">Thing, Animal</span>
              <br />
              <span className="gradient-text">Profession</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
              Challenge your friends in real-time word battles!
            </p>
          </motion.div>

          {/* Name Input */}
          <Card>
            <div className="space-y-4">
              <Input
                label="Your Name"
                placeholder="Enter your display name"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError('');
                }}
                maxLength={MAX_DISPLAY_NAME_LENGTH}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-rose-500 text-center"
                >
                  {error}
                </motion.p>
              )}

              {/* Create Room */}
              <Button
                fullWidth
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={handleCreateRoom}
                isLoading={isLoading && !showJoin}
                disabled={!isNameValid}
              >
                Create Room
              </Button>

              {/* Join Room */}
              <AnimatePresence>
                {showJoin ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <Input
                      placeholder="Enter room code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="text-center font-display font-bold tracking-widest text-lg uppercase"
                    />
                    <Button
                      fullWidth
                      variant="accent"
                      size="lg"
                      icon={<LogIn className="w-5 h-5" />}
                      onClick={handleJoinRoom}
                      isLoading={isLoading && showJoin}
                      disabled={!isNameValid || joinCode.trim().length < 4}
                    >
                      Join Room
                    </Button>
                  </motion.div>
                ) : (
                  <Button
                    fullWidth
                    variant="secondary"
                    size="lg"
                    icon={<LogIn className="w-5 h-5" />}
                    onClick={() => setShowJoin(true)}
                    disabled={!isNameValid}
                  >
                    Join Room
                  </Button>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Recent Rooms */}
          {recentRooms.length > 0 && (
            <Card variant="outline" padding="sm">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Recent Rooms</p>
              </div>
              <div className="space-y-2">
                {recentRooms.slice(0, 3).map((room) => (
                  <button
                    key={room.code}
                    onClick={() => {
                      setJoinCode(room.code);
                      setShowJoin(true);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl
                               hover:bg-slate-50 dark:hover:bg-surface-dark-2 transition-colors"
                  >
                    <span className="font-display font-bold tracking-wider text-slate-700 dark:text-slate-300">
                      {room.code}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(room.lastVisited).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-600">
          Built with ❤️ • NPTA v1.0
        </p>
      </footer>
    </div>
  );
}
