import Phaser from 'phaser';
import { setUserVolumes, getUserMusicVolume, getUserSfxVolume, applyMusicVolume, playCue } from '../audio';
import { loadProfile, saveProfile } from '../storage';

const STEPS = [0, 0.25, 0.5, 0.75, 1.0];
const STEP_W = 28;
const STEP_H = 14;
const STEP_GAP = 4;
const POPUP_W = 220;
const POPUP_H = 100;
const BTN_X = 24;
const BTN_Y = 510;

export default class VolumeOverlay extends Phaser.Scene {
  private popup?: Phaser.GameObjects.Container;
  private musicSteps: Phaser.GameObjects.Rectangle[] = [];
  private sfxSteps: Phaser.GameObjects.Rectangle[] = [];

  constructor() {
    super({ key: 'VolumeOverlay', active: false });
  }

  create() {
    const btn = this.add.text(BTN_X, BTN_Y, 'Vol', {
      fontSize: '16px',
      color: '#FFFFFF',
      backgroundColor: '#333',
      padding: { left: 6, right: 6, top: 3, bottom: 3 },
      fontFamily: 'sans-serif'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(100);

    btn.on('pointerup', () => {
      if (this.popup) this.closePopup();
      else this.openPopup();
    });

    this.events.once('shutdown', () => {
      this.closePopup();
    });
  }

  private openPopup() {
    const px = BTN_X;
    const py = BTN_Y - POPUP_H - 10;
    const container = this.add.container(px, py).setDepth(100);

    const bg = this.add.rectangle(0, 0, POPUP_W, POPUP_H, 0x222222, 0.95).setOrigin(0);
    bg.setStrokeStyle(1, 0x555555);
    container.add(bg);

    // Music row
    const musicLabel = this.add.text(10, 14, 'Music', {
      fontSize: '14px', color: '#CCCCCC', fontFamily: 'sans-serif'
    });
    container.add(musicLabel);
    this.musicSteps = this.createStepBar(container, 80, 10, getUserMusicVolume(), (vol) => {
      this.setVolumes(vol, getUserSfxVolume());
    });

    // SFX row
    const sfxLabel = this.add.text(10, 54, 'SFX', {
      fontSize: '14px', color: '#CCCCCC', fontFamily: 'sans-serif'
    });
    container.add(sfxLabel);
    this.sfxSteps = this.createStepBar(container, 80, 50, getUserSfxVolume(), (vol) => {
      this.setVolumes(getUserMusicVolume(), vol);
      playCue(this, 'ui_click');
    });

    this.popup = container;
  }

  private createStepBar(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    currentVol: number,
    onChange: (vol: number) => void
  ): Phaser.GameObjects.Rectangle[] {
    const rects: Phaser.GameObjects.Rectangle[] = [];
    for (let i = 0; i < STEPS.length; i++) {
      const sx = x + i * (STEP_W + STEP_GAP);
      const filled = STEPS[i] <= currentVol + 0.01;
      const rect = this.add.rectangle(sx, y, STEP_W, STEP_H, filled ? 0x00E676 : 0x444444)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      rect.on('pointerup', () => {
        onChange(STEPS[i]);
        this.refreshSteps(rects, STEPS[i]);
      });

      container.add(rect);
      rects.push(rect);
    }
    return rects;
  }

  private refreshSteps(rects: Phaser.GameObjects.Rectangle[], vol: number) {
    for (let i = 0; i < rects.length; i++) {
      rects[i].setFillStyle(STEPS[i] <= vol + 0.01 ? 0x00E676 : 0x444444);
    }
  }

  private setVolumes(music: number, sfx: number) {
    setUserVolumes(music, sfx);
    applyMusicVolume(this);
    void this.persistVolumes(music, sfx);
  }

  private async persistVolumes(music: number, sfx: number) {
    const profile = await loadProfile();
    profile.musicVolume = music;
    profile.sfxVolume = sfx;
    await saveProfile(profile);
  }

  private closePopup() {
    if (this.popup) {
      this.popup.destroy(true);
      this.popup = undefined;
    }
    this.musicSteps = [];
    this.sfxSteps = [];
  }
}
