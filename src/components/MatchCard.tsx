"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Character } from "@/lib/types";

const LONG_PRESS_MS = 500;

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  // Portal mount guard
  useEffect(() => { setMounted(true); }, []);

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
    }, 3000);
    return () => clearInterval(interval);
  }, [character.images.length]);

  const handleMouseEnter = useCallback(() => {
    onHoverStart(character);
  }, [character, onHoverStart]);

  const handleMouseLeave = useCallback(() => {
    onHoverEnd(character);
  }, [character, onHoverEnd]);

  // ── Long-press logic (touch only) ──────────────────────────────────

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isMobile) return;
      // Only handle touch/pen; ignore mouse on mobile-sized windows
      if (e.pointerType === "mouse") return;
      didLongPress.current = false;
      longPressTimer.current = setTimeout(() => {
        didLongPress.current = true;
        setShowInfoModal(true);
      }, LONG_PRESS_MS);
    },
    [isMobile]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isMobile) return;
      if (e.pointerType === "mouse") return;
      cancelLongPress();
      // If it wasn't a long press → vote
      if (!didLongPress.current) {
        onVote(character);
      }
    },
    [isMobile, cancelLongPress, character, onVote]
  );

  const handlePointerCancel = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  // Desktop click
  const handleClick = useCallback(() => {
    if (isMobile) return; // handled by pointer events on mobile
    onVote(character);
  }, [isMobile, character, onVote]);

  const isLeft = side === "left";

  return (
    <>
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
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
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
          className="absolute top-4 left-4 right-4 z-10 md:top-6 md:right-auto md:left-6"
          style={isLeft ? {} : { left: "auto", right: "1.5rem", textAlign: "right" }}
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <h2
            className="text-3xl tracking-wider text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {character.name}
          </h2>
        </motion.div>

        {/* Music icon */}
        {character.music && (
          <motion.div
            className={`absolute top-16 md:top-20 ${isLeft ? "left-4 md:left-6" : "right-4 md:right-6"} flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600/50 bg-zinc-900/60 text-xs backdrop-blur-sm`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            ♪
          </motion.div>
        )}

        {/* Long-press hint — mobile only, bottom of card */}
        <div className="absolute bottom-3 inset-x-0 flex justify-center md:hidden">
          <span className="rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-500 backdrop-blur-sm">
            Hold for info · Tap to vote
          </span>
        </div>
      </motion.div>

      {/* Info modal — rendered in a portal so it's never clipped by the card */}
      {mounted && createPortal(
        <AnimatePresence>
          {showInfoModal && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-end justify-center p-4 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              {/* Sheet */}
              <motion.div
                className="relative z-10 w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Character image strip */}
                <div className="h-36 w-full overflow-hidden rounded-t-2xl bg-zinc-950">
                  <img
                    src={character.images[currentImageIndex]}
                    alt={character.name}
                    className="h-full w-full object-cover object-top"
                  />
                </div>

                <div className="px-5 pb-5 pt-4">
                  <h3
                    className="text-2xl tracking-wider text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {character.name}
                  </h3>

                  {/* Scrollable description */}
                  <div className="mt-3 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                    <p className="text-sm leading-relaxed text-zinc-300">
                      {character.description}
                    </p>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setShowInfoModal(false)}
                      className="flex-1 rounded-lg border border-zinc-700 py-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowInfoModal(false);
                        onVote(character);
                      }}
                      className="flex-1 rounded-lg bg-[#d4a853] py-3 text-sm font-semibold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-[#e0b560]"
                    >
                      Vote ✓
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
