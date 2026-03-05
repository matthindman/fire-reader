import Phaser from 'phaser';

const SENTENCE_CARD_DEFAULT_Y = 380;
const ACTIVE_COLOR = '#FFD700';
const DONE_COLOR = '#FFFFFF';
const DIM_ALPHA = 0.35;
const ACTIVE_SCALE = 1.1;

export default class SentenceCard extends Phaser.GameObjects.Container {
  private tokens: string[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private underline?: Phaser.GameObjects.Rectangle;
  private index = 0;

  constructor(scene: Phaser.Scene, sentence: string) {
    super(scene, 480, SENTENCE_CARD_DEFAULT_Y);
    scene.add.existing(this);
    this.reset(sentence);
  }

  reset(sentence: string) {
    this.removeAll(true);
    this.tokens = sentence.split(' ');
    this.texts = [];
    this.index = 0;
    this.underline = undefined;

    const fontSize = Math.max(26, Math.min(44, Math.floor(840 / Math.max(4, this.tokens.length))));
    const gap = 14;

    const temp: Phaser.GameObjects.Text[] = [];
    let totalWidth = 0;

    for (const token of this.tokens) {
      const t = this.scene.add.text(0, 0, token, {
        fontSize: `${fontSize}px`,
        color: DONE_COLOR,
        stroke: '#101010',
        strokeThickness: 6,
        fontFamily: 'sans-serif'
      });
      temp.push(t);
      totalWidth += t.width;
    }
    totalWidth += gap * (temp.length - 1);

    let x = -totalWidth / 2;
    temp.forEach((t, i) => {
      t.setPosition(x, 0);
      if (i === 0) {
        t.setAlpha(1);
        t.setColor(ACTIVE_COLOR);
        t.setScale(ACTIVE_SCALE);
      } else {
        t.setAlpha(DIM_ALPHA);
      }
      this.add(t);
      this.texts.push(t);
      x += t.width + gap;
    });

    // Underline beneath current word
    if (this.texts.length > 0) {
      const first = this.texts[0];
      this.underline = this.scene.add.rectangle(
        first.x + (first.width * ACTIVE_SCALE) / 2,
        first.y + first.height + 4,
        first.width * ACTIVE_SCALE,
        3,
        0xFFD700
      ).setOrigin(0.5, 0);
      this.add(this.underline);
    }
  }

  resetCurrent() {
    this.index = 0;
    for (let i = 0; i < this.texts.length; i++) {
      const t = this.texts[i];
      if (i === 0) {
        t.setAlpha(1);
        t.setColor(ACTIVE_COLOR);
        t.setScale(ACTIVE_SCALE);
      } else {
        t.setAlpha(DIM_ALPHA);
        t.setColor(DONE_COLOR);
        t.setScale(1);
      }
    }
    this.moveUnderline(this.texts[0]);
  }

  currentWord(): string | null {
    return this.index < this.tokens.length ? this.tokens[this.index] : null;
  }

  advance(): boolean {
    // Deactivate previous word
    if (this.index < this.texts.length) {
      const prev = this.texts[this.index];
      prev.setAlpha(1);
      this.scene.tweens.add({
        targets: prev,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Quad.easeOut'
      });
      prev.setColor(DONE_COLOR);
    }

    this.index++;
    if (this.index >= this.texts.length) return false;

    // Activate new current word
    const curr = this.texts[this.index];
    curr.setAlpha(1);
    curr.setColor(ACTIVE_COLOR);
    this.scene.tweens.add({
      targets: curr,
      scaleX: ACTIVE_SCALE,
      scaleY: ACTIVE_SCALE,
      duration: 200,
      ease: 'Back.easeOut'
    });

    // Ensure future words stay dim
    for (let i = this.index + 1; i < this.texts.length; i++) {
      this.texts[i].setAlpha(DIM_ALPHA);
    }

    this.moveUnderline(curr);
    return true;
  }

  private moveUnderline(target: Phaser.GameObjects.Text) {
    if (!this.underline) return;
    const targetX = target.x + (target.width * ACTIVE_SCALE) / 2;
    const targetY = target.y + target.height + 4;
    const targetW = target.width * ACTIVE_SCALE;

    this.scene.tweens.add({
      targets: this.underline,
      x: targetX,
      y: targetY,
      width: targetW,
      duration: 200,
      ease: 'Quad.easeOut'
    });
  }
}
