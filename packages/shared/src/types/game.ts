// ============================================
// Game Types
// ============================================

export enum GameStatus {
  WAITING = 'WAITING',
  ROUND_STARTING = 'ROUND_STARTING',
  ROUND_ACTIVE = 'ROUND_ACTIVE',
  ROUND_VOTING = 'ROUND_VOTING',
  ROUND_REVIEW = 'ROUND_REVIEW',
  NEXT_ROUND = 'NEXT_ROUND',
  GAME_FINISHED = 'GAME_FINISHED',
}

export enum RoundStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum Category {
  NAME = 'NAME',
  PLACE = 'PLACE',
  THING = 'THING',
  ANIMAL = 'ANIMAL',
  PROFESSION = 'PROFESSION',
}

export const CATEGORIES = [
  Category.NAME,
  Category.PLACE,
  Category.THING,
  Category.ANIMAL,
  Category.PROFESSION,
] as const;

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.NAME]: 'Name',
  [Category.PLACE]: 'Place',
  [Category.THING]: 'Thing',
  [Category.ANIMAL]: 'Animal',
  [Category.PROFESSION]: 'Profession',
};

export const CATEGORY_PLACEHOLDERS: Record<Category, string> = {
  [Category.NAME]: 'e.g. Alice',
  [Category.PLACE]: 'e.g. Amsterdam',
  [Category.THING]: 'e.g. Apple',
  [Category.ANIMAL]: 'e.g. Antelope',
  [Category.PROFESSION]: 'e.g. Architect',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  [Category.NAME]: '👤',
  [Category.PLACE]: '🌍',
  [Category.THING]: '📦',
  [Category.ANIMAL]: '🐾',
  [Category.PROFESSION]: '💼',
};

export interface RoundAnswers {
  [Category.NAME]: string;
  [Category.PLACE]: string;
  [Category.THING]: string;
  [Category.ANIMAL]: string;
  [Category.PROFESSION]: string;
}

export interface AnswerResult {
  category: Category;
  value: string;
  isValid: boolean;
  score: number;
  /** IDs of players who flagged/challenged this answer */
  challengedBy: string[];
  /** Whether this answer was invalidated by majority vote */
  wasChallenged: boolean;
}

export interface PlayerRoundResult {
  playerId: string;
  playerName: string;
  answers: AnswerResult[];
  roundScore: number;
}

export interface RoundResult {
  roundNumber: number;
  letter: string;
  playerResults: PlayerRoundResult[];
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  avatarUrl: string | null;
  totalScore: number;
  rank: number;
}

export interface GameResult {
  gameId: string;
  rounds: RoundResult[];
  leaderboard: LeaderboardEntry[];
  winner: LeaderboardEntry;
}

export interface RoundInfo {
  id: string;
  roundNumber: number;
  letter: string;
  status: RoundStatus;
  duration: number;
  startedAt: string | null;
  endedAt: string | null;
}

export interface GameInfo {
  id: string;
  roomId: string;
  status: GameStatus;
  currentRound: number;
  totalRounds: number;
  usedLetters: string[];
  startedAt: string | null;
  finishedAt: string | null;
}
