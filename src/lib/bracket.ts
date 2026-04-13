import { Character, Match, Round, getRoundName } from "./types";

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a unique match ID
 */
function matchId(roundIndex: number, matchIndex: number): string {
  return `r${roundIndex}-m${matchIndex}`;
}

/**
 * Create the first round from a roster of characters.
 * Handles odd numbers by giving a "bye" to one character.
 */
export function createFirstRound(roster: Character[]): Round {
  const shuffled = shuffleArray(roster);
  const matches: Match[] = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      matches.push({
        id: matchId(0, matches.length),
        character1: shuffled[i],
        character2: shuffled[i + 1],
        winner: null,
      });
    } else {
      // Odd number: this character gets a bye
      matches.push({
        id: matchId(0, matches.length),
        character1: shuffled[i],
        character2: null, // bye
        winner: shuffled[i], // auto-advance
      });
    }
  }

  return {
    roundNumber: 1,
    name: getRoundName(1, calculateTotalRounds(roster.length)),
    matches,
  };
}

/**
 * Calculate total number of rounds needed
 */
export function calculateTotalRounds(rosterSize: number): number {
  return Math.ceil(Math.log2(rosterSize)) + 1;
}

/**
 * Create the next round from the winners of the current round
 */
export function createNextRound(
  winners: Character[],
  roundNumber: number,
  totalRounds: number
): Round {
  const shuffled = shuffleArray(winners);
  const matches: Match[] = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      matches.push({
        id: matchId(roundNumber - 1, matches.length),
        character1: shuffled[i],
        character2: shuffled[i + 1],
        winner: null,
      });
    } else {
      // Odd number: bye
      matches.push({
        id: matchId(roundNumber - 1, matches.length),
        character1: shuffled[i],
        character2: null,
        winner: shuffled[i],
      });
    }
  }

  return {
    roundNumber,
    name: getRoundName(roundNumber, totalRounds),
    matches,
  };
}

/**
 * Get the losers from a round (characters that didn't win)
 */
export function getRoundLosers(round: Round): Character[] {
  const losers: Character[] = [];
  for (const match of round.matches) {
    if (match.character2 === null) continue; // bye, no loser
    if (match.winner === match.character1) {
      losers.push(match.character2);
    } else if (match.winner === match.character2) {
      losers.push(match.character1);
    }
  }
  return losers;
}
