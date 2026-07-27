// ============================================
// Game Engine — Core game state machine
// ============================================

import type { Server as SocketServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  RoundAnswers,
  LeaderboardEntry,
  RoundResult,
  GameInfo,
  RoundInfo,
  ChallengeUpdate,
} from '@npta/shared';
import {
  GameStatus,
  RoundStatus,
  RoomStatus,
  ROUND_START_COUNTDOWN,
  VOTING_DURATION,
  FINAL_RESULTS_DURATION,
  sleep,
} from '@npta/shared';
import { prisma } from '../lib/prisma.js';
import { roomManager } from './RoomManager.js';
import { LetterGenerator } from './LetterGenerator.js';
import { ScoringEngine } from './ScoringEngine.js';
import { timerManager } from './TimerManager.js';
import { logger } from '../utils/logger.js';

type GameIO = SocketServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/** Tracks which players have submitted in the current round */
interface RoundSubmissions {
  /** playerId → answers */
  submitted: Map<string, RoundAnswers>;
  totalExpected: number;
}

/** Metadata needed to finalize voting for a room */
interface VotingRoundMeta {
  gameId: string;
  roundId: string;
  roundNumber: number;
  letter: string;
}

export class GameEngine {
  private io: GameIO;
  /** roomCode → RoundSubmissions */
  private submissions: Map<string, RoundSubmissions> = new Map();
  /** roomCode → accumulated scores (playerId → totalScore) */
  private scores: Map<string, Map<string, number>> = new Map();
  /** Rooms currently processing endRound (prevents double-fire) */
  private endingRounds: Set<string> = new Set();
  /** roomCode → provisional RoundResult (during voting phase) */
  private provisionalResults: Map<string, RoundResult> = new Map();
  /** roomCode → Map<"targetPlayerId:CATEGORY" → Set<voterPlayerId>> */
  private challenges: Map<string, Map<string, Set<string>>> = new Map();
  /** roomCode → Set<playerId> who confirmed they are done voting */
  private challengeDone: Map<string, Set<string>> = new Map();
  /** roomCode → round metadata needed to finalize after voting */
  private votingRoundMeta: Map<string, VotingRoundMeta> = new Map();
  /** Rooms currently ending voting (prevents double-fire) */
  private endingVoting: Set<string> = new Set();

  constructor(io: GameIO) {
    this.io = io;
  }

  // ---- Start Game ----

  async startGame(roomCode: string, playerId: string): Promise<void> {
    const room = roomManager.getRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostId !== playerId) throw new Error('NOT_HOST');

    const onlinePlayers = roomManager.getOnlinePlayers(roomCode);
    if (onlinePlayers.length < room.settings.minPlayers) {
      throw new Error('NOT_ENOUGH_PLAYERS');
    }

    // Create game in DB
    const game = await prisma.game.create({
      data: {
        roomId: room.id,
        status: 'WAITING',
        totalRounds: room.settings.rounds,
        usedLetters: '',
      },
    });

    // Update room state
    roomManager.setRoomStatus(roomCode, RoomStatus.IN_GAME);
    roomManager.setGameId(roomCode, game.id);

    await prisma.room.update({
      where: { id: room.id },
      data: { status: 'IN_GAME' },
    });

    // Initialize score tracking
    const scoreMap = new Map<string, number>();
    for (const player of onlinePlayers) {
      scoreMap.set(player.id, 0);
    }
    this.scores.set(roomCode, scoreMap);

    const gameInfo: GameInfo = {
      id: game.id,
      roomId: room.id,
      status: GameStatus.WAITING,
      currentRound: 0,
      totalRounds: room.settings.rounds,
      usedLetters: [],
      startedAt: new Date().toISOString(),
      finishedAt: null,
    };

    // Broadcast game started
    this.io.to(roomCode).emit('game:started', gameInfo);

    logger.info('GameEngine', `Game started in room ${roomCode} with ${onlinePlayers.length} players`);

    // Start first round
    await this.startNextRound(roomCode, game.id);
  }

  // ---- Round Lifecycle ----

  private async startNextRound(roomCode: string, gameId: string): Promise<void> {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) return;

    const nextRoundNumber = game.currentRound + 1;

    if (nextRoundNumber > game.totalRounds) {
      await this.finishGame(roomCode, gameId);
      return;
    }

    // Pick a letter
    const usedLettersArray = typeof game.usedLetters === 'string' ? game.usedLetters.split(',').filter(Boolean) : (game.usedLetters as string[]);
    const letter = LetterGenerator.pickLetter(usedLettersArray);
    const updatedLettersArray = [...usedLettersArray, letter];
    const usedLettersStr = updatedLettersArray.join(',');

    // Update game in DB
    await prisma.game.update({
      where: { id: gameId },
      data: {
        currentRound: nextRoundNumber,
        status: 'ROUND_STARTING',
        usedLetters: usedLettersStr,
      },
    });

    // Create round in DB
    const round = await prisma.round.create({
      data: {
        gameId,
        roundNumber: nextRoundNumber,
        letter,
        status: 'PENDING',
        duration: room.settings.roundDuration,
      },
    });

    const roundInfo: RoundInfo = {
      id: round.id,
      roundNumber: nextRoundNumber,
      letter,
      status: RoundStatus.PENDING,
      duration: room.settings.roundDuration,
      startedAt: null,
      endedAt: null,
    };

    // Initialize submissions tracking
    const onlinePlayers = roomManager.getOnlinePlayers(roomCode);
    this.submissions.set(roomCode, {
      submitted: new Map(),
      totalExpected: onlinePlayers.length,
    });

    // Broadcast round starting with countdown
    this.io.to(roomCode).emit('game:round_starting', {
      round: roundInfo,
      countdown: ROUND_START_COUNTDOWN,
    });

    logger.info('GameEngine', `Round ${nextRoundNumber} starting in room ${roomCode}, letter: ${letter}`);

    // Wait for countdown
    await sleep(ROUND_START_COUNTDOWN * 1000);

    // Start the round
    await prisma.round.update({
      where: { id: round.id },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });

    roundInfo.status = RoundStatus.ACTIVE;
    roundInfo.startedAt = new Date().toISOString();

    this.io.to(roomCode).emit('game:round_active', { round: roundInfo });

    // Start timer
    timerManager.startTimer(
      roomCode,
      room.settings.roundDuration,
      (remaining) => {
        this.io.to(roomCode).emit('game:timer_update', { remaining });
      },
      () => {
        void this.endRound(roomCode, gameId, round.id, letter, nextRoundNumber);
      },
    );
  }

  // ---- Submit Answers ----

  async submitAnswers(roomCode: string, playerId: string, answers: RoundAnswers): Promise<void> {
    const submission = this.submissions.get(roomCode);
    if (!submission) throw new Error('ROUND_NOT_ACTIVE');
    if (submission.submitted.has(playerId)) throw new Error('ALREADY_SUBMITTED');

    submission.submitted.set(playerId, answers);

    // Notify other players that this player submitted
    this.io.to(roomCode).emit('game:player_submitted', { playerId });

    logger.info('GameEngine', `Player ${playerId} submitted in room ${roomCode} (${submission.submitted.size}/${submission.totalExpected})`);

    // Check if all players have submitted
    if (submission.submitted.size >= submission.totalExpected) {
      timerManager.stopTimer(roomCode);

      const room = roomManager.getRoom(roomCode);
      if (!room?.gameId) return;

      const game = await prisma.game.findUnique({ where: { id: room.gameId } });
      if (!game) return;

      const round = await prisma.round.findFirst({
        where: { gameId: game.id, roundNumber: game.currentRound },
      });
      if (!round) return;

      // Fire-and-forget: don't await endRound here so the submit callback
      // returns immediately. Otherwise the callback arrives after the next
      // round has started, re-setting hasSubmitted = true on the client.
      void this.endRound(roomCode, game.id, round.id, round.letter, round.roundNumber);
    }
  }

  // ---- End Round ----

  private async endRound(
    roomCode: string,
    gameId: string,
    roundId: string,
    letter: string,
    roundNumber: number,
  ): Promise<void> {
    // Guard against double-fire (timer + all-submitted race)
    if (this.endingRounds.has(roomCode)) {
      logger.info('GameEngine', `endRound already in progress for room ${roomCode}, skipping`);
      return;
    }
    this.endingRounds.add(roomCode);

    const submission = this.submissions.get(roomCode);
    if (!submission) {
      this.endingRounds.delete(roomCode);
      return;
    }

    // Collect all answers (including empty for non-submitters)
    const onlinePlayers = roomManager.getOnlinePlayers(roomCode);
    const playerAnswers = onlinePlayers.map((player) => {
      const answers = submission.submitted.get(player.id) ?? {
        NAME: '',
        PLACE: '',
        THING: '',
        ANIMAL: '',
        PROFESSION: '',
      };
      return {
        playerId: player.id,
        playerName: player.displayName,
        answers: answers as unknown as Record<string, string>,
      };
    });

    // Calculate scores
    const roundResults = ScoringEngine.calculateRoundScores(playerAnswers, letter);

    // Save answers and scores to DB
    for (const result of roundResults) {
      for (const answer of result.answers) {
        await prisma.answer.upsert({
          where: {
            roundId_playerId_category: {
              roundId,
              playerId: result.playerId,
              category: answer.category,
            },
          },
          create: {
            roundId,
            playerId: result.playerId,
            category: answer.category,
            value: answer.value,
            isValid: answer.isValid,
            score: answer.score,
          },
          update: {
            value: answer.value,
            isValid: answer.isValid,
            score: answer.score,
          },
        });
      }

      // Update accumulated scores
      const scoreMap = this.scores.get(roomCode);
      if (scoreMap) {
        const current = scoreMap.get(result.playerId) ?? 0;
        scoreMap.set(result.playerId, current + result.roundScore);
      }
    }

    // Mark round as completed
    await prisma.round.update({
      where: { id: roundId },
      data: { status: 'COMPLETED', endedAt: new Date() },
    });

    await prisma.game.update({
      where: { id: gameId },
      data: { status: 'ROUND_VOTING' },
    });

    // Build provisional round result (scores may change after voting)
    const roundResult: RoundResult = {
      roundNumber,
      letter,
      playerResults: roundResults,
    };

    logger.info('GameEngine', `Round ${roundNumber} completed in room ${roomCode}, starting voting phase`);

    // Clean up submissions
    this.submissions.delete(roomCode);
    this.endingRounds.delete(roomCode);

    // Start voting phase
    this.startVoting(roomCode, gameId, roundId, roundNumber, letter, roundResult);
  }

  // ---- Voting Phase ----

  private startVoting(
    roomCode: string,
    gameId: string,
    roundId: string,
    roundNumber: number,
    letter: string,
    roundResult: RoundResult,
  ): void {
    // Store provisional result and metadata
    this.provisionalResults.set(roomCode, roundResult);
    this.challenges.set(roomCode, new Map());
    this.challengeDone.set(roomCode, new Set());
    this.votingRoundMeta.set(roomCode, { gameId, roundId, roundNumber, letter });

    // Broadcast voting phase started with provisional results
    this.io.to(roomCode).emit('game:voting_started', {
      roundResult,
      duration: VOTING_DURATION,
    });

    // Also emit the round_completed for backwards compat / review rendering
    this.io.to(roomCode).emit('game:round_completed', roundResult);

    logger.info('GameEngine', `Voting phase started in room ${roomCode} for ${VOTING_DURATION}s`);

    // Start voting timer using a separate key to avoid collision with round timer
    const votingTimerKey = `${roomCode}:voting`;
    timerManager.startTimer(
      votingTimerKey,
      VOTING_DURATION,
      (remaining) => {
        this.io.to(roomCode).emit('game:voting_timer', { remaining });
      },
      () => {
        void this.endVoting(roomCode);
      },
    );
  }

  async challengeAnswer(
    roomCode: string,
    voterPlayerId: string,
    targetPlayerId: string,
    category: string,
  ): Promise<void> {
    const challengeMap = this.challenges.get(roomCode);
    if (!challengeMap) throw new Error('VOTING_NOT_ACTIVE');

    // Cannot challenge your own answer
    if (voterPlayerId === targetPlayerId) throw new Error('CANNOT_CHALLENGE_OWN');

    const key = `${targetPlayerId}:${category}`;
    let voters = challengeMap.get(key);
    if (!voters) {
      voters = new Set();
      challengeMap.set(key, voters);
    }

    // Toggle: if already voted, remove the vote
    if (voters.has(voterPlayerId)) {
      voters.delete(voterPlayerId);
      logger.info('GameEngine', `Player ${voterPlayerId} removed challenge on ${key} in room ${roomCode}`);
    } else {
      voters.add(voterPlayerId);
      logger.info('GameEngine', `Player ${voterPlayerId} challenged ${key} in room ${roomCode}`);
    }

    // Broadcast updated challenge state
    const challengeUpdate: ChallengeUpdate = {
      challenges: this.serializeChallenges(challengeMap),
    };
    this.io.to(roomCode).emit('game:challenge_update', challengeUpdate);
  }

  async confirmChallengeDone(roomCode: string, playerId: string): Promise<void> {
    const doneSet = this.challengeDone.get(roomCode);
    if (!doneSet) return;

    doneSet.add(playerId);
    logger.info('GameEngine', `Player ${playerId} confirmed done voting in room ${roomCode} (${doneSet.size} done)`);

    // Check if all online players are done
    const onlinePlayers = roomManager.getOnlinePlayers(roomCode);
    if (doneSet.size >= onlinePlayers.length) {
      // Stop voting timer early
      timerManager.stopTimer(`${roomCode}:voting`);
      void this.endVoting(roomCode);
    }
  }

  private async endVoting(roomCode: string): Promise<void> {
    // Guard against double-fire
    if (this.endingVoting.has(roomCode)) return;
    this.endingVoting.add(roomCode);

    const provisionalResult = this.provisionalResults.get(roomCode);
    const challengeMap = this.challenges.get(roomCode);
    const meta = this.votingRoundMeta.get(roomCode);

    if (!provisionalResult || !meta) {
      this.cleanupVoting(roomCode);
      return;
    }

    const onlinePlayers = roomManager.getOnlinePlayers(roomCode);
    // Majority threshold: > 50% of OTHER players (excluding answer owner)
    // For a fair vote, we compare against (total online players - 1) since you can't flag your own
    const totalPlayers = onlinePlayers.length;

    // Apply challenges: if majority flagged, invalidate the answer
    for (const result of provisionalResult.playerResults) {
      for (const answer of result.answers) {
        const key = `${result.playerId}:${answer.category}`;
        const voters = challengeMap?.get(key);
        const voteCount = voters?.size ?? 0;
        const otherPlayerCount = totalPlayers - 1; // exclude the answer owner
        const majorityNeeded = Math.floor(otherPlayerCount / 2) + 1;

        if (voteCount >= majorityNeeded && answer.isValid) {
          // Invalidate this answer
          answer.isValid = false;
          answer.score = 0;
          answer.wasChallenged = true;
          answer.challengedBy = voters ? Array.from(voters) : [];

          logger.info('GameEngine', `Answer challenged & invalidated: ${key} (${voteCount}/${otherPlayerCount} votes)`);
        } else if (voters && voters.size > 0) {
          // Record voters even if not enough to invalidate
          answer.challengedBy = Array.from(voters);
        }
      }
    }
    // Recalculate round scores from the (possibly mutated) answers
    for (const result of provisionalResult.playerResults) {
      result.roundScore = result.answers.reduce((sum, a) => sum + a.score, 0);
    }

    // Now update DB with final scores
    for (const result of provisionalResult.playerResults) {
      for (const answer of result.answers) {
        await prisma.answer.update({
          where: {
            roundId_playerId_category: {
              roundId: meta.roundId,
              playerId: result.playerId,
              category: answer.category,
            },
          },
          data: {
            isValid: answer.isValid,
            score: answer.score,
          },
        });
      }
    }

    // Recompute accumulated scores from scratch using DB
    // This is the most reliable approach
    const scoreMap = this.scores.get(roomCode);
    if (scoreMap) {
      for (const [playerId] of scoreMap.entries()) {
        const dbAnswers = await prisma.answer.findMany({
          where: {
            playerId,
            round: { gameId: meta.gameId },
          },
        });
        const total = dbAnswers.reduce((sum, a) => sum + a.score, 0);
        scoreMap.set(playerId, total);
      }
    }

    // Update game status to ROUND_REVIEW
    await prisma.game.update({
      where: { id: meta.gameId },
      data: { status: 'ROUND_REVIEW' },
    });

    // Build final leaderboard
    const leaderboard = this.buildLeaderboard(roomCode);

    // Broadcast final results
    this.io.to(roomCode).emit('game:voting_ended', { roundResult: provisionalResult });
    this.io.to(roomCode).emit('game:round_completed', provisionalResult);
    this.io.to(roomCode).emit('game:leaderboard', { leaderboard });

    logger.info('GameEngine', `Voting ended in room ${roomCode}, showing final results`);

    // Clean up voting state
    this.cleanupVoting(roomCode);

    // Wait for final results display
    await sleep(FINAL_RESULTS_DURATION * 1000);

    // Proceed to next round or finish game
    const game = await prisma.game.findUnique({ where: { id: meta.gameId } });
    if (!game) return;

    if (game.currentRound >= game.totalRounds) {
      await this.finishGame(roomCode, meta.gameId);
    } else {
      await prisma.game.update({
        where: { id: meta.gameId },
        data: { status: 'NEXT_ROUND' },
      });
      await this.startNextRound(roomCode, meta.gameId);
    }
  }

  private serializeChallenges(challengeMap: Map<string, Set<string>>): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    for (const [key, voters] of challengeMap.entries()) {
      result[key] = Array.from(voters);
    }
    return result;
  }

  private cleanupVoting(roomCode: string): void {
    this.provisionalResults.delete(roomCode);
    this.challenges.delete(roomCode);
    this.challengeDone.delete(roomCode);
    this.votingRoundMeta.delete(roomCode);
    this.endingVoting.delete(roomCode);
    timerManager.stopTimer(`${roomCode}:voting`);
  }

  // ---- Finish Game ----

  private async finishGame(roomCode: string, gameId: string): Promise<void> {
    const leaderboard = this.buildLeaderboard(roomCode);
    const winner = leaderboard[0];

    if (!winner) {
      logger.error('GameEngine', `No winner found for game ${gameId}`);
      return;
    }

    // Update game status
    await prisma.game.update({
      where: { id: gameId },
      data: { status: 'GAME_FINISHED', finishedAt: new Date() },
    });

    // Save game history
    for (const entry of leaderboard) {
      await prisma.gameHistory.upsert({
        where: {
          gameId_playerId: { gameId, playerId: entry.playerId },
        },
        create: {
          gameId,
          playerId: entry.playerId,
          totalScore: entry.totalScore,
          rank: entry.rank,
        },
        update: {
          totalScore: entry.totalScore,
          rank: entry.rank,
        },
      });

      // Update player stats
      await prisma.playerStats.upsert({
        where: { playerId: entry.playerId },
        create: {
          playerId: entry.playerId,
          gamesPlayed: 1,
          gamesWon: entry.rank === 1 ? 1 : 0,
          totalScore: entry.totalScore,
          avgScore: entry.totalScore,
        },
        update: {
          gamesPlayed: { increment: 1 },
          gamesWon: entry.rank === 1 ? { increment: 1 } : undefined,
          totalScore: { increment: entry.totalScore },
        },
      });
    }

    // Update room status
    roomManager.setRoomStatus(roomCode, RoomStatus.FINISHED);
    await prisma.room.update({
      where: { code: roomCode },
      data: { status: 'FINISHED' },
    });

    // Broadcast game finished
    this.io.to(roomCode).emit('game:finished', { winner, leaderboard });

    // Clean up
    this.scores.delete(roomCode);
    this.submissions.delete(roomCode);

    logger.info('GameEngine', `Game finished in room ${roomCode}, winner: ${winner.playerName}`);
  }

  // ---- Leaderboard ----

  private buildLeaderboard(roomCode: string): LeaderboardEntry[] {
    const scoreMap = this.scores.get(roomCode);
    if (!scoreMap) return [];

    const room = roomManager.getRoom(roomCode);
    if (!room) return [];

    const entries: LeaderboardEntry[] = [];

    for (const [playerId, totalScore] of scoreMap.entries()) {
      const player = room.players.get(playerId);
      entries.push({
        playerId,
        playerName: player?.displayName ?? 'Unknown',
        avatarUrl: player?.avatarUrl ?? null,
        totalScore,
        rank: 0,
      });
    }

    // Sort by score descending
    entries.sort((a, b) => b.totalScore - a.totalScore);

    // Assign ranks (handle ties)
    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i]!.totalScore < entries[i - 1]!.totalScore) {
        currentRank = i + 1;
      }
      entries[i]!.rank = currentRank;
    }

    return entries;
  }
}
