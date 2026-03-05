import { LEVELS, LEVEL_ERRORS } from './data/levels';
import { GAME_CONSTANTS } from './constants';

export function validateLevels(): boolean {
  let ok = LEVEL_ERRORS.length === 0;
  if (!ok) console.error('[LEVELS] Errors:', LEVEL_ERRORS);

  const newLocations = new Map<string, number[]>();
  const uniqueTargets = new Set<string>();

  for (let i = 1; i <= GAME_CONSTANTS.TOTAL_LEVELS; i++) {
    const L = LEVELS[i];

    // Sentence levels: check sentences.length >= hp
    if (L.sentences && L.sentences.length > 0) {
      if (L.sentences.length < L.hp) {
        console.error(`[LEVELS] Level ${i} must have sentences.length >= hp.`);
        ok = false;
      }
      continue;
    }

    // Word levels: check targets
    const targets = [...(L.new ? L.new : []), ...(L.trick ? L.trick : [])];
    if (targets.length === 0) { console.error(`[LEVELS] Level ${i} has no targets.`); ok = false; }

    for (const w of (L.new ? L.new : [])) {
      uniqueTargets.add(w);
      const locs = newLocations.get(w) ? newLocations.get(w)! : [];
      locs.push(i);
      newLocations.set(w, locs);
    }

    if (typeof L.hp === 'number') {
      const expected = new Set(L.new ? L.new : []).size;
      if (L.hp !== expected) {
        console.warn(`[LEVELS] Level ${i} hp=${L.hp} but unique new words=${expected}. (Runtime uses unique new words.)`);
      }
    }
  }

  for (const [word, levels] of newLocations.entries()) {
    if (levels.length > 1) {
      console.warn(`[LEVELS] Word "${word}" appears in new[] of levels: ${levels.join(', ')}`);
    }
  }

  console.log(`[LEVELS] Unique new[] words across all word levels: ${uniqueTargets.size}`);

  return ok;
}
