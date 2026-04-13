"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Character } from "@/lib/types";

interface MatchCardProps {
  character: Character;
  onVote: (character: Character) => void;
  onHoverStart: (character: Character) => void;
  onHoverEnd: (character: Character) => void;
  isWinner?: boolean;
}

export function MatchCard({
  character,
  onVote,
  onHoverStart,
  onHoverEnd,
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

  // Mobile: tap to expand/preview, tap again to vote
  const handleMobileTap = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true);
      onHoverStart(character);
    } else {
      onVote(character);
    }
  }, [isExpanded, character, onHoverStart, onVote]);

  return (
    <motion.div
      className="relative cursor-pointer select-none"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      onHoverStart={handleMouseEnter}
      onHoverEnd={handleMouseLeave}
      onClick={handleMobileTap}
      layout
    >
      <div className="relative overflow-hidden rounded-2xl border-2 border-white/10 bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl transition-all hover:border-purple-500/50 hover:shadow-purple-500/20">
        {/* Image */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          {!imgError ? (
            <img
              src={character.images[0]}
              alt={character.name}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-700">
              <span className="text-4xl">🎭</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <h3 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
            {character.name}
          </h3>
          <p className="mt-1 text-sm text-gray-300 line-clamp-2">
            {character.description}
          </p>

          {/* Music indicator */}
          {character.music && (
            <div className="mt-2 flex items-center gap-1 text-xs text-purple-300">
              <span>🎵</span>
              <span>Has theme music</span>
            </div>
          )}
        </div>

        {/* Vote button - visible on desktop hover or mobile expanded */}
        <motion.button
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-600 to-purple-600/80 py-3 text-center font-bold text-white opacity-0 transition-opacity hover:from-purple-500 hover:to-purple-500/80 md:hover:opacity-100"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          👑 Vote as Winner
        </motion.button>

        {/* Mobile expanded state indicator */}
        {isExpanded && (
          <motion.div
            className="absolute right-3 top-3 rounded-full bg-purple-600 px-3 py-1 text-xs font-bold text-white md:hidden"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            Tap to vote
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
