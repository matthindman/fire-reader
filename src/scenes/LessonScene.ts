import Phaser from 'phaser';
import { LEVELS } from '../data/levels';
import { ensureBgm } from '../audio';
import type { LevelData } from '../types';

export default class LessonScene extends Phaser.Scene {
  private escHandler?: () => void;

  constructor() { super('Lesson'); }

  init(data: { levelNum: number }) {
    this.registry.set('nextLevel', data.levelNum);
  }

  create() {
    const unlockAudio = () => ensureBgm(this);
    this.input.once('pointerdown', unlockAudio);
    this.input.keyboard?.once('keydown', unlockAudio);

    const levelNum = this.registry.get('nextLevel') as number;
    const L = LEVELS[levelNum] as LevelData;

    this.add.rectangle(0, 0, 960, 540, 0x000000, 0.72).setOrigin(0);

    this.add.text(480, 70, `Level ${levelNum}: ${L.title}`, {
      fontSize: '34px', color: '#FFD700', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.add.text(160, 130, L.lesson, {
      fontSize: '26px', color: '#FFFFFF', wordWrap: { width: 640 }
    });

    const start = this.add.text(480, 465, 'Start Level >', {
      fontSize: '32px', color: '#00E676', backgroundColor: '#222',
      padding: { left: 22, right: 22, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    start.on('pointerup', () => this.scene.start('Game'));

    this.add.text(20, 510, 'Esc: back to menu', { fontSize: '16px', color: '#AAAAAA' });

    this.escHandler = () => this.scene.start('Menu');
    this.input.keyboard?.on('keydown-ESC', this.escHandler);

    this.events.once('shutdown', () => {
      if (this.escHandler) this.input.keyboard?.off('keydown-ESC', this.escHandler);
    });
  }
}
