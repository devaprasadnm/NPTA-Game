// ============================================
// useSocket Hook — Socket event subscriptions
// ============================================

import { useEffect } from 'react';
import { useSocketStore } from '@/stores/socketStore';
import { useRoomStore } from '@/stores/roomStore';
import { useGameStore } from '@/stores/gameStore';
import { GameStatus } from '@npta/shared';

/**
 * Subscribe to all Socket.IO events and dispatch to stores.
 * Must be called once at the app root level.
 */
export function useSocketEvents() {
  const socket = useSocketStore((s) => s.socket);
  const setRoom = useRoomStore((s) => s.setRoom);
  const addPlayer = useRoomStore((s) => s.addPlayer);
  const removePlayer = useRoomStore((s) => s.removePlayer);
  const updatePlayer = useRoomStore((s) => s.updatePlayer);
  const setSettings = useRoomStore((s) => s.setSettings);
  const setHost = useRoomStore((s) => s.setHost);
  const setGame = useGameStore((s) => s.setGame);
  const setRound = useGameStore((s) => s.setRound);
  const setTimeRemaining = useGameStore((s) => s.setTimeRemaining);
  const setRoundResult = useGameStore((s) => s.setRoundResult);
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);
  const setWinner = useGameStore((s) => s.setWinner);
  const setCountdown = useGameStore((s) => s.setCountdown);
  const addSubmittedPlayer = useGameStore((s) => s.addSubmittedPlayer);
  const updateRoundStatus = useGameStore((s) => s.updateRoundStatus);
  const setChallenges = useGameStore((s) => s.setChallenges);
  const setVotingTimeRemaining = useGameStore((s) => s.setVotingTimeRemaining);
  const setVotingPhase = useGameStore((s) => s.setVotingPhase);
  const resetVoting = useGameStore((s) => s.resetVoting);

  useEffect(() => {
    if (!socket) return;

    // Room events
    socket.on('room:joined', (room) => setRoom(room));
    socket.on('room:player_joined', (player) => addPlayer(player));
    socket.on('room:player_left', ({ playerId }) => removePlayer(playerId));
    socket.on('room:player_reconnected', ({ playerId }) =>
      updatePlayer(playerId, { isOnline: true }),
    );
    socket.on('room:host_changed', ({ newHostId }) => setHost(newHostId));
    socket.on('room:settings_updated', (settings) => setSettings(settings));
    socket.on('room:player_ready', ({ playerId, isReady }) =>
      updatePlayer(playerId, { isReady }),
    );

    // Game events
    socket.on('game:started', (game) => setGame(game));
    socket.on('game:round_starting', ({ round, countdown }) => {
      setRound(round);
      setCountdown(countdown);
      const currentGame = useGameStore.getState().game;
      if (currentGame) {
        setGame({ ...currentGame, status: GameStatus.ROUND_STARTING, currentRound: round.roundNumber });
      }
    });
    socket.on('game:round_active', ({ round }) => {
      // Use updateRoundStatus (NOT setRound) to avoid wiping answers typed during countdown
      updateRoundStatus(round);
      setCountdown(0);
      const currentGame = useGameStore.getState().game;
      if (currentGame) {
        setGame({ ...currentGame, status: GameStatus.ROUND_ACTIVE, currentRound: round.roundNumber });
      }
    });
    socket.on('game:timer_update', ({ remaining }) => setTimeRemaining(remaining));
    socket.on('game:player_submitted', ({ playerId }) => addSubmittedPlayer(playerId));
    socket.on('game:round_completed', (result) => {
      setRoundResult(result);
      // Update game status to ROUND_REVIEW so the review UI renders
      const currentGame = useGameStore.getState().game;
      if (currentGame) {
        setGame({ ...currentGame, status: GameStatus.ROUND_REVIEW });
      }
    });
    socket.on('game:leaderboard', ({ leaderboard }) => setLeaderboard(leaderboard));
    socket.on('game:finished', ({ winner, leaderboard }) => {
      setWinner(winner);
      setLeaderboard(leaderboard);
      // Update game status to GAME_FINISHED so navigation to winner page triggers
      const currentGame = useGameStore.getState().game;
      if (currentGame) {
        setGame({ ...currentGame, status: GameStatus.GAME_FINISHED });
      }
    });

    // Voting / Challenge events
    socket.on('game:voting_started', ({ roundResult, duration }) => {
      setRoundResult(roundResult);
      setVotingPhase(true);
      setVotingTimeRemaining(duration);
      setChallenges({});
      const currentGame = useGameStore.getState().game;
      if (currentGame) {
        setGame({ ...currentGame, status: GameStatus.ROUND_VOTING });
      }
    });
    socket.on('game:challenge_update', ({ challenges }) => {
      setChallenges(challenges);
    });
    socket.on('game:voting_timer', ({ remaining }) => {
      setVotingTimeRemaining(remaining);
    });
    socket.on('game:voting_ended', ({ roundResult }) => {
      setRoundResult(roundResult);
      resetVoting();
      const currentGame = useGameStore.getState().game;
      if (currentGame) {
        setGame({ ...currentGame, status: GameStatus.ROUND_REVIEW });
      }
    });

    // Session restore
    socket.on('session:restored', ({ room }) => {
      setRoom(room);
    });

    // Error handling
    socket.on('error', (err) => {
      console.error('[Socket Error]', err.code, err.message);
    });

    return () => {
      socket.off('room:joined');
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('room:player_reconnected');
      socket.off('room:host_changed');
      socket.off('room:settings_updated');
      socket.off('room:player_ready');
      socket.off('game:started');
      socket.off('game:round_starting');
      socket.off('game:round_active');
      socket.off('game:timer_update');
      socket.off('game:player_submitted');
      socket.off('game:round_completed');
      socket.off('game:leaderboard');
      socket.off('game:finished');
      socket.off('game:voting_started');
      socket.off('game:challenge_update');
      socket.off('game:voting_timer');
      socket.off('game:voting_ended');
      socket.off('session:restored');
      socket.off('error');
    };
  }, [socket, setRoom, addPlayer, removePlayer, updatePlayer, setSettings, setHost, setGame, setRound, setTimeRemaining, setRoundResult, setLeaderboard, setWinner, setCountdown, addSubmittedPlayer, updateRoundStatus, setChallenges, setVotingTimeRemaining, setVotingPhase, resetVoting]);
}

