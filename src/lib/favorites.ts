const STORAGE_KEY = "tournament_favorites";

export interface FavoriteEntry {
  id: string; // pastebin ID
  name: string; // user-given label or auto-generated
  addedAt: number;
}

function load(): FavoriteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(favs: FavoriteEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

export function getFavorites(): FavoriteEntry[] {
  return load();
}

export function addFavorite(id: string, name?: string): FavoriteEntry[] {
  const favs = load();
  if (favs.some((f) => f.id === id)) return favs;
  const entry: FavoriteEntry = {
    id,
    name: name || id,
    addedAt: Date.now(),
  };
  const updated = [entry, ...favs];
  save(updated);
  return updated;
}

export function removeFavorite(id: string): FavoriteEntry[] {
  const favs = load().filter((f) => f.id !== id);
  save(favs);
  return favs;
}

export function isFavorite(id: string): boolean {
  return load().some((f) => f.id === id);
}

export function renameFavorite(id: string, name: string): FavoriteEntry[] {
  const favs = load().map((f) => (f.id === id ? { ...f, name } : f));
  save(favs);
  return favs;
}
