import l1 from '../../data/level01.json';
import l2 from '../../data/level02.json';
import l3 from '../../data/level03.json';
import l4 from '../../data/level04.json';
import l5 from '../../data/level05.json';
import l6 from '../../data/level06.json';
import l7 from '../../data/level07.json';
import l8 from '../../data/level08.json';
import l9 from '../../data/level09.json';
import l10 from '../../data/level10.json';
import type { LevelData } from '../types';

const raw: Record<number, unknown> = { 1: l1, 2: l2, 3: l3, 4: l4, 5: l5, 6: l6, 7: l7, 8: l8, 9: l9, 10: l10 };

export const LEVEL_ERRORS: string[] = [];
export const LEVELS: Record<number, LevelData> = {} as any;

function isValidLevelData(obj: unknown, expectedId: number): obj is LevelData {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;

  if (o.id !== expectedId) return false;
  if (typeof o.title !== 'string' || o.title.length === 0) return false;
  if (typeof o.phonics !== 'string') return false;
  if (typeof o.lesson !== 'string') return false;
  if (typeof o.hp !== 'number' || o.hp <= 0) return false;

  if (expectedId === 10) {
    if (!Array.isArray(o.sentences) || o.sentences.length === 0) return false;
  } else {
    const hasNew = Array.isArray(o.new) && o.new.length > 0;
    const hasTrick = Array.isArray(o.trick) && o.trick.length > 0;
    if (!hasNew && !hasTrick) return false;
  }
  return true;
}

function fallbackLevel(id: number): LevelData {
  return {
    id,
    title: `Invalid level ${id}`,
    phonics: '',
    lesson: 'Level data is invalid. Please check JSON files.',
    hp: 1,
    new: ['error'],
    trick: []
  };
}

for (let i = 1; i <= 10; i++) {
  const d = raw[i];
  if (isValidLevelData(d, i)) {
    LEVELS[i] = d as LevelData;
  } else {
    LEVEL_ERRORS.push(`Invalid level data for level ${i}`);
    LEVELS[i] = fallbackLevel(i);
  }
}
