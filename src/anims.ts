import Phaser from 'phaser';
import { LEVEL_VISUALS } from './visuals';

function upsertAnimation(
  anims: Phaser.Animations.AnimationManager,
  config: Phaser.Types.Animations.Animation & { key: string }
): void {
  if (anims.exists(config.key)) anims.remove(config.key);
  anims.create(config);
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
      upsertAnimation(anims, {
        key: k,
        frames: buildFrames(names, `${k}_`, 0, 5),
        frameRate: 4,
        repeat: -1
      });
    }
  }
}
