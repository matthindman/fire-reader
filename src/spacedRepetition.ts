import type { WordState } from './types';
import { GAME_CONSTANTS } from './constants';

export type Rating = 'easy' | 'hard' | 'fail';

export function defaultState(): WordState {
  return { interval: 0, ease: 1.3, due: 0, successes: 0 };
}

export function applyRating(prev: WordState | undefined, rating: Rating, now = Date.now()): WordState {
  const s: WordState = { ...(prev ? prev : defaultState()) };

  if (rating === 'easy') {
    s.successes += 1;
    s.ease = Math.min(2.5, s.ease + 0.15);
    s.interval = s.interval === 0 ? 4 : s.interval * s.ease;
    s.due = now + s.interval * 3_600_000;
    return s;
  }

  if (rating === 'hard') {
    const base = s.interval || 1;
    s.interval = Math.max(1, base * 0.5);
    s.due = now + s.interval * 3_600_000;
    return s;
  }

  s.successes = 0;
  s.interval = 0;
  s.ease = 1.3;
  s.due = now;
  return s;
}

export class Scheduler {
  private queue: string[];
  private queueSet: Set<string>;
  private store: Record<string, WordState>;

  constructor(words: string[], store: Record<string, WordState>) {
    this.store = store;
    const unique = Array.from(new Set(words));
    this.queue = unique.slice();
    this.queueSet = new Set(unique);

    for (const w of unique) {
      if (!this.store[w]) this.store[w] = defaultState();
      else {
        const s = this.store[w];
        s.successes = Number.isFinite(s.successes) ? s.successes : 0;
        s.ease = Number.isFinite(s.ease) ? s.ease : 1.3;
        s.interval = Number.isFinite(s.interval) ? s.interval : 0;
        s.due = Number.isFinite(s.due) ? s.due : 0;
      }
    }
  }

  next(): string | null {
    return this.queue.length > 0 ? this.queue[0] : null;
  }

  grade(word: string, rating: Rating) {
    const prev = this.store[word] ? this.store[word] : defaultState();
    const next = applyRating(prev, rating);
    this.store[word] = next;

    if (this.queue[0] === word) {
      this.queue.shift();
      this.queueSet.delete(word);
    } else {
      const idx = this.queue.indexOf(word);
      if (idx >= 0) {
        this.queue.splice(idx, 1);
        this.queueSet.delete(word);
      }
    }

    const needsConfirm = rating === 'easy' && next.successes < GAME_CONSTANTS.MASTERY_THRESHOLD;

    let delay: number | null = null;
    if (rating === 'fail') delay = GAME_CONSTANTS.REINSERT_DELAY_FAIL;
    else if (rating === 'hard') delay = GAME_CONSTANTS.REINSERT_DELAY_HARD;
    else if (needsConfirm) delay = GAME_CONSTANTS.REINSERT_DELAY_EASY_CONFIRM;

    if (delay !== null) this.insertAt(Math.min(delay, this.queue.length), word);
  }

  private insertAt(index: number, word: string) {
    if (this.queueSet.has(word)) return;
    this.queue.splice(index, 0, word);
    this.queueSet.add(word);
  }
}
