import { get, set } from 'idb-keyval';
import type { SaveData } from './types';

export const STARTING_UNLOCKED_LEVEL = 2;
const LOCAL_STORAGE_KEY = 'fire-reader';

const DEFAULT: SaveData = {
  unlockedLevel: STARTING_UNLOCKED_LEVEL,
  words: {},
  muted: false,
  contrastHigh: false,
  musicVolume: 1.0,
  sfxVolume: 1.0,
  clearedLevels: [],
  levelStars: {},
  bestStreak: {}
};

let memStore: SaveData | null = null;

let storageAvailable = true;
let storageChecked = false;

function loadLocalProfile(): SaveData | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveLocalProfile(state: SaveData): boolean {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function normalizeProfile(val: SaveData | null | undefined): SaveData {
  const merged = val ? { ...DEFAULT, ...val, words: val.words ? val.words : {} } : { ...DEFAULT };
  if (!Array.isArray(merged.clearedLevels)) merged.clearedLevels = [];
  if (!merged.levelStars || typeof merged.levelStars !== 'object') merged.levelStars = {};
  if (!merged.bestStreak || typeof merged.bestStreak !== 'object') merged.bestStreak = {};
  merged.unlockedLevel = Math.max(
    STARTING_UNLOCKED_LEVEL,
    Number.isFinite(merged.unlockedLevel) ? merged.unlockedLevel : STARTING_UNLOCKED_LEVEL
  );

  merged.musicVolume = Number.isFinite(merged.musicVolume)
    ? Math.max(0, Math.min(1, merged.musicVolume)) : 1.0;
  merged.sfxVolume = Number.isFinite(merged.sfxVolume)
    ? Math.max(0, Math.min(1, merged.sfxVolume)) : 1.0;

  for (const k of Object.keys(merged.words)) {
    const w = merged.words[k];
    w.successes = Number.isFinite(w.successes) ? w.successes : 0;
    w.ease = Number.isFinite(w.ease) ? w.ease : 1.3;
    w.interval = Number.isFinite(w.interval) ? w.interval : 0;
    w.due = Number.isFinite(w.due) ? w.due : 0;
  }

  return merged;
}

export function isStorageAvailable(): boolean {
  return storageAvailable;
}

export function hasStorageBeenChecked(): boolean {
  return storageChecked;
}

export async function loadProfile(): Promise<SaveData> {
  storageChecked = true;

  try {
    const val = await get<SaveData>('fire-reader');
    if (val) {
      storageAvailable = true;
      return normalizeProfile(val);
    }

    const local = loadLocalProfile();
    if (local) {
      storageAvailable = true;
      return normalizeProfile(local);
    }

    storageAvailable = true;
    return normalizeProfile(null);
  } catch {
    const local = loadLocalProfile();
    if (local) {
      storageAvailable = true;
      return normalizeProfile(local);
    }
    storageAvailable = false;
    return normalizeProfile(memStore);
  }
}

export async function saveProfile(state: SaveData): Promise<boolean> {
  const normalized = normalizeProfile(state);
  try {
    await set('fire-reader', normalized);
    saveLocalProfile(normalized);
    memStore = normalized;
    storageAvailable = true;
    return true;
  } catch {
    const localSaved = saveLocalProfile(normalized);
    memStore = normalized;
    storageAvailable = localSaved;
    return localSaved;
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
