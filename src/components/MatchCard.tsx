"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Character } from "@/lib/types";

interface MatchCardProps {
  character: Character;
  onVote: (character: Character) => void;
  onHoverStart: (character: Character) => void;
  onHoverEnd: (character: Character) => void;
  side: "left" | "right";
  isHovered: boolean;
}

export function MatchCard({
  character,
  onVote,
  onHoverStart,
  onHoverEnd,
  side,
  isHovered,
}: MatchCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = useCallback(() => {
    onVote(character);
  }, [character, onVote]);

  const handleMouseEnter = useCallback(() => {
    onHoverStart(character);
  }, [character, onHoverStart]);

  const handleMouseLeave = useCallback(() => {
    onHoverEnd(character);
  }, [character, onHoverEnd]);

  // Mobile: tap to preview, tap again to vote
  const handleMobileTap = useCallback(() => {
    if (window.innerWidth < 768) {
      if (!isExpanded) {
        setIsExpanded(true);
        onHoverStart(character);
      } else {
        onVote(character);
      }
    } else {
      // Desktop: click to vote directly
      onVote(character);
    }
  }, [isExpanded, character, onHoverStart, onVote]);

  const isLeft = side === "left";

  return (
    <motion.div
      className={`relative flex-1 cursor-pointer select-none overflow-hidden ${isLeft ? "clip-left" : "clip-right"}`}
      initial={{ x: isLeft ? -200 : 200, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        flex: isHovered ? 1.12 : 1,
      }}
      exit={{ x: isLeft ? -200 : 200, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      onHoverStart={handleMouseEnter}
      onHoverEnd={handleMouseLeave}
      onClick={handleMobileTap}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        {!imgError ? (
          <img
            src={character.images[0]}
            alt={character.name}
            className={`h-full w-full ${
              isLeft ? "object-right-bottom" : "object-left-bottom"
            } object-contain`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-800">
            <span className="text-6xl">🎭</span>
          </div>
        )}
      </div>

      {/* Bottom gradient for name readability */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Name — always visible at bottom */}
      <motion.div
        className={`absolute bottom-6 ${isLeft ? "left-6" : "right-6"} z-10`}
        animate={{ scale: isHovered ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <h2
          className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] md:text-5xl lg:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {character.name}
        </h2>
      </motion.div>

      {/* Music icon */}
      {character.music && (
        <motion.div
          className={`absolute top-4 ${isLeft ? "left-4" : "right-4"} flex h-8 w-8 items-center justify-center rounded-full bg-purple-600/80 text-sm backdrop-blur-sm`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          🎵
        </motion.div>
      )}

      {/* Mobile expanded overlay */}
      {isExpanded && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3
            className="text-3xl font-black text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {character.name}
          </h3>
          <p className="mt-2 max-w-xs px-4 text-center text-sm text-gray-300">
            {character.description}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="mt-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 text-base font-bold text-white"
          >
            👑 Vote as Winner
          </button>
          <p className="mt-2 text-xs text-gray-400">Tap elsewhere to cancel</p>
        </motion.div>
      )}
    </motion.div>
  );
}
