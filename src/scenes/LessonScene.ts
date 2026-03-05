import Phaser from 'phaser';
import { LEVELS } from '../data/levels';
import { getLevelBg, getLevelBoss } from '../visuals';
import { atlasFrame, hasAtlasFrame } from '../atlasUtil';
import { playCue, requestMenuMusic, unlockAudio } from '../audio';
import type { LevelData } from '../types';

export default class LessonScene extends Phaser.Scene {
  private escHandler?: () => void;
  private bossPulseTween?: Phaser.Tweens.Tween;
  private startPulseTween?: Phaser.Tweens.Tween;

  constructor() { super('Lesson'); }

  init(data: { levelNum: number }) {
    this.registry.set('nextLevel', data.levelNum);
  }

  create() {
    const unlockAudioNow = () => unlockAudio(this);
    this.input.once('pointerdown', unlockAudioNow);
    if (this.input.keyboard) this.input.keyboard.once('keydown', unlockAudioNow);

    requestMenuMusic(this);

    const levelNum = this.registry.get('nextLevel') as number;
    const L = LEVELS[levelNum] as LevelData;

    this.buildScene(levelNum, L);

    this.scene.launch('VolumeOverlay');

    this.events.once('shutdown', () => this.cleanup());
  }

  private buildScene(levelNum: number, L: LevelData) {
    // --- Background + overlay ---
    const bgKey = getLevelBg(levelNum);
    const bg = this.add.image(480, 270, this.textures.exists(bgKey) ? bgKey : 'bg_kitchen').setDisplaySize(960, 540);
    bg.setAlpha(0);

    const overlay = this.add.rectangle(0, 0, 960, 540, 0x000000, 0.65).setOrigin(0);
    overlay.setAlpha(0);

    this.tweens.add({ targets: bg, alpha: 1, duration: 200, ease: 'Linear' });
    this.tweens.add({ targets: overlay, alpha: 0.65, duration: 200, ease: 'Linear' });

    // --- "Level N" ---
    const levelLabel = this.add.text(480, 36, `Level ${levelNum}`, {
      fontSize: '22px', color: '#FFFFFF', fontFamily: 'sans-serif'
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(100, () => {
      levelLabel.setY(16);
      this.tweens.add({
        targets: levelLabel,
        alpha: 1,
        y: 36,
        duration: 300,
        ease: 'Quad.easeOut'
      });
    });

    // --- Title ---
    const title = this.add.text(480, 72, L.title, {
      fontSize: '38px', color: '#FFD700', fontFamily: 'sans-serif',
      stroke: '#000000', strokeThickness: 4
    }).setOrigin(0.5).setScale(0);

    this.time.delayedCall(200, () => {
      this.tweens.add({
        targets: title,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        ease: 'Bounce.easeOut'
      });
    });

    // --- Phonics ---
    const phonics = this.add.text(480, 102, L.phonics, {
      fontSize: '18px', color: '#66ccff', fontFamily: 'sans-serif'
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(350, () => {
      phonics.setY(112);
      this.tweens.add({
        targets: phonics,
        alpha: 1,
        y: 102,
        duration: 300,
        ease: 'Quad.easeOut'
      });
    });

    // --- Boss sprite ---
    const bossAnimKey = getLevelBoss(levelNum);
    const isDragon = bossAnimKey === 'dragon';
    const bossTargetScale = isDragon ? 0.65 : 0.75;
    const bossFrame = isDragon ? `${bossAnimKey}_0` : `${bossAnimKey}_1`;
    const hasBossFrame = hasAtlasFrame(bossFrame);
    const boss = this.add.sprite(960, 220, 'atlas', atlasFrame(hasBossFrame ? bossFrame : 'boss_kitchen_1'));
    boss.setOrigin(0.5).setScale(0);

    this.time.delayedCall(400, () => {
      if (hasBossFrame) boss.play(bossAnimKey);
      this.tweens.add({
        targets: boss,
        x: 760,
        scaleX: bossTargetScale,
        scaleY: bossTargetScale,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.bossPulseTween = this.tweens.add({
            targets: boss,
            scaleX: bossTargetScale + 0.03,
            scaleY: bossTargetScale + 0.03,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    });

    // --- Kid sprite ---
    const kid = this.add.sprite(0, 220, 'atlas', atlasFrame('kid_idle_0'));
    kid.setOrigin(0.5).setScale(0);

    this.time.delayedCall(500, () => {
      kid.play('kid_idle');
      this.tweens.add({
        targets: kid,
        x: 200,
        scaleX: 0.75,
        scaleY: 0.75,
        duration: 500,
        ease: 'Back.easeOut'
      });
    });

    // --- Lesson panel ---
    const panelBg = this.add.rectangle(480, 345, 600, 60, 0x111111, 0.7).setOrigin(0.5);
    const lessonText = this.add.text(480, 345, L.lesson, {
      fontSize: '20px', color: '#FFFFFF', fontFamily: 'sans-serif',
      wordWrap: { width: 580 }, align: 'center'
    }).setOrigin(0.5);

    // Resize panel to fit text
    const textHeight = lessonText.height + 20;
    panelBg.setSize(600, textHeight);

    panelBg.setAlpha(0);
    lessonText.setAlpha(0);

    this.time.delayedCall(900, () => {
      this.tweens.add({ targets: panelBg, alpha: 0.7, duration: 400, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: lessonText, alpha: 1, duration: 400, ease: 'Quad.easeOut' });
    });

    // --- Word preview pills ---
    const wordPills: Phaser.GameObjects.Text[] = [];
    if (L.sentences && L.sentences.length > 0) {
      const countText = this.add.text(480, 420, `${L.sentences.length} sentences to read`, {
        fontSize: '16px', color: '#FFD700', fontFamily: 'sans-serif',
        stroke: '#000000', strokeThickness: 2
      }).setOrigin(0.5).setAlpha(0).setScale(0);
      wordPills.push(countText);
    } else if (L.new) {
      const sampleWords = L.new.slice(0, 8);
      const totalWidth = sampleWords.length * 60;
      const startX = 480 - (totalWidth / 2);

      for (let i = 0; i < sampleWords.length; i++) {
        const word = sampleWords[i];
        const spacing = totalWidth / sampleWords.length;
        const x = startX + spacing * i + spacing / 2;
        const pill = this.add.text(x, 420, word, {
          fontSize: '16px', color: '#FFD700', fontFamily: 'sans-serif',
          stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5).setAlpha(0).setScale(0);
        wordPills.push(pill);
      }
    }

    this.time.delayedCall(1100, () => {
      wordPills.forEach((pill, i) => {
        this.time.delayedCall(i * 60, () => {
          this.tweens.add({
            targets: pill,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 250,
            ease: 'Back.easeOut'
          });
        });
      });
    });

    // --- Start button ---
    const startBtn = this.add.text(480, 475, '  Start Level!  ', {
      fontSize: '34px', color: '#00E676', fontFamily: 'sans-serif',
      backgroundColor: '#222222',
      padding: { left: 24, right: 24, top: 8, bottom: 8 }
    }).setOrigin(0.5).setScale(0).setInteractive({ useHandCursor: true });

    startBtn.on('pointerdown', () => { startBtn.setScale(0.92); });
    startBtn.on('pointerup', () => {
      startBtn.setScale(1);
      playCue(this, 'ui_confirm');
      this.scene.start('Game');
    });
    startBtn.on('pointerout', () => {
      if (startBtn.scale < 1) startBtn.setScale(1);
    });

    this.time.delayedCall(1400, () => {
      this.tweens.add({
        targets: startBtn,
        scaleX: 1,
        scaleY: 1,
        duration: 350,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.startPulseTween = this.tweens.add({
            targets: startBtn,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    });

    // --- Back to menu ---
    const backText = this.add.text(56, 515, 'Back to menu', {
      fontSize: '16px', color: '#AAAAAA', fontFamily: 'sans-serif'
    }).setAlpha(0).setInteractive({ useHandCursor: true });

    backText.on('pointerup', () => {
      playCue(this, 'ui_back');
      this.scene.start('Menu');
    });

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: backText,
        alpha: 1,
        duration: 300,
        ease: 'Linear'
      });
    });

    // ESC key handler
    this.escHandler = () => {
      playCue(this, 'ui_back');
      this.scene.start('Menu');
    };
    if (this.input.keyboard) this.input.keyboard.on('keydown-ESC', this.escHandler);
  }

  private cleanup() {
    this.scene.stop('VolumeOverlay');
    if (this.bossPulseTween) {
      this.bossPulseTween.stop();
      this.bossPulseTween = undefined;
    }
    if (this.startPulseTween) {
      this.startPulseTween.stop();
      this.startPulseTween = undefined;
    }
    if (this.escHandler && this.input.keyboard) {
      this.input.keyboard.off('keydown-ESC', this.escHandler);
    }
  }
}
