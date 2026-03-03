import Phaser from 'phaser';
import { loadProfile, saveProfile } from '../storage';
import { playCue, setGlobalMute, unlockAudio } from '../audio';

const BTN_STYLE = {
  fontSize: '22px',
  color: '#FFFFFF',
  backgroundColor: '#333',
  padding: { left: 16, right: 16, top: 8, bottom: 8 }
};

export default class SettingsModal extends Phaser.Scene {
  private escHandler?: () => void;

  constructor() { super({ key: 'Settings', active: false }); }

  create() {
    const blocker = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.6).setOrigin(0.5);
    blocker.setInteractive();

    this.add.rectangle(480, 270, 460, 360, 0x000000, 0.92).setOrigin(0.5);
    this.add.text(480, 120, 'Settings', { fontSize: '28px', color: '#FFD700', fontFamily: 'sans-serif' }).setOrigin(0.5);

    void this.initAsync();
  }

  private async initAsync() {
    const profile = await loadProfile();

    const soundBtn = this.add.text(480, 200, `Sound: ${profile.muted ? 'Off' : 'On'}`, BTN_STYLE)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    soundBtn.on('pointerup', async () => {
      const nextMuted = !profile.muted;
      if (nextMuted) {
        playCue(this, 'ui_toggle_off');
        setGlobalMute(this, true);
      } else {
        setGlobalMute(this, false);
        unlockAudio(this);
        playCue(this, 'ui_toggle_on');
      }
      profile.muted = nextMuted;
      soundBtn.setText(`Sound: ${profile.muted ? 'Off' : 'On'}`);
      await saveProfile(profile);
    });

    const contrastBtn = this.add.text(480, 250, `Contrast: ${profile.contrastHigh ? 'High' : 'Normal'}`, BTN_STYLE)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    contrastBtn.on('pointerup', async () => {
      playCue(this, 'ui_click');
      profile.contrastHigh = !profile.contrastHigh;
      document.body.classList.toggle('contrast-high', profile.contrastHigh);
      contrastBtn.setText(`Contrast: ${profile.contrastHigh ? 'High' : 'Normal'}`);
      await saveProfile(profile);
    });

    const progressBtn = this.add.text(480, 300, 'View progress', BTN_STYLE)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    progressBtn.on('pointerup', () => {
      playCue(this, 'ui_click');
      if (!this.scene.isActive('ParentDashboard')) this.scene.launch('ParentDashboard');
    });

    const resetBtn = this.add.text(480, 350, 'Reset progress', BTN_STYLE)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    resetBtn.on('pointerup', () => {
      playCue(this, 'ui_click');
      const overlay = this.add.rectangle(480, 270, 960, 540, 0x000000, 0.7).setOrigin(0.5);
      overlay.setInteractive();

      const dialog = this.add.rectangle(480, 270, 380, 160, 0x222222).setOrigin(0.5);
      dialog.setStrokeStyle(2, 0x666666);

      const confirmText = this.add.text(480, 230, 'Reset all progress?', {
        fontSize: '22px', color: '#FF6666', fontFamily: 'sans-serif'
      }).setOrigin(0.5);

      const subText = this.add.text(480, 260, 'This cannot be undone.', {
        fontSize: '16px', color: '#AAAAAA', fontFamily: 'sans-serif'
      }).setOrigin(0.5);

      const yesBtn = this.add.text(400, 310, 'Reset', { ...BTN_STYLE, backgroundColor: '#662222' })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });

      const noBtn = this.add.text(560, 310, 'Cancel', BTN_STYLE)
        .setOrigin(0.5).setInteractive({ useHandCursor: true });

      const cleanup = () => {
        overlay.destroy(); dialog.destroy(); confirmText.destroy(); subText.destroy(); yesBtn.destroy(); noBtn.destroy();
      };

      yesBtn.on('pointerup', async () => {
        playCue(this, 'ui_confirm');
        cleanup();
        profile.unlockedLevel = 1;
        profile.words = {};
        await saveProfile(profile);
        this.scene.stop();
        this.scene.get('Menu').scene.restart();
      });

      noBtn.on('pointerup', () => {
        playCue(this, 'ui_back');
        cleanup();
      });
    });

    const closeBtn = this.add.text(480, 405, 'Close (Esc)', BTN_STYLE)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerup', () => {
      playCue(this, 'ui_back');
      this.scene.stop();
    });

    this.escHandler = () => {
      playCue(this, 'ui_back');
      this.scene.stop();
    };
    if (this.input.keyboard) this.input.keyboard.on('keydown-ESC', this.escHandler);

    this.events.once('shutdown', () => {
      if (this.escHandler && this.input.keyboard) this.input.keyboard.off('keydown-ESC', this.escHandler);
    });
  }
}
