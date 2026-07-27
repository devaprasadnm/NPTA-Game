// ============================================
// Game Store — Game state, round, answers, scores
// ============================================

import { create } from 'zustand';
import type {
  GameInfo,
  RoundInfo,
  RoundResult,
  LeaderboardEntry,
  RoundAnswers,
} from '@npta/shared';
import { Category } from '@npta/shared';

interface GameState {
  game: GameInfo | null;
  currentRound: RoundInfo | null;
  timeRemaining: number;
  answers: RoundAnswers;
  hasSubmitted: boolean;
  submittedPlayers: Set<string>;
  roundResult: RoundResult | null;
  leaderboard: LeaderboardEntry[];
  winner: LeaderboardEntry | null;
  countdown: number;

  // Voting / Challenge state
  /** key = "playerId:CATEGORY", value = array of voter player IDs */
  challenges: Record<string, string[]>;
  votingTimeRemaining: number;
  isVotingPhase: boolean;
  challengeDone: boolean;

  setGame: (game: GameInfo) => void;
  setRound: (round: RoundInfo) => void;
  setTimeRemaining: (time: number) => void;
  setAnswer: (category: Category, value: string) => void;
  setAnswers: (answers: RoundAnswers) => void;
  markSubmitted: () => void;
  addSubmittedPlayer: (playerId: string) => void;
  setRoundResult: (result: RoundResult) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  setWinner: (winner: LeaderboardEntry) => void;
  setCountdown: (countdown: number) => void;
  updateRoundStatus: (round: RoundInfo) => void;
  resetRound: () => void;
  resetGame: () => void;

  // Voting actions
  setChallenges: (challenges: Record<string, string[]>) => void;
  setVotingTimeRemaining: (time: number) => void;
  setVotingPhase: (isVoting: boolean) => void;
  markChallengeDone: () => void;
  resetVoting: () => void;
}

const EMPTY_ANSWERS: RoundAnswers = {
  [Category.NAME]: '',
  [Category.PLACE]: '',
  [Category.THING]: '',
  [Category.ANIMAL]: '',
  [Category.PROFESSION]: '',
};

export const useGameStore = create<GameState>((set) => ({
  game: null,
  currentRound: null,
  timeRemaining: 0,
  answers: { ...EMPTY_ANSWERS },
  hasSubmitted: false,
  submittedPlayers: new Set(),
  roundResult: null,
  leaderboard: [],
  winner: null,
  countdown: 0,
  challenges: {},
  votingTimeRemaining: 0,
  isVotingPhase: false,
  challengeDone: false,

  setGame: (game) => set({ game }),

  setRound: (round) =>
    set({
      currentRound: round,
      answers: { ...EMPTY_ANSWERS },
      hasSubmitted: false,
      submittedPlayers: new Set(),
      roundResult: null,
      challenges: {},
      votingTimeRemaining: 0,
      isVotingPhase: false,
      challengeDone: false,
    }),

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  setAnswer: (category, value) =>
    set((state) => ({
      answers: { ...state.answers, [category]: value },
    })),

  setAnswers: (answers) => set({ answers }),

  markSubmitted: () => set({ hasSubmitted: true }),

  addSubmittedPlayer: (playerId) =>
    set((state) => {
      const newSet = new Set(state.submittedPlayers);
      newSet.add(playerId);
      return { submittedPlayers: newSet };
    }),

  setRoundResult: (result) => set({ roundResult: result }),

  setLeaderboard: (leaderboard) => set({ leaderboard }),

  setWinner: (winner) => set({ winner }),

  setCountdown: (countdown) => set({ countdown }),

  updateRoundStatus: (round) =>
    set({
      currentRound: round,
    }),

  resetRound: () =>
    set({
      currentRound: null,
      answers: { ...EMPTY_ANSWERS },
      hasSubmitted: false,
      submittedPlayers: new Set(),
      roundResult: null,
      timeRemaining: 0,
      countdown: 0,
      challenges: {},
      votingTimeRemaining: 0,
      isVotingPhase: false,
      challengeDone: false,
    }),

  resetGame: () =>
    set({
      game: null,
      currentRound: null,
      timeRemaining: 0,
      answers: { ...EMPTY_ANSWERS },
      hasSubmitted: false,
      submittedPlayers: new Set(),
      roundResult: null,
      leaderboard: [],
      winner: null,
      countdown: 0,
      challenges: {},
      votingTimeRemaining: 0,
      isVotingPhase: false,
      challengeDone: false,
    }),

  // Voting actions
  setChallenges: (challenges) => set({ challenges }),
  setVotingTimeRemaining: (time) => set({ votingTimeRemaining: time }),
  setVotingPhase: (isVoting) => set({ isVotingPhase: isVoting }),
  markChallengeDone: () => set({ challengeDone: true }),
  resetVoting: () =>
    set({
      challenges: {},
      votingTimeRemaining: 0,
      isVotingPhase: false,
      challengeDone: false,
    }),
}));

