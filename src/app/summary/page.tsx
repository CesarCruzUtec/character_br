"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTournament } from "@/lib/store";
import { BracketSummary } from "@/components/BracketSummary";

export default function SummaryPage() {
  const router = useRouter();
  const { winner, losersByRound, isComplete, resetTournament } =
    useTournament();

  useEffect(() => {
    if (!isComplete || !winner) {
      router.push("/");
    }
  }, [isComplete, winner, router]);

  if (!winner) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <BracketSummary
        winner={winner}
        losersByRound={losersByRound}
        onPlayAgain={() => {
          resetTournament();
          router.push("/");
        }}
      />
    </main>
  );
}
