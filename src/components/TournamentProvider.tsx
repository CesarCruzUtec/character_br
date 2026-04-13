"use client";

import { useCallback, useRef, useState } from "react";
import { Character, Round } from "@/lib/types";
import { TournamentContext, TournamentStore } from "@/lib/store";
import {
  createFirstRound,
  createNextRound,
  calculateTotalRounds,
  getRoundLosers,
} from "@/lib/bracket";

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [roster, setRosterState] = useState<Character[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [winner, setWinner] = useState<Character | null>(null);
  const [losersByRound, setLosersByRound] = useState<Map<string, Character[]>>(
    new Map()
  );
  const [isSorting, setIsSorting] = useState(false);

  const roundsRef = useRef<Round[]>([]);
  roundsRef.current = rounds;

  const setRoster = useCallback((r: Character[]) => {
    setRosterState(r);
    setRounds([]);
    setCurrentRoundIndex(0);
    setCurrentMatchIndex(0);
    setIsComplete(false);
    setWinner(null);
    setLosersByRound(new Map());
  }, []);

  const startTournament = useCallback(() => {
    if (roster.length < 2) return;
    const firstRound = createFirstRound(roster);
    setRounds([firstRound]);
    setCurrentRoundIndex(0);
    setCurrentMatchIndex(0);
    setIsComplete(false);
    setWinner(null);
    setLosersByRound(new Map());
    setIsSorting(true);
  }, [roster]);

  const getCurrentMatch = useCallback((): {
    match: Round["matches"][0];
    round: Round;
  } | null => {
    const round = roundsRef.current[currentRoundIndex];
    if (!round) return null;
    const match = round.matches[currentMatchIndex];
    if (!match) return null;
    return { match, round };
  }, [currentRoundIndex, currentMatchIndex]);

  const advanceToNextMatch = useCallback(() => {
    const round = roundsRef.current[currentRoundIndex];
    if (!round) return;

    if (currentMatchIndex + 1 < round.matches.length) {
      setCurrentMatchIndex((prev) => prev + 1);
    } else {
      // Round complete - need to advance to next round or end
      advanceToNextRound();
    }
  }, [currentRoundIndex, currentMatchIndex]);

  const advanceToNextRound = useCallback(() => {
    const round = roundsRef.current[currentRoundIndex];
    if (!round) return;

    // Collect losers
    const losers = getRoundLosers(round);
    setLosersByRound((prev) => {
      const next = new Map(prev);
      next.set(round.name, losers);
      return next;
    });

    // Collect winners
    const winners = round.matches
      .map((m) => m.winner)
      .filter((w): w is Character => w !== null);

    if (winners.length <= 1) {
      // Tournament is over
      if (winners.length === 1) {
        setWinner(winners[0]);
      }
      setIsComplete(true);
      return;
    }

    // Create next round
    const totalRounds = calculateTotalRounds(roster.length);
    const nextRound = createNextRound(
      winners,
      round.roundNumber + 1,
      totalRounds
    );

    setRounds((prev) => [...prev, nextRound]);
    setCurrentRoundIndex((prev) => prev + 1);
    setCurrentMatchIndex(0);
    setIsSorting(true);
  }, [currentRoundIndex, roster.length]);

  const voteWinner = useCallback(
    (w: Character) => {
      setRounds((prev) => {
        const updated = [...prev];
        const round = { ...updated[currentRoundIndex] };
        const matches = [...round.matches];
        matches[currentMatchIndex] = {
          ...matches[currentMatchIndex],
          winner: w,
        };
        round.matches = matches;
        updated[currentRoundIndex] = round;
        return updated;
      });

      // Use setTimeout to ensure state is updated before advancing
      setTimeout(() => advanceToNextMatch(), 0);
    },
    [currentRoundIndex, currentMatchIndex, advanceToNextMatch]
  );

  const resetTournament = useCallback(() => {
    setRosterState([]);
    setRounds([]);
    setCurrentRoundIndex(0);
    setCurrentMatchIndex(0);
    setIsComplete(false);
    setWinner(null);
    setLosersByRound(new Map());
    setIsSorting(false);
  }, []);

  const store: TournamentStore = {
    roster,
    rounds,
    currentRoundIndex,
    currentMatchIndex,
    isComplete,
    winner,
    losersByRound,
    setRoster,
    startTournament,
    voteWinner,
    resetTournament,
    advanceToNextMatch,
    advanceToNextRound,
    getCurrentMatch,
    isSorting,
    setIsSorting,
  };

  return (
    <TournamentContext.Provider value={store}>
      {children}
    </TournamentContext.Provider>
  );
}
