"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament } from "@/lib/store";
import { MatchCard } from "@/components/MatchCard";
import { SortingAnimation } from "@/components/SortingAnimation";
import { useAudioController } from "@/hooks/useAudioController";
import { HoverInfoCard } from "@/components/HoverInfoCard";
import { SaveMenu } from "@/components/SaveMenu";
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
    isHydrated,
    musicEnabled,
    setMusicEnabled,
  } = useTournament();

  const { playAudio, pauseAudio } = useAudioController();
  const [hoveredCharacter, setHoveredCharacter] = useState<Character | null>(null);
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  // Start tournament on mount if not started
  useEffect(() => {
    if (!isHydrated) return; // Wait for persisted state to load
    if (roster.length < 2) {
      router.push("/");
      return;
    }
    if (rounds.length === 0) {
      startTournament();
    }
  }, [isHydrated, roster, rounds, startTournament, router]);

  // Stop audio when music is disabled
  useEffect(() => {
    if (!musicEnabled && hoveredCharacter?.music) {
      pauseAudio(String(hoveredCharacter.id));
    }
  }, [musicEnabled, hoveredCharacter, pauseAudio]);

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
      if (musicEnabled && character.music) {
        playAudio(String(character.id), character.music);
      }
    },
    [playAudio, musicEnabled]
  );

  const handleHoverEnd = useCallback(
    (character: Character) => {
      setHoveredCharacter(null);
      if (musicEnabled && character.music) {
        pauseAudio(String(character.id));
      }
    },
    [pauseAudio, musicEnabled]
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
    <main className="min-h-screen bg-[#09090b]">
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 px-4 py-3 md:px-6">
            <div>
              <h2
                className="text-base tracking-wider text-white md:text-lg"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {currentMatch.round.name}
              </h2>
              <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                Match {currentMatchIndex + 1} of{" "}
                {currentRound?.matches.length ?? 0}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMusicEnabled(!musicEnabled)}
                className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  musicEnabled
                    ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    : "border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                }`}
              >
                {musicEnabled ? "🔊" : "🔇"}
                <span className="hidden sm:inline"> {musicEnabled ? "Music On" : "Music Off"}</span>
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-md border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                Home
              </button>
              <button
                onClick={() => setShowSaveMenu(true)}
                className="rounded-md border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                Save / Load
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                  {roster.length} characters
                </p>
                <p className="text-xs font-medium text-[#d4a853]">
                  Round {currentRoundIndex + 1}
                </p>
              </div>
            </div>
          </div>

          {/* Split Screen Match — side-by-side on md+, stacked on mobile */}
          <div className="relative flex flex-1 flex-col overflow-hidden md:flex-row">
            {currentMatch.match.character2 ? (
              <>
                {/* Top/Left character */}
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
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/90 backdrop-blur-md md:h-14 md:w-14"
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
                      className="text-xs font-semibold uppercase tracking-widest text-zinc-400 md:text-sm"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      VS
                    </span>
                  </motion.div>
                </div>

                {/* Bottom/Right character */}
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
              <div className="flex flex-1 items-center justify-center bg-zinc-950">
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p
                    className="text-3xl tracking-wider text-zinc-400"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    BYE ROUND
                  </p>
                  <p className="mt-3 text-sm text-zinc-500">
                    {currentMatch.match.character1.name} advances automatically
                  </p>
                  <button
                    onClick={() => handleVote(currentMatch.match.character1)}
                    className="mt-6 rounded-lg bg-[#d4a853] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-950 hover:bg-[#e0b560]"
                  >
                    Continue
                  </button>
                </motion.div>
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="border-t border-zinc-800/80 px-6 py-3">
            <div className="mx-auto flex max-w-md items-center gap-1">
              {currentRound?.matches.map((_, i) => (
                <div
                  key={i}
                  className={`h-px flex-1 rounded-full transition-colors ${
                    i < currentMatchIndex
                      ? "bg-zinc-500"
                      : i === currentMatchIndex
                      ? "bg-[#d4a853]"
                      : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save/Load Menu */}
      {showSaveMenu && (
        <SaveMenu onClose={() => setShowSaveMenu(false)} />
      )}
    </main>
  );
}
