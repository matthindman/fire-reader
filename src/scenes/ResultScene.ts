import Phaser from 'phaser';

const GEAR_TEXT: Record<number, string> = {
  1: 'Unlocked: Kid helmet sticker',
  2: 'Unlocked: Stronger hose nozzle',
  3: 'Unlocked: Boots upgrade',
  4: 'Unlocked: Water tank upgrade',
  5: 'Unlocked: Fire truck badge',
  6: 'Unlocked: Super soaker mode',
  7: 'Unlocked: Heat shield',
  8: 'Unlocked: Rescue rope',
  9: 'Unlocked: Chief hat',
  10: 'Unlocked: Dragon medal'
};

export default class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  create() {
    const last = (this.registry.get('lastLevelCleared') as number) ?? 1;

    this.add.rectangle(0, 0, 960, 540, 0x000000, 0.65).setOrigin(0);

    this.add.text(480, 200, 'Level Clear!', {
      fontSize: '54px', color: '#00E676', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.add.text(480, 270, GEAR_TEXT[last] ?? 'Great job!', {
      fontSize: '24px', color: '#FFD700', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    const back = this.add.text(480, 390, 'Back to menu', {
      fontSize: '34px', color: '#FFFFFF', backgroundColor: '#222',
      padding: { left: 18, right: 18, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    back.on('pointerup', () => this.scene.start('Menu'));
  }
}
