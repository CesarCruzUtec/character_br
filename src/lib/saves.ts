import { SaveSlot } from "./store";

const SAVES_KEY = "tournament_saves";
const AUTOSAVE_KEY = "tournament_autosave";

// --- Autosave functions ---

export function getAutosave(): SaveSlot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveSlot;
  } catch {
    return null;
  }
}

export function setAutosave(slot: SaveSlot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(slot));
  } catch {
    // Storage full — silently ignore
  }
}

export function clearAutosave() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTOSAVE_KEY);
}

// --- Regular save functions ---

export function getSaveSlots(): SaveSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SaveSlot[];
  } catch {
    return [];
  }
}

function writeSaveSlots(slots: SaveSlot[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(slots));
  } catch {
    // Storage full — silently ignore
  }
}

export function addSaveSlot(slot: SaveSlot) {
  const slots = getSaveSlots();
  slots.push(slot);
  writeSaveSlots(slots);
}

export function removeSaveSlot(slotId: string) {
  const slots = getSaveSlots().filter((s) => s.id !== slotId);
  writeSaveSlots(slots);
}

export function exportSaves(): string {
  return JSON.stringify(getSaveSlots(), null, 2);
}

export function importSaves(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return false;
    // Basic validation
    for (const item of data) {
      if (!item.id || !item.name || !item.roster || !Array.isArray(item.rounds)) {
        return false;
      }
    }
    const existing = getSaveSlots();
    const existingIds = new Set(existing.map((s) => s.id));
    const newSlots = data.filter((s: SaveSlot) => !existingIds.has(s.id));
    writeSaveSlots([...existing, ...newSlots]);
    return true;
  } catch {
    return false;
  }
}

export function downloadSaves() {
  const json = exportSaves();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tournament-saves.json";
  a.click();
  URL.revokeObjectURL(url);
}
