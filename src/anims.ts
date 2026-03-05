import Phaser from 'phaser';
import { LEVEL_VISUALS } from './visuals';

function upsertAnimation(
  anims: Phaser.Animations.AnimationManager,
  config: Phaser.Types.Animations.Animation & { key: string }
): void {
  if (anims.exists(config.key)) anims.remove(config.key);
  anims.create(config);
}

// Generated from raw frame centroid drift analysis.
// These pairs keep idle motion while avoiding large sprite-position jumps.
const BOSS_IDLE_PAIR_BY_KEY: Readonly<Record<string, readonly [number, number]>> = {
  boss_apartment_building: [4, 5],
  boss_bakery: [4, 5],
  boss_bbq: [1, 2],
  boss_beach: [1, 2],
  boss_campfire: [1, 2],
  boss_car: [1, 2],
  boss_construction_site: [4, 5],
  boss_corn_maze: [4, 5],
  boss_ferry: [0, 1],
  boss_fire_station: [4, 5],
  boss_forest: [1, 2],
  boss_freight_train: [4, 5],
  boss_grocery_store: [4, 5],
  boss_hospital: [1, 2],
  boss_ice_cream_truck: [4, 5],
  boss_kitchen: [4, 5],
  boss_lighthouse: [4, 5],
  boss_movie_theater: [4, 5],
  boss_office: [4, 5],
  boss_pet_store: [0, 1],
  boss_pizzeria: [4, 5],
  boss_school_bus: [1, 2],
  boss_train_station: [4, 5],
  boss_trash: [4, 5],
  boss_warehouse: [4, 5],
};

function getBossIdlePair(bossKey: string): readonly [number, number] {
  return BOSS_IDLE_PAIR_BY_KEY[bossKey] ?? [4, 5];
}

function pickFrame(names: Set<string>, base: string): string | null {
  if (names.has(`${base}.png`)) return `${base}.png`;
  if (names.has(base)) return base;
  return null;
}

function buildFrames(
  names: Set<string>,
  prefix: string,
  start: number,
  end: number
): Phaser.Types.Animations.AnimationFrame[] {
  const frames: Phaser.Types.Animations.AnimationFrame[] = [];
  for (let i = start; i <= end; i++) {
    const f = pickFrame(names, `${prefix}${i}`);
    if (!f) throw new Error(`Missing atlas frame: ${prefix}${i}`);
    frames.push({ key: 'atlas', frame: f });
  }
  return frames;
}

function buildFramesByIndices(
  names: Set<string>,
  prefix: string,
  indices: number[]
): Phaser.Types.Animations.AnimationFrame[] {
  const frames: Phaser.Types.Animations.AnimationFrame[] = [];
  for (const i of indices) {
    const f = pickFrame(names, `${prefix}${i}`);
    if (!f) throw new Error(`Missing atlas frame: ${prefix}${i}`);
    frames.push({ key: 'atlas', frame: f });
  }
  return frames;
}

export function ensureAnimations(
  anims: Phaser.Animations.AnimationManager,
  texture: Phaser.Textures.Texture
) {
  const names = new Set(texture.getFrameNames());

  upsertAnimation(anims, {
    key: 'kid_idle',
    frames: buildFramesByIndices(names, 'kid_idle_', [0, 1, 2, 3]),
    frameRate: 3,
    repeat: -1
  });

  const bossKeys = new Set(Object.values(LEVEL_VISUALS).map(v => v.boss));
  for (const k of bossKeys) {
    if (k === 'dragon') {
      upsertAnimation(anims, {
        key: 'dragon',
        frames: buildFramesByIndices(names, 'dragon_', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
        frameRate: 6,
        repeat: -1
      });
    } else {
      // Only create animation if atlas frames exist for this boss
      const testFrame = pickFrame(names, `${k}_0`);
      if (!testFrame) {
        if (anims.exists(k)) anims.remove(k);
        console.warn(`[anims] Skipping ${k}: atlas frames not found`);
        continue;
      }
      const [a, b] = getBossIdlePair(k);
      upsertAnimation(anims, {
        key: k,
        frames: buildFramesByIndices(names, `${k}_`, [a, b]),
        frameRate: 2,
        repeat: -1,
        yoyo: true
      });
    }
  }
}
