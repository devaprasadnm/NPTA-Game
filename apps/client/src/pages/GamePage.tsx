// ============================================
// Game Page — Active round: letter, timer, inputs, submit
// ============================================

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Flag, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Timer } from '@/components/ui/Timer';
import { Badge } from '@/components/ui/Badge';
import { LetterReveal } from '@/components/game/LetterReveal';
import { CategoryInput } from '@/components/game/CategoryInput';
import { useGameStore } from '@/stores/gameStore';
import { useRoomStore } from '@/stores/roomStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useSocketStore } from '@/stores/socketStore';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  Category,
  GameStatus,
  RoundStatus,
  VOTING_DURATION,
} from '@npta/shared';

export default function GamePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const game = useGameStore((s) => s.game);
  const currentRound = useGameStore((s) => s.currentRound);
  const timeRemaining = useGameStore((s) => s.timeRemaining);
  const answers = useGameStore((s) => s.answers);
  const setAnswer = useGameStore((s) => s.setAnswer);
  const hasSubmitted = useGameStore((s) => s.hasSubmitted);
  const markSubmitted = useGameStore((s) => s.markSubmitted);
  const submittedPlayers = useGameStore((s) => s.submittedPlayers);
  const roundResult = useGameStore((s) => s.roundResult);
  const winner = useGameStore((s) => s.winner);
  const countdown = useGameStore((s) => s.countdown);
  const leaderboard = useGameStore((s) => s.leaderboard);
  const settings = useRoomStore((s) => s.settings);
  const players = useRoomStore((s) => s.players);
  const playerId = usePlayerStore((s) => s.id);
  const socket = useSocketStore((s) => s.socket);

  // Voting state
  const challenges = useGameStore((s) => s.challenges);
  const votingTimeRemaining = useGameStore((s) => s.votingTimeRemaining);
  const isVotingPhase = useGameStore((s) => s.isVotingPhase);
  const challengeDone = useGameStore((s) => s.challengeDone);
  const markChallengeDone = useGameStore((s) => s.markChallengeDone);

  // Navigate based on game state
  useEffect(() => {
    if (!game) {
      navigate(`/room/${code}`);
      return;
    }
    if (game.status === GameStatus.GAME_FINISHED && winner) {
      navigate(`/winner/${code}`);
    }
  }, [game, winner, code, navigate]);

  function handleSubmit() {
    if (hasSubmitted || !socket) return;

    socket.emit('game:submit', { answers }, (res) => {
      if (res.success) {
        markSubmitted();
      }
    });
  }

  function handleChallenge(targetPlayerId: string, category: string) {
    if (!socket || challengeDone) return;

    socket.emit('game:challenge', { targetPlayerId, category }, (res) => {
      if (!res.success) {
        console.error('Challenge failed:', res.error);
      }
    });
  }

  function handleChallengeDone() {
    if (!socket || challengeDone) return;
    markChallengeDone();
    socket.emit('game:challenge_done');
  }

  const isRoundActive = currentRound?.status === RoundStatus.ACTIVE;
  const isRoundStarting = game?.status === GameStatus.ROUND_STARTING;
  const isVoting = game?.status === GameStatus.ROUND_VOTING && isVotingPhase;
  const isReviewing = game?.status === GameStatus.ROUND_REVIEW;
  const letter = currentRound?.letter ?? '?';
  const onlinePlayers = players.filter((p) => p.isOnline);
  const otherPlayerCount = onlinePlayers.length - 1; // for majority calc
  const majorityNeeded = Math.floor(otherPlayerCount / 2) + 1;

  /** Get the voter list for a given answer key */
  function getChallengeVoters(targetPlayerId: string, category: string): string[] {
    const key = `${targetPlayerId}:${category}`;
    return challenges[key] ?? [];
  }

  /** Check if the current player has flagged a given answer */
  function hasPlayerChallenged(targetPlayerId: string, category: string): boolean {
    return getChallengeVoters(targetPlayerId, category).includes(playerId ?? '');
  }

  /** Render the review/voting table for a category */
  function renderCategorySection(category: Category, catIdx: number, allowVoting: boolean) {
    if (!roundResult) return null;

    // Gather every player's answer for this category
    const categoryAnswers = roundResult.playerResults.map((result) => {
      const ans = result.answers.find((a) => a.category === category);
      return {
        playerId: result.playerId,
        playerName: result.playerName,
        value: ans?.value ?? '',
        isValid: ans?.isValid ?? false,
        score: ans?.score ?? 0,
        wasChallenged: ans?.wasChallenged ?? false,
        challengedBy: ans?.challengedBy ?? [],
      };
    });

    // Group by normalized value to find matches
    const answerGroups = new Map<string, string[]>();
    for (const a of categoryAnswers) {
      if (a.isValid && a.value) {
        const normalized = a.value.trim().toLowerCase();
        const group = answerGroups.get(normalized) ?? [];
        group.push(a.playerId);
        answerGroups.set(normalized, group);
      }
    }

    return (
      <motion.div
        key={category}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: catIdx * 0.1 }}
        className="rounded-2xl bg-white dark:bg-surface-dark-2 border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        {/* Category header */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-surface-dark-3 border-b border-slate-100 dark:border-slate-700">
          <span className="text-lg mr-2">{CATEGORY_ICONS[category]}</span>
          <span className="font-display font-bold text-slate-700 dark:text-slate-200">
            {CATEGORY_LABELS[category]}
          </span>
        </div>

        {/* Players' answers for this category */}
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {categoryAnswers.map((answer) => {
            const normalized = answer.value.trim().toLowerCase();
            const matchCount = answerGroups.get(normalized)?.length ?? 0;
            const isMatch = answer.isValid && matchCount > 1;
            const isUnique = answer.isValid && matchCount === 1;
            const isMe = answer.playerId === playerId;
            const voters = getChallengeVoters(answer.playerId, category);
            const voteCount = voters.length;
            const isFlaggedByMe = hasPlayerChallenged(answer.playerId, category);
            const isMajorityReached = voteCount >= majorityNeeded;
            const wasChallenged = answer.wasChallenged;

            return (
              <div
                key={answer.playerId}
                className={`flex items-center gap-3 px-4 py-2.5 ${
                  wasChallenged
                    ? 'bg-rose-50/50 dark:bg-rose-900/10'
                    : isMe
                      ? 'bg-primary-50/50 dark:bg-primary-900/10'
                      : ''
                }`}
              >
                {/* Player avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isMe
                    ? 'gradient-bg text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {answer.playerName[0]?.toUpperCase()}
                </div>

                {/* Player name */}
                <span className={`text-sm font-medium w-20 truncate flex-shrink-0 ${
                  isMe ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {answer.playerName}
                  {isMe && <span className="text-xs ml-0.5">(You)</span>}
                </span>

                {/* Answer value */}
                <span className={`flex-1 text-sm font-medium truncate ${
                  !answer.value
                    ? 'text-slate-300 dark:text-slate-600 italic'
                    : wasChallenged || (!answer.isValid && answer.value)
                      ? 'text-slate-400 line-through'
                      : 'text-slate-800 dark:text-white'
                }`}>
                  {answer.value || '— no answer —'}
                </span>

                {/* Match/score/challenge badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {wasChallenged && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wide">
                      ❌ Challenged
                    </span>
                  )}
                  {!wasChallenged && isMatch && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wide">
                      🤝 Matched
                    </span>
                  )}
                  {!wasChallenged && isUnique && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wide">
                      ✨ Unique
                    </span>
                  )}

                  {/* Vote count indicator (during voting or after) */}
                  {voteCount > 0 && (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isMajorityReached
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    }`}>
                      🚩 {voteCount}/{otherPlayerCount}
                    </span>
                  )}

                  {/* Flag button (only during active voting, not for own answers, only for valid answers) */}
                  {allowVoting && !isMe && answer.isValid && answer.value && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleChallenge(answer.playerId, category)}
                      disabled={challengeDone}
                      className={`p-1.5 rounded-xl transition-all duration-200 ${
                        isFlaggedByMe
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                      title={isFlaggedByMe ? 'Remove flag' : 'Flag this answer'}
                    >
                      <Flag className="w-3.5 h-3.5" fill={isFlaggedByMe ? 'currentColor' : 'none'} />
                    </motion.button>
                  )}

                  <span className={`text-xs font-bold min-w-[32px] text-right ${
                    wasChallenged
                      ? 'text-rose-400 dark:text-rose-500'
                      : answer.score === 10
                        ? 'text-emerald-500'
                        : answer.score === 5
                          ? 'text-amber-500'
                          : 'text-slate-300 dark:text-slate-600'
                  }`}>
                    +{answer.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-50 dark:bg-surface-dark">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-light p-3 sm:p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="primary">
              Round {game?.currentRound ?? 0}/{game?.totalRounds ?? 0}
            </Badge>
          </div>

          {isRoundActive && (
            <Timer
              remaining={timeRemaining}
              total={settings.roundDuration}
              size={56}
            />
          )}

          {isVoting && (
            <Timer
              remaining={votingTimeRemaining}
              total={VOTING_DURATION}
              size={56}
            />
          )}

          <div className="flex items-center gap-1">
            {isVoting && (
              <Badge variant="warning" dot>
                🗳️ Voting
              </Badge>
            )}
            {!isVoting && (
              <Badge variant={hasSubmitted ? 'success' : 'neutral'} dot={hasSubmitted}>
                {submittedPlayers.size}/{onlinePlayers.length}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* Round Starting Countdown */}
          {isRoundStarting && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center min-h-[60vh]"
            >
              <LetterReveal letter={letter} countdown={countdown} />
            </motion.div>
          )}

          {/* Active Round */}
          {isRoundActive && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Letter Display */}
              <div className="flex justify-center mb-6">
                <LetterReveal letter={letter} />
              </div>

              {/* Category Inputs */}
              <div className="space-y-3">
                {CATEGORIES.map((category, index) => (
                  <CategoryInput
                    key={category}
                    category={category as Category}
                    letter={letter}
                    value={answers[category as Category]}
                    onChange={(value) => setAnswer(category as Category, value)}
                    disabled={hasSubmitted}
                    index={index}
                  />
                ))}
              </div>

              {/* Submitted overlay */}
              {hasSubmitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-display font-bold text-lg text-slate-800 dark:text-white">
                    Answers Submitted!
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Waiting for other players...
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Voting Phase — Category-based answer comparison with flag buttons */}
          {isVoting && roundResult && (
            <motion.div
              key="voting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="text-center mb-4">
                <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white">
                  🗳️ Challenge Phase
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Letter: <span className="font-bold text-primary-500 text-xl">{roundResult.letter}</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Flag answers you think are invalid. Majority vote ({majorityNeeded}/{otherPlayerCount}) invalidates an answer.
                </p>
              </div>

              {/* Category-by-category comparison with voting */}
              {CATEGORIES.map((category, catIdx) =>
                renderCategorySection(category as Category, catIdx, true)
              )}

              {/* Round score summary per player */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl bg-white dark:bg-surface-dark-2 border border-slate-100 dark:border-slate-800 p-4"
              >
                <h3 className="font-display font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 text-center">
                  Round {roundResult.roundNumber} Scores (Provisional)
                </h3>
                <div className="space-y-2">
                  {[...roundResult.playerResults]
                    .sort((a, b) => b.roundScore - a.roundScore)
                    .map((result, idx) => (
                      <div
                        key={result.playerId}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                          result.playerId === playerId
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'bg-slate-50 dark:bg-surface-dark-3'
                        }`}
                      >
                        <span className="text-sm font-bold text-slate-400 w-5">{idx + 1}.</span>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          result.playerId === playerId
                            ? 'gradient-bg text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {result.playerName[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 font-semibold text-sm text-slate-800 dark:text-white truncate">
                          {result.playerName}
                          {result.playerId === playerId && <span className="text-primary-500 text-xs ml-1">(You)</span>}
                        </span>
                        <Badge variant={result.roundScore >= 30 ? 'success' : result.roundScore >= 15 ? 'warning' : 'neutral'}>
                          +{result.roundScore} pts
                        </Badge>
                      </div>
                    ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Round Review — Final results after voting */}
          {isReviewing && roundResult && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <div className="text-center mb-4">
                <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white">
                  Round {roundResult.roundNumber} Results
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Letter: <span className="font-bold text-primary-500 text-xl">{roundResult.letter}</span>
                </p>
              </div>

              {/* Category-by-category comparison (no voting) */}
              {CATEGORIES.map((category, catIdx) =>
                renderCategorySection(category as Category, catIdx, false)
              )}

              {/* Round score summary per player */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl bg-white dark:bg-surface-dark-2 border border-slate-100 dark:border-slate-800 p-4"
              >
                <h3 className="font-display font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 text-center">
                  Round {roundResult.roundNumber} Scores
                </h3>
                <div className="space-y-2">
                  {[...roundResult.playerResults]
                    .sort((a, b) => b.roundScore - a.roundScore)
                    .map((result, idx) => (
                      <div
                        key={result.playerId}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                          result.playerId === playerId
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'bg-slate-50 dark:bg-surface-dark-3'
                        }`}
                      >
                        <span className="text-sm font-bold text-slate-400 w-5">{idx + 1}.</span>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          result.playerId === playerId
                            ? 'gradient-bg text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {result.playerName[0]?.toUpperCase()}
                        </div>
                        <span className="flex-1 font-semibold text-sm text-slate-800 dark:text-white truncate">
                          {result.playerName}
                          {result.playerId === playerId && <span className="text-primary-500 text-xs ml-1">(You)</span>}
                        </span>
                        <Badge variant={result.roundScore >= 30 ? 'success' : result.roundScore >= 15 ? 'warning' : 'neutral'}>
                          +{result.roundScore} pts
                        </Badge>
                      </div>
                    ))}
                </div>
              </motion.div>

              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="rounded-2xl bg-white dark:bg-surface-dark-2 border border-slate-100 dark:border-slate-800 p-4"
                >
                  <h3 className="font-display font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 text-center">
                    🏆 Overall Leaderboard
                  </h3>
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.playerId}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                          entry.playerId === playerId
                            ? 'bg-primary-50 dark:bg-primary-900/20'
                            : 'bg-slate-50 dark:bg-surface-dark-3'
                        }`}
                      >
                        <span className="text-lg w-7 text-center">
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `${entry.rank}.`}
                        </span>
                        <span className="flex-1 font-semibold text-sm text-slate-800 dark:text-white truncate">
                          {entry.playerName}
                          {entry.playerId === playerId && <span className="text-primary-500 text-xs ml-1">(You)</span>}
                        </span>
                        <span className="font-display font-bold text-primary-500 text-sm">
                          {entry.totalScore} <span className="text-xs text-slate-400">pts</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Submit Button */}
      {isRoundActive && !hasSubmitted && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="sticky bottom-0 p-4 glass-light safe-bottom"
        >
          <div className="max-w-lg mx-auto">
            <Button
              fullWidth
              size="lg"
              icon={<Send className="w-5 h-5" />}
              onClick={handleSubmit}
            >
              Submit Answers
            </Button>
          </div>
        </motion.div>
      )}

      {/* Sticky Done Voting Button */}
      {isVoting && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="sticky bottom-0 p-4 glass-light safe-bottom"
        >
          <div className="max-w-lg mx-auto">
            <Button
              fullWidth
              size="lg"
              variant={challengeDone ? 'secondary' : 'primary'}
              icon={<CheckCheck className="w-5 h-5" />}
              onClick={handleChallengeDone}
              disabled={challengeDone}
            >
              {challengeDone ? 'Waiting for others...' : 'Done Voting ✓'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

