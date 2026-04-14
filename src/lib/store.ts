"use client";

import { createContext, useContext } from "react";
import { Character, Round } from "./types";

export interface SaveSlot {
  id: string;
  name: string;
  pastebinId: string;
  savedAt: number;
  roster: Character[];
  rounds: Round[];
  currentRoundIndex: number;
  currentMatchIndex: number;
  isComplete: boolean;
  winner: Character | null;
  losersByRound: [string, Character[]][];
}

export interface TournamentStore {
  roster: Character[];
  rounds: Round[];
  currentRoundIndex: number;
  currentMatchIndex: number;
  isComplete: boolean;
  winner: Character | null;
  losersByRound: Map<string, Character[]>;
  // Actions
  setRoster: (roster: Character[]) => void;
  startTournament: () => void;
  voteWinner: (winner: Character) => void;
  resetTournament: () => void;
  advanceToNextMatch: () => void;
  advanceToNextRound: () => void;
  getCurrentMatch: () => {
    match: Round["matches"][0];
    round: Round;
  } | null;
  isSorting: boolean;
  setIsSorting: (v: boolean) => void;
  isHydrated: boolean;
  musicEnabled: boolean;
  setMusicEnabled: (v: boolean) => void;
  // Save/Load
  currentPastebinId: string;
  setCurrentPastebinId: (id: string) => void;
  saveSlot: (name: string) => void;
  loadSlot: (slot: SaveSlot) => void;
  deleteSlot: (slotId: string) => void;
}

export const TournamentContext = createContext<TournamentStore | null>(null);

export function useTournament(): TournamentStore {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error("useTournament must be used within TournamentProvider");
  }
  return ctx;
}
