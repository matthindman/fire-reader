import Phaser from 'phaser';
import { LEVEL_BOSS_ANIMS } from './visuals';

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

  if (!anims.exists('kid_idle')) {
    anims.create({
      key: 'kid_idle',
      frames: buildFramesByIndices(names, 'kid_idle_', [0, 1]),
      frameRate: 1.5,
      repeat: -1
    });
  }

  const bossKeys = new Set(Object.values(LEVEL_BOSS_ANIMS));
  for (const k of bossKeys) {
    if (anims.exists(k)) continue;
    if (k === 'dragon') {
      anims.create({
        key: 'dragon',
        frames: buildFramesByIndices(names, 'dragon_', [0, 1, 2, 3, 4, 3, 2, 1]),
        frameRate: 3,
        repeat: -1
      });
    } else {
      anims.create({
        key: k,
        frames: buildFrames(names, `${k}_`, 0, 4),
        frameRate: 2,
        yoyo: true,
        repeat: -1
      });
    }
  }
}
