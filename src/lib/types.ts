import { z } from "zod";

// Zod schema for a single character
export const CharacterSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  description: z.string(),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
  music: z.string().url().optional(),
});

// Zod schema for the full roster
export const RosterSchema = z.array(CharacterSchema).min(2, "At least 2 characters are required");

export type Character = z.infer<typeof CharacterSchema>;
export type Roster = z.infer<typeof RosterSchema>;

// Tournament types
export interface Match {
  id: string;
  character1: Character;
  character2: Character | null; // null means bye
  winner: Character | null;
}

export interface Round {
  roundNumber: number;
  name: string;
  matches: Match[];
}

export interface TournamentState {
  roster: Character[];
  rounds: Round[];
  currentRoundIndex: number;
  currentMatchIndex: number;
  isComplete: boolean;
  winner: Character | null;
  losersByRound: Map<string, Character[]>; // roundName -> eliminated characters
}

// Round name helpers
export function getRoundName(roundNumber: number, totalRounds: number): string {
  if (roundNumber === totalRounds) return "Finals";
  if (roundNumber === totalRounds - 1) return "Semi-Finals";
  if (roundNumber === totalRounds - 2) return "Quarter-Finals";
  return `Round ${roundNumber}`;
}
