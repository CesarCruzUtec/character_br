"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Character } from "@/lib/types";

interface HoverInfoCardProps {
  character: Character | null;
}

export function HoverInfoCard({ character }: HoverInfoCardProps) {
  return (
    <AnimatePresence>
      {character && (
        <motion.div
          className="pointer-events-none absolute bottom-6 left-1/2 z-30 w-[75%] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-2xl backdrop-blur-xl"
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="max-h-32 overflow-y-auto px-6 py-4 scrollbar-thin md:max-h-40">
            <p className="text-sm leading-relaxed text-gray-200 md:text-base">
              {character.description}
            </p>
          </div>

          {/* Bottom accent line */}
          <div className="h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
