import Phaser from 'phaser';
import { loadProfile, isStorageAvailable } from '../storage';
import { playCue, requestMenuMusic, unlockAudio } from '../audio';

export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const unlockAudioNow = () => unlockAudio(this);
    requestMenuMusic(this);

    this.input.once('pointerdown', unlockAudioNow);
    if (this.input.keyboard) this.input.keyboard.once('keydown', unlockAudioNow);

    const touchUnlock = () => unlockAudioNow();
    this.game.canvas.addEventListener('touchstart', touchUnlock, { once: true, passive: true });
    this.events.once('shutdown', () => {
      this.game.canvas.removeEventListener('touchstart', touchUnlock);
    });

    this.add.text(480, 90, 'Fire-Reader', { fontSize: '46px', color: '#FFD700', fontFamily: 'sans-serif' })
      .setOrigin(0.5);

    const loading = this.add.text(480, 270, 'Loading...', { fontSize: '22px', color: '#AAAAAA' }).setOrigin(0.5);
    void this.buildMenu(loading);
  }

  private async buildMenu(loadingText: Phaser.GameObjects.Text) {
    const profile = await loadProfile();
    loadingText.destroy();

    if (!isStorageAvailable() && !this.registry.get('storageWarningShown')) {
      this.registry.set('storageWarningShown', true);
      const warning = this.add.text(480, 520, 'Warning: Private/blocked storage, progress will not save', {
        fontSize: '14px', color: '#FFAA00', fontFamily: 'sans-serif'
      }).setOrigin(0.5);

      this.time.delayedCall(5000, () => {
        this.tweens.add({
          targets: warning,
          alpha: 0,
          duration: 900,
          onComplete: () => warning.destroy()
        });
      });
    }

    for (let i = 1; i <= 10; i++) {
      const y = 155 + i * 32;
      const unlocked = i <= profile.unlockedLevel;

      const label = this.add.text(480, y, `Level ${i}`, {
        fontSize: '24px',
        color: unlocked ? '#00E676' : '#777777',
        fontFamily: 'sans-serif'
      }).setOrigin(0.5);

      if (unlocked) label.setInteractive({ useHandCursor: true });
      else label.setAlpha(0.4);

      label.on('pointerup', () => {
        if (!unlocked) return;
        playCue(this, 'ui_confirm');
        this.scene.start('Lesson', { levelNum: i });
      });
    }

    const gear = this.add.text(880, 505, 'Settings', { fontSize: '18px', color: '#FFFFFF' })
      .setInteractive({ useHandCursor: true });

    gear.on('pointerup', () => {
      playCue(this, 'ui_click');
      if (!this.scene.isActive('Settings')) this.scene.launch('Settings');
    });
  }
}
