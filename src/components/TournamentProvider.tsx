"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Character, Round } from "@/lib/types";
import { TournamentContext, TournamentStore } from "@/lib/store";
import {
  createFirstRound,
  createNextRound,
  calculateTotalRounds,
  getRoundLosers,
} from "@/lib/bracket";

const STORAGE_KEY = "tournament_state";

interface PersistedState {
  roster: Character[];
  rounds: Round[];
  currentRoundIndex: number;
  currentMatchIndex: number;
  isComplete: boolean;
  winner: Character | null;
  losersByRound: [string, Character[]][];
  isSorting: boolean;
}

function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function saveState(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

function clearState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const persisted = loadState();

  const [roster, setRosterState] = useState<Character[]>(persisted?.roster ?? []);
  const [rounds, setRounds] = useState<Round[]>(persisted?.rounds ?? []);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(persisted?.currentRoundIndex ?? 0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(persisted?.currentMatchIndex ?? 0);
  const [isComplete, setIsComplete] = useState(persisted?.isComplete ?? false);
  const [winner, setWinner] = useState<Character | null>(persisted?.winner ?? null);
  const [losersByRound, setLosersByRound] = useState<Map<string, Character[]>>(
    persisted?.losersByRound ? new Map(persisted.losersByRound) : new Map()
  );
  const [isSorting, setIsSorting] = useState(persisted?.isSorting ?? false);

  const roundsRef = useRef<Round[]>(rounds);
  roundsRef.current = rounds;

  // Persist state whenever it changes (but not completed tournaments)
  useEffect(() => {
    if (isComplete) return; // Don't persist completed tournaments
    if (roster.length === 0 && rounds.length === 0) return; // Don't save empty initial state
    saveState({
      roster,
      rounds,
      currentRoundIndex,
      currentMatchIndex,
      isComplete,
      winner,
      losersByRound: Array.from(losersByRound.entries()),
      isSorting,
    });
  }, [roster, rounds, currentRoundIndex, currentMatchIndex, isComplete, winner, losersByRound, isSorting]);

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
      clearState(); // Don't persist completed tournaments
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
    clearState();
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
