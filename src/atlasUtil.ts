import Phaser from 'phaser';

let atlasFrames: Set<string> | null = null;

export function initAtlasFrames(texture: Phaser.Textures.Texture) {
  atlasFrames = new Set(texture.getFrameNames());
}

export function hasAtlasFrame(base: string): boolean {
  if (!atlasFrames) return false;
  return atlasFrames.has(base) || atlasFrames.has(`${base}.png`);
}

export function atlasFrame(base: string): string {
  if (!atlasFrames) return `${base}.png`;
  if (atlasFrames.has(`${base}.png`)) return `${base}.png`;
  if (atlasFrames.has(base)) return base;
  const m = Array.from(atlasFrames).find(n => n === base || n === `${base}.png`);
  return m ?? `${base}.png`;
}

export function sampleAtlasFrames(limit = 20): string[] {
  if (!atlasFrames) return [];
  return Array.from(atlasFrames).slice(0, limit);
}
