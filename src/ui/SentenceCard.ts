import Phaser from 'phaser';

export default class SentenceCard extends Phaser.GameObjects.Container {
  private tokens: string[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private index = 0;

  constructor(scene: Phaser.Scene, sentence: string) {
    super(scene, 480, 220);
    scene.add.existing(this);
    this.reset(sentence);
  }

  reset(sentence: string) {
    this.removeAll(true);
    this.tokens = sentence.split(' ');
    this.texts = [];
    this.index = 0;

    const fontSize = Math.max(26, Math.min(44, Math.floor(840 / Math.max(4, this.tokens.length))));
    const gap = 14;

    const temp: Phaser.GameObjects.Text[] = [];
    let totalWidth = 0;

    for (const token of this.tokens) {
      const t = this.scene.add.text(0, 0, token, {
        fontSize: `${fontSize}px`,
        color: '#FFFFFF',
        fontFamily: 'sans-serif'
      });
      temp.push(t);
      totalWidth += t.width;
    }
    totalWidth += gap * (temp.length - 1);

    let x = -totalWidth / 2;
    temp.forEach((t, i) => {
      t.setPosition(x, 0);
      t.setAlpha(i === 0 ? 1 : 0.35);
      this.add(t);
      this.texts.push(t);
      x += t.width + gap;
    });
  }

  resetCurrent() {
    this.index = 0;
    for (let i = 0; i < this.texts.length; i++) {
      this.texts[i].setAlpha(i === 0 ? 1 : 0.35);
    }
  }

  currentWord(): string | null {
    return this.tokens[this.index] ?? null;
  }

  advance(): boolean {
    if (this.index < this.texts.length) this.texts[this.index].setAlpha(1);
    this.index++;

    if (this.index >= this.texts.length) return false;

    for (let i = 0; i < this.texts.length; i++) {
      if (i < this.index) this.texts[i].setAlpha(1);
      else if (i === this.index) this.texts[i].setAlpha(1);
      else this.texts[i].setAlpha(0.35);
    }
    return true;
  }
}
