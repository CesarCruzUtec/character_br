"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTournament } from "@/lib/store";
import { BracketSummary } from "@/components/BracketSummary";

export default function SummaryPage() {
  const router = useRouter();
  const { winner, losersByRound, isComplete, resetTournament, isHydrated } =
    useTournament();

  useEffect(() => {
    if (!isHydrated) return; // Wait for persisted state to load
    if (!isComplete || !winner) {
      router.push("/");
    }
  }, [isHydrated, isComplete, winner, router]);

  if (!winner) return null;

  return (
    <main className="min-h-screen bg-[#09090b]">
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
