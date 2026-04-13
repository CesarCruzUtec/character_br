"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament } from "@/lib/store";

export default function HomePage() {
  const [pastebinId, setPastebinId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const router = useRouter();
  const { setRoster } = useTournament();

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
      router.push("/tournament");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  }, [pastebinId, setRoster, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleStart();
    },
    [handleStart]
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4">
      <motion.div
        className="w-full max-w-md text-center"
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
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <label className="mb-2 block text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
            Pastebin ID
          </label>
          <input
            type="text"
            value={pastebinId}
            onChange={(e) => setPastebinId(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. abc123XYZ"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-white placeholder-zinc-600 outline-none transition-all focus:border-[#d4a853]/50 focus:ring-1 focus:ring-[#d4a853]/30"
            disabled={isLoading}
          />

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
        </motion.div>

        {/* Instructions */}
        <motion.div
          className="mt-8 text-left text-xs text-zinc-600"
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
    </main>
  );
}
