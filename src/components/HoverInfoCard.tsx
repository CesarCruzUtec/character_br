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
          className="pointer-events-none absolute bottom-6 left-1/2 z-30 hidden w-[70%] -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur-xl md:block"
          initial={{ y: 20, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="max-h-32 overflow-y-auto px-5 py-3 scrollbar-thin md:max-h-40">
            <p className="text-sm leading-relaxed text-zinc-300 md:text-[15px]">
              {character.description}
            </p>
          </div>

          {/* Bottom accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#d4a853]/40 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
