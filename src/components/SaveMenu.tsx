"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTournament } from "@/lib/store";
import { getSaveSlots, removeSaveSlot } from "@/lib/saves";

export function SaveMenu({ onClose }: { onClose: () => void }) {
  const { saveSlot, loadSlot, deleteSlot, currentPastebinId } = useTournament();
  const [saveName, setSaveName] = useState("");
  const [tab, setTab] = useState<"save" | "load">("save");
  const [, forceUpdate] = useState(0);

  const slots = getSaveSlots().filter(
    (s) => s.pastebinId === currentPastebinId
  );

  const handleSave = (overwriteId?: string) => {
    const name = saveName.trim() || `Save ${new Date().toLocaleString()}`;
    if (overwriteId) {
      deleteSlot(overwriteId);
    }
    saveSlot(name);
    setSaveName("");
    forceUpdate((v) => v + 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="mx-4 w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-md bg-zinc-900 p-1">
            <button
              onClick={() => setTab("save")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "save"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Save
            </button>
            <button
              onClick={() => setTab("load")}
              className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "load"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              Load
            </button>
          </div>

          {tab === "save" && (
            <div className="space-y-3">
              {/* New save */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Save name (optional)"
                  className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600"
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <button
                  onClick={() => handleSave()}
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
                >
                  New
                </button>
              </div>

              {/* Existing saves to overwrite */}
              {slots.length > 0 && (
                <>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                    Or overwrite existing
                  </p>
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {slots
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
                              {new Date(slot.savedAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleSave(slot.id)}
                            className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                          >
                            Overwrite
                          </button>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "load" && (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {slots.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-600">
                  No saves for this roster
                </p>
              ) : (
                slots
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
                          {new Date(slot.savedAt).toLocaleString()} &middot;{" "}
                          {slot.roster.length} characters
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          loadSlot(slot);
                          onClose();
                        }}
                        className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-zinc-200"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => {
                          removeSaveSlot(slot.id);
                          forceUpdate((v) => v + 1);
                        }}
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
                  ))
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-4 w-full rounded-md border border-zinc-800 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
