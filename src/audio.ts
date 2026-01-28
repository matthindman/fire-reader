import Phaser from 'phaser';

let bgm: Phaser.Sound.BaseSound | null = null;

export function ensureBgm(scene: Phaser.Scene) {
  if (scene.sound.mute) return;

  if (!bgm) {
    bgm = scene.sound.add('bgm', { loop: true, volume: 0.4 });
  }

  try {
    const anyBgm = bgm as any;
    if (anyBgm.isPaused) {
      anyBgm.resume();
      return;
    }
    if (!bgm.isPlaying) bgm.play();
  } catch {
    // Autoplay blocked; starts after next gesture.
  }
}

export function stopBgm() {
  try { bgm?.stop(); } catch {}
  bgm = null;
}

export function setBgmMute(muted: boolean) {
  if (!bgm) return;
  const anyBgm = bgm as any;
  try {
    if (muted) {
      if (bgm.isPlaying && !anyBgm.isPaused) anyBgm.pause();
    } else {
      if (anyBgm.isPaused) anyBgm.resume();
      else if (!bgm.isPlaying) bgm.play();
    }
  } catch {}
}
