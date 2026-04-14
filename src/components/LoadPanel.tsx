"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament, SaveSlot } from "@/lib/store";
import { getSaveSlots, removeSaveSlot, downloadSaves, importSaves, getAutosave } from "@/lib/saves";

export function LoadPanel() {
  const router = useRouter();
  const { loadSlot } = useTournament();
  const [isOpen, setIsOpen] = useState(false);
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [autosave, setAutosaveSlot] = useState<SaveSlot | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const refreshSlots = () => {
    setSlots(getSaveSlots());
    setAutosaveSlot(getAutosave());
  };

  const handleOpen = () => {
    refreshSlots();
    setIsOpen(true);
  };

  const handleLoad = (slot: SaveSlot) => {
    loadSlot(slot);
    router.push("/tournament");
  };

  const handleDelete = (slotId: string) => {
    removeSaveSlot(slotId);
    refreshSlots();
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const ok = importSaves(text);
        if (ok) {
          setImportError(null);
          refreshSlots();
        } else {
          setImportError("Invalid save file format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Group slots by pastebinId
  const grouped = slots.reduce(
    (acc, slot) => {
      const key = slot.pastebinId || "Unknown";
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    },
    {} as Record<string, SaveSlot[]>
  );

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-3 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
      >
        Load Saved Run
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-white">Saved Runs</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleImport}
                    className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
                    title="Import saves from JSON"
                  >
                    Import
                  </button>
                  <button
                    onClick={downloadSaves}
                    className="rounded-md border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
                    title="Download all saves as JSON"
                  >
                    Export
                  </button>
                </div>
              </div>

              {importError && (
                <p className="mb-3 text-xs text-red-400">{importError}</p>
              )}

              <div className="max-h-80 space-y-4 overflow-y-auto">
                {/* Autosave slot */}
                {autosave && (
                  <div className="rounded-md border border-[#d4a853]/30 bg-zinc-900 p-3">
                    <p className="mb-2 text-[10px] uppercase tracking-widest text-[#d4a853]">
                      Autosave
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {autosave.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(autosave.savedAt).toLocaleString()}{}
                          &middot; {autosave.roster.length} characters
                        </p>
                      </div>
                      <button
                        onClick={() => handleLoad(autosave)}
                        className="shrink-0 rounded-md bg-[#d4a853] px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-[#e0b560]"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                )}

                {slots.length === 0 && !autosave ? (
                  <p className="py-12 text-center text-sm text-zinc-600">
                    No saved runs yet
                  </p>
                ) : slots.length > 0 ? (
                  Object.entries(grouped).map(([pastebinId, groupSlots]) => (
                    <div key={pastebinId}>
                      <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">
                        Roster: {pastebinId}
                      </p>
                      <div className="space-y-2">
                        {groupSlots
                          .sort((a, b) => b.savedAt - a.savedAt)
                          .map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                  {slot.name}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {new Date(slot.savedAt).toLocaleString()}{" "}
                                  &middot; {slot.roster.length} characters
                                </p>
                              </div>
                              <button
                                onClick={() => handleLoad(slot)}
                                className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-zinc-200"
                              >
                                Load
                              </button>
                              <button
                                onClick={() => handleDelete(slot.id)}
                                className="shrink-0 rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
                                title="Delete save"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))
                ) : null}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 w-full rounded-md border border-zinc-800 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
