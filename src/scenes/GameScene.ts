import Phaser from 'phaser';
import { LEVELS } from '../data/levels';
import type { LevelData, SaveData } from '../types';
import { Scheduler, type Rating, applyRating } from '../spacedRepetition';
import { loadProfile, debouncedSaveProfile, flushSaveProfile, saveProfile } from '../storage';
import { LEVEL_BGS, LEVEL_BOSS_ANIMS } from '../visuals';
import { atlasFrame } from '../atlasUtil';
import SentenceCard from '../ui/SentenceCard';
import { GAME_CONSTANTS } from '../constants';

export default class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  private profile!: SaveData;
  private levelNum!: number;
  private levelData!: LevelData;

  private scheduler?: Scheduler;
  private currentId: string | null = null;

  private bossTargets = new Set<string>();
  private bossCleared = new Set<string>();
  private bossHP = 0;
  private maxHP = 0;

  private mistakes = 0;
  private winInProgress = false;
  private grading = false;

  private hpBarBack!: Phaser.GameObjects.Rectangle;
  private hpBar!: Phaser.GameObjects.Rectangle;

  private kid!: Phaser.GameObjects.Sprite;
  private boss!: Phaser.GameObjects.Sprite;
  private wordText!: Phaser.GameObjects.Text;

  private sentenceCard?: SentenceCard;
  private sentenceOrder: number[] = [];
  private sentenceIndex = 0;

  private onE = () => void this.grade('easy');
  private onH = () => void this.grade('hard');
  private onF = () => void this.grade('fail');

  create() {
    this.add.text(480, 270, 'Loading...', { fontSize: '24px', color: '#AAAAAA' }).setOrigin(0.5);
    void this.initAsync();
  }

  private async initAsync() {
    this.children.removeAll(true);

    this.mistakes = 0;
    this.bossHP = 0;
    this.maxHP = 0;
    this.winInProgress = false;
    this.grading = false;
    this.bossTargets = new Set();
    this.bossCleared = new Set();
    this.currentId = null;
    this.scheduler = undefined;
    this.sentenceCard = undefined;
    this.sentenceOrder = [];
    this.sentenceIndex = 0;

    this.profile = await loadProfile();
    this.levelNum = (this.registry.get('nextLevel') as number) ?? 1;
    this.levelData = LEVELS[this.levelNum];

    const bgKey = LEVEL_BGS[this.levelNum] ?? 'bg1';
    const bg = this.add.image(480, 270, bgKey);
    bg.setDisplaySize(960, 540);

    this.add.text(20, 16, `Level ${this.levelNum}: ${this.levelData.title}`, {
      fontSize: '18px', color: '#FFFFFF', fontFamily: 'sans-serif'
    });
    this.add.text(20, 38, this.levelData.phonics, {
      fontSize: '16px', color: '#FFD700', fontFamily: 'sans-serif'
    });

    this.hpBarBack = this.add.rectangle(480, 26, 320, 14, 0x333333).setOrigin(0.5);
    this.hpBar = this.add.rectangle(480 - 160, 26, 320, 14, 0xff4444).setOrigin(0, 0.5);

    this.kid = this.add.sprite(180, 380, 'atlas', atlasFrame('kid_idle_0')).play('kid_idle');
    this.kid.setScale(1.0);

    const bossAnim = LEVEL_BOSS_ANIMS[this.levelNum] ?? 'boss_kitchen';
    this.boss = this.add.sprite(780, 310, 'atlas', atlasFrame(`${bossAnim}_0`)).play(bossAnim);
    this.boss.setScale(this.levelNum === 10 ? 1.15 : 1.0);

    this.wordText = this.add.text(480, 220, '', {
      fontFamily: 'sans-serif', fontSize: '72px', color: '#F5F5F5'
    }).setOrigin(0.5);

    const y = 470;
    this.makeButton(250, y, 'Easy (E)', () => void this.grade('easy'));
    this.makeButton(480, y, 'Hard (H)', () => void this.grade('hard'));
    this.makeButton(710, y, 'Try again (F)', () => void this.grade('fail'));

    this.input.keyboard?.on('keydown-E', this.onE);
    this.input.keyboard?.on('keydown-H', this.onH);
    this.input.keyboard?.on('keydown-F', this.onF);

    this.events.once('shutdown', () => {
      this.input.keyboard?.off('keydown-E', this.onE);
      this.input.keyboard?.off('keydown-H', this.onH);
      this.input.keyboard?.off('keydown-F', this.onF);
      void flushSaveProfile();
    });

    if (this.levelNum === 10) this.initSentenceMode();
    else this.initWordMode();

    this.renderHUD();
  }

  private initWordMode() {
    const rawTargets = [...(this.levelData.new ?? []), ...(this.levelData.trick ?? [])];
    const targets = Array.from(new Set(rawTargets));

    this.bossTargets = new Set(targets);
    this.bossCleared = new Set();
    this.maxHP = this.bossHP = targets.length;

    const review = this.selectReviewWords(GAME_CONSTANTS.REVIEW_WORDS_LIMIT, this.bossTargets);
    const deck = this.buildInterleavedDeck(targets, review);

    this.scheduler = new Scheduler(deck, this.profile.words);
    this.currentId = this.scheduler.next();
    this.setWordText(this.currentId ?? '');
  }

  private initSentenceMode() {
    const sentences = this.levelData.sentences ?? [];
    const hp = Math.min(this.levelData.hp, sentences.length);

    this.maxHP = this.bossHP = hp;

    const indices = Array.from({ length: sentences.length }, (_, i) => i);
    this.sentenceOrder = shuffle(indices).slice(0, hp);
    this.sentenceIndex = 0;

    this.sentenceCard = new SentenceCard(this, sentences[this.sentenceOrder[0]]);
    this.wordText.setText('');
    this.wordText.setAlpha(0);
  }

  private selectReviewWords(limit: number, exclude: Set<string>): string[] {
    const now = Date.now();
    const due = Object.entries(this.profile.words)
      .filter(([w, s]) => !exclude.has(w) && (s.due ?? 0) <= now)
      .sort((a, b) => (a[1].due ?? 0) - (b[1].due ?? 0))
      .slice(0, limit)
      .map(([w]) => w);

    if (due.length >= limit) return due;

    const pool = Object.keys(this.profile.words).filter(w => !exclude.has(w) && !due.includes(w));
    const fill = shuffle(pool).slice(0, limit - due.length);
    return [...due, ...fill];
  }

  private buildInterleavedDeck(targets: string[], review: string[]): string[] {
    const t = shuffle(targets);
    const r = shuffle(review);
    const out: string[] = [];
    let ti = 0, ri = 0;

    while (ti < t.length || ri < r.length) {
      const batch = Math.min(3 + Math.floor(Math.random() * 2), t.length - ti);
      for (let i = 0; i < batch && ti < t.length; i++) out.push(t[ti++]);
      if (ri < r.length) out.push(r[ri++]);
    }
    return out;
  }

  private makeButton(x: number, y: number, label: string, cb: () => void) {
    const btn = this.add.text(x, y, label, {
      backgroundColor: '#222',
      color: '#FFFFFF',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      fontSize: '22px'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    let pressed = false;

    btn.on('pointerdown', () => {
      pressed = true;
      btn.setScale(0.92);
      btn.setBackgroundColor('#444');
    });

    btn.on('pointerup', () => {
      if (!pressed) return;
      pressed = false;
      btn.setScale(1);
      btn.setBackgroundColor('#222');
      cb();
    });

    btn.on('pointerout', () => {
      pressed = false;
      btn.setScale(1);
      btn.setBackgroundColor('#222');
    });
  }

  private setWordText(word: string) {
    const cleaned = word ?? '';
    const len = Math.max(1, cleaned.length);
    this.wordText.setAlpha(1);
    this.wordText.setFontSize(Math.max(44, Math.min(72, Math.floor(92 - len * 4))));
    this.wordText.setText(cleaned);
  }

  private renderHUD() {
    const frac = this.maxHP > 0 ? this.bossHP / this.maxHP : 1;
    this.hpBar.width = 320 * Phaser.Math.Clamp(frac, 0, 1);
    this.hpBar.x = 480 - 160;
  }

  private spray(r: Rating) {
    this.sound.play('spray');

    const water = this.add.image(this.kid.x + 40, this.kid.y - 40, 'atlas', atlasFrame('water'));
    water.setScale(2.5);

    if (r === 'fail') {
      water.setTint(0x888888);
      this.tweens.add({
        targets: water,
        x: this.boss.x - 120,
        y: this.boss.y + 40,
        alpha: 0,
        duration: 280,
        onComplete: () => water.destroy()
      });
      return;
    }

    if (r === 'hard') water.setTint(0xffcc66);
    if (r === 'easy') water.setTint(0x66ccff);

    this.tweens.add({
      targets: water,
      x: this.boss.x - 40,
      y: this.boss.y - 20,
      duration: 280,
      onComplete: () => {
        water.destroy();
        if (r === 'easy') {
          this.boss.setTintFill(0xffffff);
          this.time.delayedCall(80, () => this.boss.clearTint());
        }
      }
    });
  }

  private async grade(r: Rating) {
    if (this.winInProgress || this.grading) return;

    this.grading = true;
    try {
      this.spray(r);

      if (this.levelNum === 10 && this.sentenceCard) {
        await this.gradeSentence(r);
        return;
      }
      await this.gradeWord(r);
    } finally {
      this.grading = false;
    }
  }

  private async gradeWord(r: Rating) {
    if (!this.scheduler || !this.currentId) return;

    this.scheduler.grade(this.currentId, r);
    debouncedSaveProfile(this.profile);

    if (r === 'fail') {
      this.sound.play('fail');
      if (++this.mistakes >= GAME_CONSTANTS.MAX_FAILS_PER_LEVEL) return this.restartLevel();
    }

    if (r === 'easy') {
      this.sound.play('hit');
      if (this.bossTargets.has(this.currentId) && !this.bossCleared.has(this.currentId)) {
        this.bossCleared.add(this.currentId);
        this.bossHP--;
        this.renderHUD();
      }
      if (this.bossHP <= 0) {
        await this.win();
        return;
      }
    }

    this.currentId = this.scheduler.next();
    if (!this.currentId) {
      if (this.bossHP <= 0) await this.win();
      else this.restartLevel();
      return;
    }
    this.setWordText(this.currentId);
  }

  private async gradeSentence(r: Rating) {
    const token = this.sentenceCard!.currentWord();
    if (token) {
      const key = normalizeWord(token);
      if (key) {
        this.profile.words[key] = applyRating(this.profile.words[key], r);
        debouncedSaveProfile(this.profile);
      }
    }

    if (r === 'fail') {
      this.sound.play('fail');
      if (++this.mistakes >= GAME_CONSTANTS.MAX_FAILS_PER_LEVEL) return this.restartLevel();
      this.sentenceCard!.resetCurrent();
      return;
    }

    const hasMore = this.sentenceCard!.advance();
    if (hasMore) return;

    if (r === 'easy') {
      this.sound.play('hit');
      this.bossHP--;
      this.renderHUD();
      if (this.bossHP <= 0) {
        await this.win();
        return;
      }
    }

    this.sentenceIndex++;
    if (this.sentenceIndex >= this.sentenceOrder.length) {
      this.sentenceIndex = 0;
      this.sentenceOrder = shuffle(this.sentenceOrder);
    }

    const idx = this.sentenceOrder[this.sentenceIndex];
    this.sentenceCard!.reset(this.levelData.sentences![idx]);
  }

  private restartLevel() {
    this.winInProgress = true; // lock input
    this.add.rectangle(0, 0, 960, 540, 0x000000, 0.55).setOrigin(0);
    this.add.text(480, 270, "Let's try that fire again!", {
      fontSize: '32px', color: '#FFD700', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.time.delayedCall(900, () => this.scene.restart());
  }

  private async win() {
    if (this.winInProgress) return;
    this.winInProgress = true;

    if (this.levelNum === this.profile.unlockedLevel && this.levelNum < 10) {
      this.profile.unlockedLevel++;
    }

    await flushSaveProfile();
    await saveProfile(this.profile);

    this.registry.set('lastLevelCleared', this.levelNum);
    this.sound.play('victory');

    this.time.delayedCall(50, () => {
      this.winInProgress = false;
      this.scene.start('Result');
    });
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeWord(token: string): string {
  return token.toLowerCase().replace(/[^\p{L}]/gu, '');
}
