"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Character } from "@/lib/types";

interface MatchCardProps {
  character: Character;
  onVote: (character: Character) => void;
  onHoverStart: (character: Character) => void;
  onHoverEnd: (character: Character) => void;
  side: "left" | "right";
  isHovered: boolean;
  isOtherHovered: boolean;
}

export function MatchCard({
  character,
  onVote,
  onHoverStart,
  onHoverEnd,
  side,
  isHovered,
  isOtherHovered,
}: MatchCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on client only (avoids hydration mismatch)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cycle through images smoothly
  useEffect(() => {
    if (character.images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % character.images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [character.images.length]);

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
    if (isMobile) {
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
  }, [isMobile, isExpanded, character, onHoverStart, onVote]);

  const isLeft = side === "left";

  return (
    <motion.div
      className="relative flex-1 cursor-pointer select-none overflow-hidden"
      initial={{ x: isLeft ? -200 : 200, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        flexGrow: isHovered ? 1.1 : isOtherHovered ? 0.9 : 1,
        filter: isOtherHovered ? "blur(3px)" : "blur(0px)",
      }}
      exit={{ x: isLeft ? -200 : 200, opacity: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      onHoverStart={handleMouseEnter}
      onHoverEnd={handleMouseLeave}
      onClick={handleMobileTap}
    >
      {/* Background images with crossfade */}
      <div className="absolute inset-0 bg-zinc-950">
        {!imgError ? (
          character.images.map((img, index) => (
            <motion.img
              key={img}
              src={img}
              alt={character.name}
              className={`absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] ${
                isLeft ? "object-right-bottom" : "object-left-bottom"
              } object-contain`}
              initial={false}
              animate={{
                opacity: index === currentImageIndex ? 1 : 0,
              }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              onError={() => setImgError(true)}
            />
          ))
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900">
            <span className="text-6xl">🎭</span>
          </div>
        )}
      </div>

      {/* Top gradient for name readability */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />

      {/* Name — always visible at top */}
      <motion.div
        className={`absolute top-6 ${isLeft ? "left-6" : "right-6"} z-10`}
        animate={{ scale: isHovered ? 1.05 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <h2
          className="text-4xl tracking-wider text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] md:text-6xl lg:text-7xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {character.name}
        </h2>
      </motion.div>

      {/* Music icon */}
      {character.music && (
        <motion.div
          className={`absolute top-20 ${isLeft ? "left-6" : "right-6"} flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600/50 bg-zinc-900/60 text-xs backdrop-blur-sm`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          ♪
        </motion.div>
      )}

      {/* Mobile expanded overlay */}
      {isExpanded && (
        <motion.div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3
            className="text-4xl tracking-wider text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {character.name}
          </h3>
          <p className="mt-3 max-w-xs px-4 text-center text-sm leading-relaxed text-zinc-300">
            {character.description}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="mt-5 rounded-lg bg-[#d4a853] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-zinc-950"
          >
            Vote as Winner
          </button>
          <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-500">Tap elsewhere to cancel</p>
        </motion.div>
      )}
    </motion.div>
  );
}
