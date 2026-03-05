import Phaser from 'phaser';

type Bus = 'music' | 'sfx' | 'ui';
type MusicTrack = 'menu' | 'game_a' | 'game_b' | 'game_c';

export type CueName =
  | 'ui_click'
  | 'ui_confirm'
  | 'ui_back'
  | 'ui_toggle_on'
  | 'ui_toggle_off'
  | 'spray_shot'
  | 'hit_success'
  | 'hit_minor'
  | 'fail_try_again'
  | 'word_mastered'
  | 'level_clear_fanfare'
  | 'unlock_reward'
  | 'stinger_level_fail'
  | 'stinger_boss_end';

const MUSIC_CROSSFADE_MS = 280;
const MUTE_FADE_MS = 100;
const MAX_SFX_VOICES = 8;

const BUS_GAIN: Record<Bus, number> = {
  music: dbToGain(-14),
  sfx: dbToGain(-8),
  ui: dbToGain(-10)
};

const MUSIC_TRACKS: Record<MusicTrack, string[]> = {
  menu: ['bgm_menu_loop', 'bgm'],
  game_a: ['bgm_game_loop_a', 'bgm'],
  game_b: ['bgm_game_loop_b', 'bgm'],
  game_c: ['bgm_game_loop_c', 'bgm']
};

const CUES: Record<CueName, { keys: string[]; bus: Bus; gain: number }> = {
  ui_click: { keys: ['ui_click_v01'], bus: 'ui', gain: 0.95 },
  ui_confirm: { keys: ['ui_confirm_v01'], bus: 'ui', gain: 1.0 },
  ui_back: { keys: ['ui_back_v01'], bus: 'ui', gain: 1.0 },
  ui_toggle_on: { keys: ['ui_toggle_on_v01'], bus: 'ui', gain: 1.0 },
  ui_toggle_off: { keys: ['ui_toggle_off_v01'], bus: 'ui', gain: 1.0 },
  spray_shot: { keys: ['spray_shot_v01', 'spray_shot_v02', 'spray'], bus: 'sfx', gain: 1.0 },
  hit_success: { keys: ['hit_success_v01', 'hit_success_v02', 'hit'], bus: 'sfx', gain: 1.0 },
  hit_minor: { keys: ['hit_minor_v01', 'hit'], bus: 'sfx', gain: 0.85 },
  fail_try_again: { keys: ['fail_try_again_v01', 'fail_try_again_v02', 'fail'], bus: 'sfx', gain: 1.0 },
  word_mastered: { keys: ['word_mastered_v01'], bus: 'sfx', gain: 0.95 },
  level_clear_fanfare: { keys: ['stinger_level_clear', 'victory'], bus: 'sfx', gain: 1.05 },
  unlock_reward: { keys: ['unlock_reward_v01', 'victory'], bus: 'sfx', gain: 0.95 },
  stinger_level_fail: { keys: ['stinger_level_fail', 'fail'], bus: 'sfx', gain: 1.0 },
  stinger_boss_end: { keys: ['stinger_boss_end', 'victory'], bus: 'sfx', gain: 1.0 }
};

let desiredTrack: MusicTrack = 'menu';
let music: Phaser.Sound.BaseSound | null = null;
let currentMusicKey: string | null = null;
let muted = false;
let unlocked = false;
let activeSfx: Phaser.Sound.BaseSound[] = [];
let duckResetEvent: Phaser.Time.TimerEvent | null = null;

let userMusicVolume = 1.0;
let userSfxVolume = 1.0;

export function setUserVolumes(music: number, sfx: number): void {
  userMusicVolume = Math.max(0, Math.min(1, music));
  userSfxVolume = Math.max(0, Math.min(1, sfx));
}

export function getUserMusicVolume(): number { return userMusicVolume; }
export function getUserSfxVolume(): number { return userSfxVolume; }

export function applyMusicVolume(scene: Phaser.Scene): void {
  if (!music || !music.isPlaying || muted) return;
  scene.tweens.add({
    targets: music as any,
    volume: BUS_GAIN.music * userMusicVolume,
    duration: 120,
    ease: 'Quad.easeOut'
  });
}

function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

function getLoadedKey(scene: Phaser.Scene, keys: string[]): string | null {
  for (const key of keys) {
    if (scene.cache.audio.exists(key)) return key;
  }
  return null;
}

function removeSfxVoice(sound: Phaser.Sound.BaseSound): void {
  activeSfx = activeSfx.filter(v => v !== sound && v.isPlaying);
}

function pruneSfxVoices(): void {
  activeSfx = activeSfx.filter(v => v.isPlaying);
}

function stopAndDestroy(sound: Phaser.Sound.BaseSound | null): void {
  if (!sound) return;
  try {
    sound.stop();
  } catch {}
  try {
    sound.destroy();
  } catch {}
}

function fadeOutAndDestroy(scene: Phaser.Scene, sound: Phaser.Sound.BaseSound, ms: number): void {
  scene.tweens.add({
    targets: sound as any,
    volume: 0,
    duration: ms,
    ease: 'Quad.easeIn',
    onComplete: () => stopAndDestroy(sound)
  });
}

function ensureMusic(scene: Phaser.Scene): void {
  if (muted || !unlocked) return;
  const key = getLoadedKey(scene, MUSIC_TRACKS[desiredTrack]);
  if (!key) return;
  if (music && currentMusicKey === key && music.isPlaying) return;

  const next = scene.sound.add(key, { loop: true, volume: 0 });
  try {
    next.play();
  } catch {
    next.destroy();
    return;
  }

  scene.tweens.add({
    targets: next as any,
    volume: BUS_GAIN.music * userMusicVolume,
    duration: MUSIC_CROSSFADE_MS,
    ease: 'Quad.easeOut'
  });

  if (music) fadeOutAndDestroy(scene, music, MUSIC_CROSSFADE_MS);
  music = next;
  currentMusicKey = key;
}

export function setPersistedMuteState(nextMuted: boolean): void {
  muted = nextMuted;
}

export function unlockAudio(scene: Phaser.Scene): void {
  unlocked = true;
  const ctx = (scene.sound as unknown as { context?: AudioContext }).context;
  if (ctx && ctx.state === 'suspended') {
    void ctx.resume().catch(() => undefined);
  }
  scene.sound.mute = muted;
  ensureMusic(scene);
}

export function requestMenuMusic(scene: Phaser.Scene): void {
  desiredTrack = 'menu';
  ensureMusic(scene);
}

export function requestGameMusic(scene: Phaser.Scene, levelNum: number): void {
  if (levelNum <= 12) desiredTrack = 'game_a';
  else if (levelNum <= 24) desiredTrack = 'game_b';
  else desiredTrack = 'game_c';
  ensureMusic(scene);
}

export function setGlobalMute(scene: Phaser.Scene, nextMuted: boolean): void {
  muted = nextMuted;
  if (!nextMuted) {
    scene.sound.mute = false;
    ensureMusic(scene);
    return;
  }

  pruneSfxVoices();
  for (const voice of activeSfx) {
    fadeOutAndDestroy(scene, voice, MUTE_FADE_MS);
  }
  activeSfx = [];

  if (music) {
    fadeOutAndDestroy(scene, music, MUTE_FADE_MS);
    music = null;
    currentMusicKey = null;
  }

  scene.time.delayedCall(MUTE_FADE_MS, () => {
    scene.sound.mute = true;
  });
}

export function playCue(scene: Phaser.Scene, cue: CueName): void {
  if (muted || !unlocked) return;

  const config = CUES[cue];
  const key = getLoadedKey(scene, config.keys);
  if (!key) return;

  pruneSfxVoices();
  while (activeSfx.length >= MAX_SFX_VOICES) {
    const oldest = activeSfx.shift();
    if (oldest) stopAndDestroy(oldest);
  }

  const sound = scene.sound.add(key, {
    volume: BUS_GAIN[config.bus] * config.gain * userSfxVolume
  });

  sound.once('complete', () => removeSfxVoice(sound));
  sound.once('destroy', () => removeSfxVoice(sound));

  try {
    sound.play();
    activeSfx.push(sound);
  } catch {
    sound.destroy();
  }
}

export function duckMusic(scene: Phaser.Scene, amountDb = 3, holdMs = 320): void {
  if (!music || muted || !music.isPlaying) return;

  const low = BUS_GAIN.music * userMusicVolume * dbToGain(-Math.abs(amountDb));
  scene.tweens.killTweensOf(music as any);
  scene.tweens.add({
    targets: music as any,
    volume: low,
    duration: 90,
    ease: 'Quad.easeOut'
  });

  if (duckResetEvent) duckResetEvent.remove(false);
  duckResetEvent = scene.time.delayedCall(holdMs, () => {
    if (!music || muted) return;
    scene.tweens.add({
      targets: music as any,
      volume: BUS_GAIN.music * userMusicVolume,
      duration: 180,
      ease: 'Quad.easeInOut'
    });
    duckResetEvent = null;
  });
}
