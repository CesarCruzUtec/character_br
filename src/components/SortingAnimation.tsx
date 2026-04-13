"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Character } from "@/lib/types";
import { useEffect, useState } from "react";

interface SortingAnimationProps {
  characters: Character[];
  roundName: string;
  onComplete: () => void;
}

export function SortingAnimation({
  characters,
  roundName,
  onComplete,
}: SortingAnimationProps) {
  const [phase, setPhase] = useState<"shuffling" | "pairing" | "done">(
    "shuffling"
  );

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("pairing"), 1500);
    const timer2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  // Create pairs for display
  const pairs: [Character, Character | null][] = [];
  for (let i = 0; i < characters.length; i += 2) {
    if (i + 1 < characters.length) {
      pairs.push([characters[i], characters[i + 1]]);
    } else {
      pairs.push([characters[i], null]);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/95 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Title */}
        <motion.h2
          className="mb-2 text-3xl font-bold text-white md:text-4xl"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {roundName}
        </motion.h2>

        <motion.p
          className="mb-8 text-lg text-purple-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {phase === "shuffling" && "🎲 Shuffling contestants..."}
          {phase === "pairing" && "⚔️ Drawing matchups..."}
          {phase === "done" && "✅ Ready!"}
        </motion.p>

        {/* Character avatars shuffling */}
        <div className="flex flex-wrap items-center justify-center gap-3 px-4 max-w-4xl">
          {characters.map((char, i) => (
            <motion.div
              key={String(char.id)}
              className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-purple-500/50 md:h-16 md:w-16"
              initial={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                opacity: 0,
                scale: 0,
              }}
              animate={
                phase === "shuffling"
                  ? {
                      x: [
                        (Math.random() - 0.5) * 200,
                        (Math.random() - 0.5) * 200,
                        0,
                      ],
                      y: [
                        (Math.random() - 0.5) * 100,
                        (Math.random() - 0.5) * 100,
                        0,
                      ],
                      opacity: 1,
                      scale: 1,
                      rotate: [0, 360, 0],
                    }
                  : phase === "pairing"
                  ? {
                      x: 0,
                      y: 0,
                      opacity: 1,
                      scale: 1,
                      rotate: 0,
                    }
                  : {
                      opacity: 0.6,
                      scale: 0.8,
                    }
              }
              transition={{
                duration: phase === "shuffling" ? 1.2 : 0.8,
                delay: i * 0.05,
                ease: "easeInOut",
              }}
            >
              <img
                src={char.images[0]}
                alt={char.name}
                className="h-full w-full object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* Pairing lines */}
        {phase === "pairing" && (
          <motion.div
            className="mt-8 flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {pairs.slice(0, 6).map(([c1, c2], i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 text-sm text-gray-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <span className="font-medium text-white">{c1.name}</span>
                <span className="text-purple-400 font-bold">VS</span>
                <span className="font-medium text-white">
                  {c2 ? c2.name : "BYE"}
                </span>
              </motion.div>
            ))}
            {pairs.length > 6 && (
              <span className="text-xs text-gray-500">
                ...and {pairs.length - 6} more matches
              </span>
            )}
          </motion.div>
        )}

        {/* Progress bar */}
        <motion.div
          className="mt-8 h-1 w-64 overflow-hidden rounded-full bg-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, ease: "linear" }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
