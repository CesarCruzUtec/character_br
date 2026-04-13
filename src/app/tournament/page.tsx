"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament } from "@/lib/store";
import { MatchCard } from "@/components/MatchCard";
import { SortingAnimation } from "@/components/SortingAnimation";
import { useAudioController } from "@/hooks/useAudioController";
import { HoverInfoCard } from "@/components/HoverInfoCard";
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
  const [hoveredCharacter, setHoveredCharacter] = useState<Character | null>(null);

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
      setHoveredCharacter(character);
      if (character.music) {
        playAudio(String(character.id), character.music);
      }
    },
    [playAudio]
  );

  const handleHoverEnd = useCallback(
    (character: Character) => {
      setHoveredCharacter(null);
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

          {/* Split Screen Match — halves touch directly */}
          <div className="relative flex flex-1 overflow-hidden">
            {currentMatch.match.character2 ? (
              <>
                {/* Left character */}
                <AnimatePresence mode="wait">
                  <MatchCard
                    key={currentMatch.match.id + "-c1"}
                    character={currentMatch.match.character1}
                    onVote={handleVote}
                    onHoverStart={handleHoverStart}
                    onHoverEnd={handleHoverEnd}
                    side="left"
                    isHovered={hoveredCharacter?.id === currentMatch.match.character1.id}
                    isOtherHovered={hoveredCharacter?.id === currentMatch.match.character2?.id}
                  />
                </AnimatePresence>

                {/* VS circle — centered on the seam */}
                <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <motion.div
                    className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-black/70 backdrop-blur-md md:h-18 md:w-18"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                      delay: 0.3,
                    }}
                  >
                    <span
                      className="text-lg font-black text-white md:text-xl"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      VS
                    </span>
                  </motion.div>
                </div>

                {/* Right character */}
                <AnimatePresence mode="wait">
                  <MatchCard
                    key={currentMatch.match.id + "-c2"}
                    character={currentMatch.match.character2}
                    onVote={handleVote}
                    onHoverStart={handleHoverStart}
                    onHoverEnd={handleHoverEnd}
                    side="right"
                    isHovered={hoveredCharacter?.id === currentMatch.match.character2.id}
                    isOtherHovered={hoveredCharacter?.id === currentMatch.match.character1.id}
                  />
                </AnimatePresence>

                {/* Hover info card — bottom center, description only */}
                <HoverInfoCard character={hoveredCharacter} />
              </>
            ) : (
              /* Bye round */
              <div className="flex flex-1 items-center justify-center bg-gray-900">
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="text-6xl">🎉</span>
                  <p className="mt-4 text-2xl font-bold text-gray-300">
                    BYE ROUND
                  </p>
                  <p className="mt-2 text-gray-500">
                    {currentMatch.match.character1.name} advances automatically!
                  </p>
                  <button
                    onClick={() => handleVote(currentMatch.match.character1)}
                    className="mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-base font-bold text-white hover:from-purple-500 hover:to-pink-500"
                  >
                    Continue →
                  </button>
                </motion.div>
              </div>
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
