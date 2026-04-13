"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Character } from "@/lib/types";

interface BracketSummaryProps {
  winner: Character;
  losersByRound: Map<string, Character[]>;
  onPlayAgain: () => void;
}

export function BracketSummary({
  winner,
  losersByRound,
  onPlayAgain,
}: BracketSummaryProps) {
  const rounds = Array.from(losersByRound.entries()).reverse();
  const [confetti, setConfetti] = useState<Array<{ left: number; x: number; duration: number; delay: number; color: string }>>([]);

  useEffect(() => {
    const colors = ["#d4a853", "#b8923e", "#fafafa", "#a1a1aa", "#71717a"];
    setConfetti(
      Array.from({ length: 40 }).map((_, i) => ({
        left: Math.random() * 100,
        x: (Math.random() - 0.5) * 200,
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 1.5,
        color: colors[i % colors.length],
      }))
    );
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Winner Section */}
      <motion.div
        className="mb-12 text-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
      >
        <motion.div
          animate={{ rotate: [0, -3, 3, -3, 0] }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <h2
            className="mb-4 text-3xl tracking-wider text-[#d4a853] md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CHAMPION
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto inline-block overflow-hidden rounded-2xl border border-[#d4a853]/30 bg-zinc-900 shadow-2xl shadow-[#d4a853]/10"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="mx-auto h-48 w-48 md:h-64 md:w-64">
            <img
              src={winner.images[0]}
              alt={winner.name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-5">
            <h3
              className="text-2xl tracking-wider text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {winner.name}
            </h3>
            <p className="mt-1 text-sm text-zinc-400">{winner.description}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Confetti effect */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {confetti.map((c, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full"
            style={{
              left: `${c.left}%`,
              backgroundColor: c.color,
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: typeof window !== "undefined" ? window.innerHeight + 20 : 1000,
              opacity: 0,
              rotate: 720,
              x: c.x,
            }}
            transition={{
              duration: c.duration,
              delay: c.delay,
              ease: "easeIn",
            }}
          />
        ))}
      </div>

      {/* Elimination Summary */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        <h3
          className="mb-6 text-center text-xl tracking-wider text-zinc-400"
          style={{ fontFamily: "var(--font-display)" }}
        >
          TOURNAMENT SUMMARY
        </h3>

        <div className="space-y-6">
          {rounds.map(([roundName, losers], roundIdx) => (
            <motion.div
              key={roundName}
              className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8 + roundIdx * 0.2 }}
            >
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Eliminated in {roundName}
              </h4>
              <div className="flex flex-wrap gap-2">
                {losers.map((char) => (
                  <div
                    key={String(char.id)}
                    className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2"
                  >
                    <div className="h-7 w-7 overflow-hidden rounded-full">
                      <img
                        src={char.images[0]}
                        alt={char.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-sm text-zinc-300">{char.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Play Again */}
      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
      >
        <button
          onClick={onPlayAgain}
          className="rounded-lg bg-[#d4a853] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-950 transition-all hover:bg-[#e0b560] active:scale-95"
        >
          Play Again
        </button>
      </motion.div>
    </div>
  );
}
