"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTournament } from "@/lib/store";
import { extractYouTubeVideoId, isYouTubeUrl } from "@/lib/youtube";

// ── Types ────────────────────────────────────────────────────────────

interface CharacterForm {
  tempId: string;
  name: string;
  description: string;
  images: string[];
  music: string;
}

function createEmptyCard(): CharacterForm {
  return {
    tempId: crypto.randomUUID(),
    name: "",
    description: "",
    images: [""],
    music: "",
  };
}

function nameToId(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// ── Hover Preview Components ─────────────────────────────────────────

function ImagePreview({ url, children }: { url: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setShow(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setShow(false), 150);
  };

  return (
    <span className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <AnimatePresence>
        {show && url && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-0 mb-2 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-1"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {url && (
              <img
                src={url}
                alt="Preview"
                className="max-w-[200px] max-h-[200px] rounded object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function MusicPreview({ url, children }: { url: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setShow(true);
    if (audioRef.current && !isYouTubeUrl(url)) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShow(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }, 150);
  };

  const ytId = isYouTubeUrl(url) ? extractYouTubeVideoId(url) : null;

  return (
    <span className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      <AnimatePresence>
        {show && url && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bottom-full left-0 mb-2 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-2"
          >
            {ytId ? (
              <iframe
                width="280"
                height="158"
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="rounded"
              />
            ) : (
              <audio ref={audioRef} src={url} controls autoPlay className="w-[280px] h-8" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!show && url && !ytId && <audio ref={audioRef} src={url} preload="none" />}
    </span>
  );
}

// ── Character Card ───────────────────────────────────────────────────

function CharacterCard({
  card,
  index,
  onChange,
  onDelete,
}: {
  card: CharacterForm;
  index: number;
  onChange: (index: number, updated: CharacterForm) => void;
  onDelete: (index: number) => void;
}) {
  const updateField = <K extends keyof CharacterForm>(field: K, value: CharacterForm[K]) => {
    onChange(index, { ...card, [field]: value });
  };

  const updateImage = (imgIndex: number, value: string) => {
    const imgs = [...card.images];
    imgs[imgIndex] = value;
    updateField("images", imgs);
  };

  const addImage = () => updateField("images", [...card.images, ""]);

  const removeImage = (imgIndex: number) => {
    if (card.images.length <= 1) return;
    updateField("images", card.images.filter((_, i) => i !== imgIndex));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Character #{index + 1}
        </span>
        <button
          onClick={() => onDelete(index)}
          className="rounded-md px-2 py-1 text-xs text-red-400 hover:bg-red-950/50 transition-colors"
        >
          ✕ Delete
        </button>
      </div>

      {/* Name */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-zinc-400">Name</label>
        <input
          type="text"
          value={card.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Character name"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#d4a853]/50 focus:ring-1 focus:ring-[#d4a853]/30"
        />
        {card.name && (
          <p className="mt-1 text-xs text-zinc-600">ID: {nameToId(card.name)}</p>
        )}
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-zinc-400">Description</label>
        <textarea
          value={card.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Short description"
          rows={2}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none resize-none focus:border-[#d4a853]/50 focus:ring-1 focus:ring-[#d4a853]/30"
        />
      </div>

      {/* Images */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-zinc-400">Image URLs</label>
        {card.images.map((img, imgIdx) => (
          <div key={imgIdx} className="flex items-center gap-2 mb-1.5">
            <ImagePreview url={img}>
              <span className="shrink-0 text-zinc-600 text-xs cursor-default">
                {imgIdx + 1}.
              </span>
            </ImagePreview>
            <input
              type="text"
              value={img}
              onChange={(e) => updateImage(imgIdx, e.target.value)}
              placeholder="https://example.com/image.png"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#d4a853]/50 focus:ring-1 focus:ring-[#d4a853]/30"
            />
            <button
              onClick={() => removeImage(imgIdx)}
              disabled={card.images.length <= 1}
              className="shrink-0 rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-950/50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={addImage}
          className="text-xs text-[#d4a853] hover:text-[#e0b560] transition-colors"
        >
          + Add image
        </button>
      </div>

      {/* Music */}
      <div>
        <label className="mb-1 block text-xs text-zinc-400">Music URL (optional)</label>
        <MusicPreview url={card.music}>
          <input
            type="text"
            value={card.music}
            onChange={(e) => updateField("music", e.target.value)}
            placeholder="https://youtube.com/watch?v=... or audio file URL"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#d4a853]/50 focus:ring-1 focus:ring-[#d4a853]/30"
          />
        </MusicPreview>
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function CreatorPage() {
  const [cards, setCards] = useState<CharacterForm[]>([createEmptyCard(), createEmptyCard()]);
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { setRoster, setCurrentPastebinId } = useTournament();

  // ── Card operations ──────────────────────────────────────────────

  const handleCardChange = useCallback((index: number, updated: CharacterForm) => {
    setCards((prev) => prev.map((c, i) => (i === index ? updated : c)));
  }, []);

  const handleDelete = useCallback((index: number) => {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddCard = useCallback(() => {
    setCards((prev) => [...prev, createEmptyCard()]);
  }, []);

  // ── JSON generation ──────────────────────────────────────────────

  const jsonOutput = useMemo(() => {
    const roster = cards
      .filter((c) => c.name.trim())
      .map((c) => ({
        id: nameToId(c.name),
        name: c.name.trim(),
        description: c.description.trim(),
        images: c.images.map((s) => s.trim()).filter(Boolean),
        ...(c.music.trim() ? { music: c.music.trim() } : {}),
      }));
    return JSON.stringify(roster, null, 2);
  }, [cards]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [jsonOutput]);

  // ── File upload ──────────────────────────────────────────────────

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setUploadError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result as string;
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) throw new Error("JSON must be an array");

          const loaded: CharacterForm[] = parsed.map((item: Record<string, unknown>) => ({
            tempId: crypto.randomUUID(),
            name: String(item.name ?? ""),
            description: String(item.description ?? ""),
            images: Array.isArray(item.images) ? item.images.map(String) : [""],
            music: typeof item.music === "string" ? item.music : "",
          }));

          if (loaded.length === 0) throw new Error("No characters found in file");
          setCards(loaded);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : "Failed to parse file");
        }
      };
      reader.readAsText(file);

      // Reset input so same file can be re-uploaded
      e.target.value = "";
    },
    []
  );

  // ── Start tournament with current roster ─────────────────────────

  const handleStartTournament = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonOutput);
      if (!Array.isArray(parsed) || parsed.length < 2) {
        setUploadError("Need at least 2 characters with names to start a tournament");
        return;
      }
      setRoster(parsed);
      setCurrentPastebinId("");
      router.push("/tournament");
    } catch {
      setUploadError("Invalid roster data");
    }
  }, [jsonOutput, setRoster, setCurrentPastebinId, router]);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/")}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back
            </button>
            <h1
              className="text-xl tracking-wider text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ROSTER <span className="text-[#d4a853]">CREATOR</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Upload File
            </button>
            <button
              onClick={handleStartTournament}
              className="rounded-lg bg-[#d4a853] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-950 hover:bg-[#e0b560] transition-colors"
            >
              Start Tournament
            </button>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="mx-auto max-w-7xl px-4 pt-3">
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
            {uploadError}
            <button
              onClick={() => setUploadError(null)}
              className="ml-2 text-red-400/60 hover:text-red-400"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-2 lg:gap-6">
        {/* Left panel: Card inputs */}
        <div className="space-y-3 overflow-y-auto lg:max-h-[calc(100vh-120px)] scrollbar-thin pr-1">
          <AnimatePresence mode="popLayout">
            {cards.map((card, index) => (
              <CharacterCard
                key={card.tempId}
                card={card}
                index={index}
                onChange={handleCardChange}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>

          <motion.button
            onClick={handleAddCard}
            className="w-full rounded-xl border-2 border-dashed border-zinc-700 py-4 text-sm text-zinc-500 hover:border-[#d4a853]/50 hover:text-[#d4a853] transition-colors"
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
          >
            + Add Character
          </motion.button>
        </div>

        {/* Right panel: JSON preview */}
        <div className="lg:sticky lg:top-[60px] lg:h-[calc(100vh-120px)] h-80">
          <div className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                JSON Preview
              </span>
              <button
                onClick={handleCopy}
                className="rounded-md px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed text-zinc-300 scrollbar-thin font-mono">
              {jsonOutput}
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
