"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament } from "@/lib/store";
import { MatchCard } from "@/components/MatchCard";
import { SortingAnimation } from "@/components/SortingAnimation";
import { useAudioController } from "@/hooks/useAudioController";
import { Character } from "@/lib/types";

export default function TournamentPage() {
  const router = useRouter();
  const {
    roster,
    rounds,
    currentRoundIndex,
    currentMatchIndex,
    isComplete,
    isSorting,
    setIsSorting,
    startTournament,
    voteWinner,
    getCurrentMatch,
  } = useTournament();

  const { playAudio, pauseAudio } = useAudioController();

  // Start tournament on mount if not started
  useEffect(() => {
    if (roster.length < 2) {
      router.push("/");
      return;
    }
    if (rounds.length === 0) {
      startTournament();
    }
  }, [roster, rounds, startTournament, router]);

  // Navigate to summary when complete
  useEffect(() => {
    if (isComplete) {
      router.push("/summary");
    }
  }, [isComplete, router]);

  const currentRound = rounds[currentRoundIndex];
  const currentMatch = useMemo(() => getCurrentMatch(), [getCurrentMatch, rounds, currentRoundIndex, currentMatchIndex]);

  const handleVote = useCallback(
    (winner: Character) => {
      voteWinner(winner);
    },
    [voteWinner]
  );

  const handleHoverStart = useCallback(
    (character: Character) => {
      if (character.music) {
        playAudio(String(character.id), character.music);
      }
    },
    [playAudio]
  );

  const handleHoverEnd = useCallback(
    (character: Character) => {
      if (character.music) {
        pauseAudio(String(character.id));
      }
    },
    [pauseAudio]
  );

  const handleSortingComplete = useCallback(() => {
    setIsSorting(false);
  }, [setIsSorting]);

  // Get current round characters for sorting animation
  const currentRoundCharacters = useMemo(() => {
    if (!currentRound) return [];
    return currentRound.matches.flatMap((m) =>
      m.character2 ? [m.character1, m.character2] : [m.character1]
    );
  }, [currentRound]);

  if (roster.length < 2) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      {/* Sorting Animation Overlay */}
      <AnimatePresence>
        {isSorting && currentRound && (
          <SortingAnimation
            characters={currentRoundCharacters}
            roundName={currentRound.name}
            onComplete={handleSortingComplete}
          />
        )}
      </AnimatePresence>

      {/* Match UI */}
      {!isSorting && currentMatch && (
        <div className="flex min-h-screen flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                {currentMatch.round.name}
              </h2>
              <p className="text-xs text-gray-500">
                Match {currentMatchIndex + 1} of{" "}
                {currentRound?.matches.length ?? 0}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {roster.length} characters
              </p>
              <p className="text-xs text-purple-400">
                Round {currentRoundIndex + 1}
              </p>
            </div>
          </div>

          {/* Match Cards */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4 md:flex-row md:gap-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMatch.match.id + "-c1"}
                className="w-full max-w-sm md:w-2/5"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <MatchCard
                  character={currentMatch.match.character1}
                  onVote={handleVote}
                  onHoverStart={handleHoverStart}
                  onHoverEnd={handleHoverEnd}
                />
              </motion.div>
            </AnimatePresence>

            {/* VS Divider */}
            <motion.div
              className="flex-shrink-0"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
                delay: 0.3,
              }}
            >
              <span className="text-4xl font-black text-purple-500 md:text-5xl">
                VS
              </span>
            </motion.div>

            {currentMatch.match.character2 ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMatch.match.id + "-c2"}
                  className="w-full max-w-sm md:w-2/5"
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 100, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                >
                  <MatchCard
                    character={currentMatch.match.character2}
                    onVote={handleVote}
                    onHoverStart={handleHoverStart}
                    onHoverEnd={handleHoverEnd}
                  />
                </motion.div>
              </AnimatePresence>
            ) : (
              <motion.div
                className="flex w-full max-w-sm items-center justify-center rounded-2xl border-2 border-dashed border-gray-700 bg-gray-800/30 p-8 md:w-2/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-center">
                  <span className="text-4xl">🎉</span>
                  <p className="mt-2 text-lg font-bold text-gray-400">
                    BYE ROUND
                  </p>
                  <p className="text-sm text-gray-500">
                    {currentMatch.match.character1.name} advances automatically!
                  </p>
                  <button
                    onClick={() => handleVote(currentMatch.match.character1)}
                    className="mt-4 rounded-lg bg-purple-600 px-6 py-2 text-sm font-bold text-white hover:bg-purple-500"
                  >
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="border-t border-gray-800 px-4 py-3">
            <div className="mx-auto flex max-w-md items-center gap-1">
              {currentRound?.matches.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < currentMatchIndex
                      ? "bg-green-500"
                      : i === currentMatchIndex
                      ? "bg-purple-500"
                      : "bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
