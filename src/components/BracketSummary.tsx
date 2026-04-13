"use client";

import { motion } from "framer-motion";
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
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <h2 className="mb-4 text-2xl font-bold text-yellow-400 md:text-3xl">
            🏆 Tournament Champion 🏆
          </h2>
        </motion.div>

        <motion.div
          className="mx-auto inline-block overflow-hidden rounded-2xl border-4 border-yellow-400 bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl shadow-yellow-500/20"
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
          <div className="p-4">
            <h3 className="text-2xl font-bold text-white">{winner.name}</h3>
            <p className="mt-1 text-sm text-gray-400">{winner.description}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Confetti effect using CSS */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-3 w-3 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: [
                "#f59e0b",
                "#8b5cf6",
                "#ec4899",
                "#3b82f6",
                "#10b981",
              ][i % 5],
            }}
            initial={{ y: -20, opacity: 1, rotate: 0 }}
            animate={{
              y: typeof window !== "undefined" ? window.innerHeight + 20 : 1000,
              opacity: 0,
              rotate: 720,
              x: (Math.random() - 0.5) * 200,
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              delay: Math.random() * 1.5,
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
        <h3 className="mb-6 text-center text-xl font-bold text-gray-300">
          Tournament Summary
        </h3>

        <div className="space-y-6">
          {rounds.map(([roundName, losers], roundIdx) => (
            <motion.div
              key={roundName}
              className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8 + roundIdx * 0.2 }}
            >
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-red-400">
                Eliminated in {roundName}
              </h4>
              <div className="flex flex-wrap gap-3">
                {losers.map((char) => (
                  <div
                    key={String(char.id)}
                    className="flex items-center gap-2 rounded-lg bg-gray-700/50 px-3 py-2"
                  >
                    <div className="h-8 w-8 overflow-hidden rounded-full">
                      <img
                        src={char.images[0]}
                        alt={char.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-sm text-gray-300">{char.name}</span>
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
          className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-lg font-bold text-white shadow-lg transition-all hover:from-purple-500 hover:to-pink-500 hover:shadow-purple-500/25 active:scale-95"
        >
          🔄 Play Again
        </button>
      </motion.div>
    </div>
  );
}
