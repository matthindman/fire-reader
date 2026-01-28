import { get, set } from 'idb-keyval';
import type { SaveData } from './types';

const DEFAULT: SaveData = {
  unlockedLevel: 1,
  words: {},
  muted: false,
  contrastHigh: false
};

let memStore: SaveData | null = null;

let storageAvailable = true;
let storageChecked = false;

export function isStorageAvailable(): boolean {
  return storageAvailable;
}

export function hasStorageBeenChecked(): boolean {
  return storageChecked;
}

export async function loadProfile(): Promise<SaveData> {
  try {
    const val = await get<SaveData>('fire-reader');
    storageChecked = true;
    storageAvailable = true;

    const merged = val ? { ...DEFAULT, ...val, words: val.words ?? {} } : { ...DEFAULT };

    for (const k of Object.keys(merged.words)) {
      const w = merged.words[k];
      w.successes = Number.isFinite(w.successes) ? w.successes : 0;
      w.ease = Number.isFinite(w.ease) ? w.ease : 1.3;
      w.interval = Number.isFinite(w.interval) ? w.interval : 0;
      w.due = Number.isFinite(w.due) ? w.due : 0;
    }
    return merged;
  } catch {
    storageChecked = true;
    storageAvailable = false;
    return memStore ? { ...DEFAULT, ...memStore } : { ...DEFAULT };
  }
}

export async function saveProfile(state: SaveData): Promise<boolean> {
  try {
    await set('fire-reader', state);
    storageAvailable = true;
    return true;
  } catch {
    memStore = state;
    storageAvailable = false;
    return false;
  }
}

// Debounced saves (performance)
let pending: SaveData | null = null;
let timer: number | null = null;

export function debouncedSaveProfile(state: SaveData, delayMs = 500): void {
  pending = state;
  if (timer) window.clearTimeout(timer);
  timer = window.setTimeout(async () => {
    if (!pending) return;
    await saveProfile(pending);
    pending = null;
    timer = null;
  }, delayMs);
}

export async function flushSaveProfile(): Promise<boolean> {
  if (timer) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (pending) {
    const ok = await saveProfile(pending);
    pending = null;
    return ok;
  }
  return storageAvailable;
}
