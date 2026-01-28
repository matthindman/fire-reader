import { LEVELS, LEVEL_ERRORS } from './data/levels';

export function validateLevels(): boolean {
  let ok = LEVEL_ERRORS.length === 0;
  if (!ok) console.error('[LEVELS] Errors:', LEVEL_ERRORS);

  const newLocations = new Map<string, number[]>();
  const uniqueTargets = new Set<string>();

  for (let i = 1; i <= 9; i++) {
    const L = LEVELS[i];
    const targets = [...(L.new ?? []), ...(L.trick ?? [])];
    if (targets.length === 0) { console.error(`[LEVELS] Level ${i} has no targets.`); ok = false; }

    for (const w of (L.new ?? [])) {
      uniqueTargets.add(w);
      const locs = newLocations.get(w) ?? [];
      locs.push(i);
      newLocations.set(w, locs);
    }

    if (typeof L.hp === 'number') {
      const expected = new Set(targets).size;
      if (L.hp !== expected) {
        console.warn(`[LEVELS] Level ${i} hp=${L.hp} but unique targets=${expected}. (Runtime uses unique targets.)`);
      }
    }
  }

  for (const [word, levels] of newLocations.entries()) {
    if (levels.length > 1) {
      console.warn(`[LEVELS] Word "${word}" appears in new[] of levels: ${levels.join(', ')}`);
    }
  }

  console.log(`[LEVELS] Unique new[] words across levels 1-9: ${uniqueTargets.size}`);

  const L10 = LEVELS[10];
  if (!Array.isArray(L10.sentences) || L10.sentences.length < L10.hp) {
    console.error('[LEVELS] Level 10 must have sentences.length >= hp.');
    ok = false;
  }

  return ok;
}
