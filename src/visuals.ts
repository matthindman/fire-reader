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
  1:  { bg: 'bg_kitchen', boss: 'boss_kitchen' },
  2:  { bg: 'bg_ice_cream_truck', boss: 'boss_ice_cream_truck' },
  3:  { bg: 'bg_bakery', boss: 'boss_bakery' },
  4:  { bg: 'bg_trash', boss: 'boss_trash' },
  5:  { bg: 'bg_pet_store', boss: 'boss_pet_store' },
  6:  { bg: 'bg_beach', boss: 'boss_beach' },
  7:  { bg: 'bg_campfire', boss: 'boss_campfire' },
  8:  { bg: 'bg_grocery_store', boss: 'boss_grocery_store' },
  9:  { bg: 'bg_corn_maze', boss: 'boss_corn_maze' },
  10: { bg: 'bg_fire_station', boss: 'boss_fire_station' },
  11: { bg: 'bg_pizzeria', boss: 'boss_pizzeria' },
  12: { bg: 'bg_school_bus', boss: 'boss_school_bus' },
  13: { bg: 'bg_car', boss: 'boss_car' },
  14: { bg: 'bg_movie_theater', boss: 'boss_movie_theater' },
  15: { bg: 'bg_apartment', boss: 'boss_apartment_building' },
  16: { bg: 'bg_bbq', boss: 'boss_bbq' },
  17: { bg: 'bg_dump_truck', boss: 'boss_kitchen' },            // art missing — fallback
  18: { bg: 'bg_construction_site', boss: 'boss_construction_site' },
  19: { bg: 'bg_forest', boss: 'boss_forest' },
  20: { bg: 'bg_lighthouse', boss: 'boss_lighthouse' },
  21: { bg: 'bg_ferry', boss: 'boss_ferry' },
  22: { bg: 'bg_warehouse', boss: 'boss_warehouse' },
  23: { bg: 'bg_train_station', boss: 'boss_train_station' },
  24: { bg: 'bg_freight_train', boss: 'boss_freight_train' },   // bg missing — fallback
  25: { bg: 'bg_office', boss: 'boss_office' },
  26: { bg: 'bg_hospital', boss: 'boss_hospital' },
  27: { bg: 'bg_stadium', boss: 'boss_kitchen' },               // boss missing — fallback
  28: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  29: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  30: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  31: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  32: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  33: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  34: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  35: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  36: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  37: { bg: 'bg_kitchen', boss: 'boss_kitchen' },               // art missing — fallback
  38: { bg: 'bg_castle', boss: 'dragon' },
};

export function getLevelBg(n: number): string {
  return LEVEL_VISUALS[n]?.bg ?? 'bg_kitchen';
}

export function getLevelBoss(n: number): string {
  return LEVEL_VISUALS[n]?.boss ?? 'boss_kitchen';
}
