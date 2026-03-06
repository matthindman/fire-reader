export interface LevelVisuals {
  bg: string;
  boss: string;
  kidX?: number;
  kidY?: number;
  bossX?: number;
  bossY?: number;
  bossScale?: number;
}

export const LEVEL_VISUALS: Readonly<Record<number, LevelVisuals>> = {
  1:  { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 740, bossY: 392, bossScale: 0.56 },
  2:  { bg: 'bg_ice_cream_truck', boss: 'boss_ice_cream_truck', bossX: 732, bossY: 352, bossScale: 0.56 },
  3:  { bg: 'bg_bakery', boss: 'boss_bakery', bossX: 740, bossY: 392, bossScale: 0.56 },
  4:  { bg: 'bg_trash', boss: 'boss_trash', bossX: 752, bossY: 330, bossScale: 0.56 },
  5:  { bg: 'bg_pet_store', boss: 'boss_pet_store', bossX: 740, bossY: 392, bossScale: 0.56 },
  6:  { bg: 'bg_beach', boss: 'boss_beach', bossX: 758, bossY: 392, bossScale: 0.56 },
  7:  { bg: 'bg_campfire', boss: 'boss_campfire', bossX: 665, bossY: 392, bossScale: 0.56 },
  8:  { bg: 'bg_grocery_store', boss: 'boss_grocery_store', bossX: 733, bossY: 392, bossScale: 0.56 },
  9:  { bg: 'bg_corn_maze', boss: 'boss_corn_maze', bossX: 725, bossY: 392, bossScale: 0.56 },
  10: { bg: 'bg_fire_station', boss: 'boss_fire_station', bossX: 743, bossY: 392, bossScale: 0.56 },
  11: { bg: 'bg_pizzeria', boss: 'boss_pizzeria', bossX: 743, bossY: 380, bossScale: 0.56 },
  12: { bg: 'bg_school_bus', boss: 'boss_school_bus', bossX: 678, bossY: 350, bossScale: 0.56 },
  13: { bg: 'bg_car', boss: 'boss_car', bossX: 702, bossY: 392, bossScale: 0.56 },
  14: { bg: 'bg_movie_theater', boss: 'boss_movie_theater', bossX: 752, bossY: 392, bossScale: 0.56 },
  15: { bg: 'bg_apartment', boss: 'boss_apartment_building', bossX: 703, bossY: 367, bossScale: 0.56 },
  16: { bg: 'bg_bbq', boss: 'boss_bbq', bossX: 686, bossY: 392, bossScale: 0.56 },
  17: { bg: 'bg_dump_truck', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },            // art missing — fallback
  18: { bg: 'bg_construction_site', boss: 'boss_construction_site', bossX: 693, bossY: 392, bossScale: 0.56 },
  19: { bg: 'bg_forest', boss: 'boss_forest', bossX: 698, bossY: 392, bossScale: 0.56 },
  20: { bg: 'bg_lighthouse', boss: 'boss_lighthouse', bossX: 747, bossY: 392, bossScale: 0.56 },
  21: { bg: 'bg_ferry', boss: 'boss_ferry', bossX: 768, bossY: 392, bossScale: 0.56 },
  22: { bg: 'bg_warehouse', boss: 'boss_warehouse', bossX: 747, bossY: 392, bossScale: 0.56 },
  23: { bg: 'bg_train_station', boss: 'boss_train_station', bossX: 726, bossY: 392, bossScale: 0.56 },
  24: { bg: 'bg_freight_train', boss: 'boss_freight_train', bossX: 719, bossY: 392, bossScale: 0.56 },   // bg missing — fallback
  25: { bg: 'bg_office', boss: 'boss_office', bossX: 712, bossY: 392, bossScale: 0.56 },
  26: { bg: 'bg_hospital', boss: 'boss_hospital', bossX: 793, bossY: 392, bossScale: 0.56 },
  27: { bg: 'bg_stadium', boss: 'boss_kitchen', bossX: 751, bossY: 392, bossScale: 0.56 },               // boss missing — fallback
  28: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  29: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  30: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  31: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  32: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  33: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  34: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  35: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  36: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  37: { bg: 'bg_kitchen', boss: 'boss_kitchen', bossX: 722, bossY: 392, bossScale: 0.56 },               // art missing — fallback
  38: { bg: 'bg_castle', boss: 'dragon', bossX: 770, bossY: 330, bossScale: 0.72 },
};

export function getLevelBg(n: number): string {
  return LEVEL_VISUALS[n]?.bg ?? 'bg_kitchen';
}

export function getLevelBoss(n: number): string {
  return LEVEL_VISUALS[n]?.boss ?? 'boss_kitchen';
}
