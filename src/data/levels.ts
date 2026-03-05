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
import l11 from '../../data/level11.json';
import l12 from '../../data/level12.json';
import l13 from '../../data/level13.json';
import l14 from '../../data/level14.json';
import l15 from '../../data/level15.json';
import l16 from '../../data/level16.json';
import l17 from '../../data/level17.json';
import l18 from '../../data/level18.json';
import l19 from '../../data/level19.json';
import l20 from '../../data/level20.json';
import l21 from '../../data/level21.json';
import l22 from '../../data/level22.json';
import l23 from '../../data/level23.json';
import l24 from '../../data/level24.json';
import l25 from '../../data/level25.json';
import l26 from '../../data/level26.json';
import l27 from '../../data/level27.json';
import l28 from '../../data/level28.json';
import l29 from '../../data/level29.json';
import l30 from '../../data/level30.json';
import l31 from '../../data/level31.json';
import l32 from '../../data/level32.json';
import l33 from '../../data/level33.json';
import l34 from '../../data/level34.json';
import l35 from '../../data/level35.json';
import l36 from '../../data/level36.json';
import l37 from '../../data/level37.json';
import l38 from '../../data/level38.json';
import type { LevelData } from '../types';
import { GAME_CONSTANTS } from '../constants';

const raw: Record<number, unknown> = {
  1: l1, 2: l2, 3: l3, 4: l4, 5: l5, 6: l6, 7: l7, 8: l8, 9: l9, 10: l10,
  11: l11, 12: l12, 13: l13, 14: l14, 15: l15, 16: l16, 17: l17, 18: l18, 19: l19, 20: l20,
  21: l21, 22: l22, 23: l23, 24: l24, 25: l25, 26: l26, 27: l27, 28: l28, 29: l29, 30: l30,
  31: l31, 32: l32, 33: l33, 34: l34, 35: l35, 36: l36, 37: l37, 38: l38
};

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

  const hasSentences = Array.isArray(o.sentences) && o.sentences.length > 0;
  if (hasSentences) return true;

  const hasNew = Array.isArray(o.new) && o.new.length > 0;
  const hasTrick = Array.isArray(o.trick) && o.trick.length > 0;
  if (!hasNew && !hasTrick) return false;
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

for (let i = 1; i <= GAME_CONSTANTS.TOTAL_LEVELS; i++) {
  const d = raw[i];
  if (isValidLevelData(d, i)) {
    LEVELS[i] = d as LevelData;
  } else {
    LEVEL_ERRORS.push(`Invalid level data for level ${i}`);
    LEVELS[i] = fallbackLevel(i);
  }
}
