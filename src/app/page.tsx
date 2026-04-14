"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament } from "@/lib/store";
import { LoadPanel } from "@/components/LoadPanel";
import { getAutosave } from "@/lib/saves";
import type { SaveSlot } from "@/lib/store";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  type FavoriteEntry,
} from "@/lib/favorites";

export default function HomePage() {
  const [pastebinId, setPastebinId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [autosave, setAutosave] = useState<SaveSlot | null>(null);
  const router = useRouter();
  const { setRoster, setCurrentPastebinId, loadAutosave } = useTournament();

  // Load favorites and autosave on mount
  useEffect(() => {
    setFavorites(getFavorites());
    setAutosave(getAutosave());
  }, []);

  // Track whether current ID is favorited
  useEffect(() => {
    setIsFav(favorites.some((f) => f.id === pastebinId.trim()));
  }, [pastebinId, favorites]);

  const handleToggleFavorite = useCallback(() => {
    const trimmed = pastebinId.trim();
    if (!trimmed) return;
    if (isFav) {
      setFavorites(removeFavorite(trimmed));
    } else {
      setFavorites(addFavorite(trimmed));
    }
  }, [pastebinId, isFav]);

  const handleSelectFavorite = useCallback((id: string) => {
    setPastebinId(id);
  }, []);

  const handleRemoveFavorite = useCallback((id: string) => {
    setFavorites(removeFavorite(id));
  }, []);

  const handleStart = useCallback(async () => {
    const trimmed = pastebinId.trim();
    if (!trimmed) {
      setError("Please enter a Pastebin ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorDetails([]);

    try {
      const res = await fetch(`/api/fetch-roster?id=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch roster");
        if (data.details) {
          setErrorDetails(data.details);
        }
        return;
      }

      setRoster(data);
      setCurrentPastebinId(trimmed);
      router.push("/tournament");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, [pastebinId, setRoster, setCurrentPastebinId, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleStart();
    },
    [handleStart]
  );

  return (
    <main className="flex min-h-screen bg-[#09090b] px-4 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row">
        {/* Left panel: main content */}
        <motion.div
          className="flex-1 flex flex-col items-center justify-center text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo / Title */}
          <motion.div
            className="mb-10"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <h1
              className="text-6xl tracking-wider text-white md:text-7xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              BATTLE
              <span className="block text-[#d4a853]">ROYALE</span>
            </h1>
            <p className="mt-4 text-sm tracking-widest uppercase text-zinc-500">
              The ultimate character tournament
            </p>
          </motion.div>

          {/* Input Section */}
          <motion.div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <label className="mb-2 block text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
              Pastebin ID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={pastebinId}
                onChange={(e) => setPastebinId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. abc123XYZ"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:border-[#d4a853]/50 focus:ring-1 focus:ring-[#d4a853]/30"
                disabled={isLoading}
              />
              <button
                onClick={handleToggleFavorite}
                disabled={!pastebinId.trim()}
                title={isFav ? "Remove from favorites" : "Add to favorites"}
                className={`shrink-0 rounded-lg border px-3 py-3 text-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed ${
                  isFav
                    ? "border-[#d4a853] bg-[#d4a853]/10 text-[#d4a853]"
                    : "border-zinc-700 text-zinc-500 hover:border-[#d4a853]/50 hover:text-[#d4a853]"
                }`}
              >
                {isFav ? "★" : "☆"}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-left"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="text-sm font-medium text-red-400">{error}</p>
                  {errorDetails.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {errorDetails.map((detail, i) => (
                        <li key={i} className="text-xs text-red-400/60">
                          • {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={handleStart}
              disabled={isLoading || !pastebinId.trim()}
              className="mt-4 w-full rounded-lg bg-[#d4a853] py-3 text-sm font-semibold uppercase tracking-wider text-zinc-950 transition-all hover:bg-[#e0b560] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-[#d4a853]"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block"
                  >
                    ◌
                  </motion.span>
                  Loading
                </span>
              ) : (
                "Start Tournament"
              )}
            </motion.button>

            <div className="mt-3">
              <LoadPanel />
            </div>

            {autosave && (
              <motion.button
                onClick={() => {
                  loadAutosave();
                  router.push("/tournament");
                }}
                className="mt-2 w-full rounded-lg border border-[#d4a853]/30 bg-zinc-900 py-3 text-sm font-medium text-[#d4a853] transition-all hover:bg-zinc-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Resume Autosave
              </motion.button>
            )}

            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs text-zinc-600">or</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            <motion.button
              onClick={() => router.push("/creator")}
              className="mt-3 w-full rounded-lg border border-zinc-700 py-2.5 text-xs font-medium uppercase tracking-wider text-zinc-400 transition-all hover:border-[#d4a853]/50 hover:text-[#d4a853]"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Create a Roster
            </motion.button>
          </motion.div>

          {/* Instructions */}
          <motion.div
            className="mt-8 w-full max-w-md text-left text-xs text-zinc-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="mb-2 font-medium uppercase tracking-wider text-zinc-500">How to use</p>
            <ol className="list-inside list-decimal space-y-1.5 leading-relaxed">
              <li>Create a Pastebin with your character JSON</li>
              <li>Paste the Pastebin ID above</li>
              <li>Vote on matchups until a champion emerges</li>
            </ol>
            <p className="mt-3 text-xs text-zinc-600">
              Expected JSON: Array of objects with <code className="text-[#d4a853]">id</code>,{" "}
              <code className="text-[#d4a853]">name</code>,{" "}
              <code className="text-[#d4a853]">description</code>,{" "}
              <code className="text-[#d4a853]">images</code> (array of URLs), and optional{" "}
              <code className="text-[#d4a853]">music</code> (URL).
            </p>
          </motion.div>
        </motion.div>

        {/* Right panel: Favorites */}
        <motion.div
          className="flex w-full flex-col lg:w-72 lg:shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="sticky top-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
            <div className="border-b border-zinc-800 px-5 py-3">
              <h2
                className="text-sm tracking-wider uppercase text-zinc-400"
                style={{ fontFamily: "var(--font-display)" }}
              >
                ★ Favorites
              </h2>
            </div>

            {favorites.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-zinc-600">
                  No favorites yet. Star a Pastebin ID to save it here.
                </p>
              </div>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto scrollbar-thin">
                {favorites.map((fav) => (
                  <li key={fav.id}>
                    <button
                      onClick={() => handleSelectFavorite(fav.id)}
                      className="group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-zinc-800/50"
                    >
                      <span className="text-[#d4a853] text-xs">★</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{fav.name}</p>
                        <p className="text-xs text-zinc-600 truncate font-mono">{fav.id}</p>
                      </div>
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFavorite(fav.id);
                        }}
                        className="shrink-0 rounded px-1 py-0.5 text-xs text-zinc-600 opacity-0 transition-all group-hover:opacity-100 hover:text-red-400 hover:bg-red-950/30"
                      >
                        ✕
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
