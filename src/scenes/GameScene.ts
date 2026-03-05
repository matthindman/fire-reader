import Phaser from 'phaser';
import { LEVELS } from '../data/levels';
import type { LevelData, SaveData } from '../types';
import { Scheduler, type Rating, applyRating } from '../spacedRepetition';
import { loadProfile, debouncedSaveProfile, flushSaveProfile, saveProfile } from '../storage';
import { LEVEL_VISUALS, getLevelBg, getLevelBoss } from '../visuals';
import { atlasFrame, hasAtlasFrame } from '../atlasUtil';
import { getBossIdlePair } from '../anims';
import SentenceCard from '../ui/SentenceCard';
import { GAME_CONSTANTS } from '../constants';
import { duckMusic, playCue, requestGameMusic, unlockAudio } from '../audio';

const GEAR_TEXT: Record<number, string> = {
  1:  'Unlocked: Kid helmet sticker',
  2:  'Unlocked: Stronger hose nozzle',
  3:  'Zone Clear! Unlocked: Boots upgrade',
  4:  'Unlocked: Blue suspenders',
  5:  'Unlocked: Pet rescue patch',
  6:  'Zone Clear! Unlocked: Water tank upgrade',
  7:  'Unlocked: Campfire badge',
  8:  'Unlocked: Grocery cart shield',
  9:  'Zone Clear! Unlocked: Fire truck badge',
  10: 'Unlocked: Station dog companion',
  11: 'Unlocked: Pizza slice power-up',
  12: 'Zone Clear! Unlocked: Super soaker mode',
  13: 'Unlocked: Racing stripe decal',
  14: 'Unlocked: Movie star sunglasses',
  15: 'Zone Clear! Unlocked: Heat shield',
  16: 'Unlocked: BBQ tongs of power',
  17: 'Unlocked: Hard hat upgrade',
  18: 'Zone Clear! Unlocked: Rescue rope',
  19: 'Unlocked: Forest ranger badge',
  20: 'Unlocked: Lighthouse beacon',
  21: 'Zone Clear! Unlocked: Captain hat',
  22: 'Unlocked: Warehouse key ring',
  23: 'Unlocked: Train conductor whistle',
  24: 'Zone Clear! Unlocked: Turbo hose',
  25: 'Unlocked: Office tower ID badge',
  26: 'Unlocked: Medic cross patch',
  27: 'Zone Clear! Unlocked: Chief hat',
  28: 'Unlocked: Golden toy trophy',
  29: 'Zone Clear! Unlocked: Arcade champion token',
  30: 'Unlocked: Circus performer ribbon',
  31: 'Unlocked: Helicopter wings',
  32: 'Unlocked: Speedboat racing flag',
  33: 'Unlocked: Pirate treasure map',
  34: 'Unlocked: Monster truck flames',
  35: 'Unlocked: Jungle explorer hat',
  36: 'Unlocked: Volcano crystal',
  37: 'Unlocked: Rocket fuel pack',
  38: 'VICTORY! Unlocked: Dragon medal'
};

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
  private bossPulseTween?: Phaser.Tweens.Tween;

  private splashEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private defeatEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private confettiEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private bossRecoilTween?: Phaser.Tweens.Tween;
  private kidCelebTween?: Phaser.Tweens.Tween;
  private bossRestX = 780;
  private kidRestY = 380;
  private gameplayUI: Phaser.GameObjects.GameObject[] = [];
  private victoryBounceTween?: Phaser.Tweens.Tween;
  private streak = 0;
  private maxStreak = 0;
  private streakText!: Phaser.GameObjects.Text;

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
    this.gameplayUI = [];
    this.victoryBounceTween = undefined;
    this.maxStreak = 0;

    this.profile = await loadProfile();
    const levelRaw = this.registry.get('nextLevel') as number | undefined;
    this.levelNum = typeof levelRaw === 'number' ? levelRaw : 1;
    this.levelData = LEVELS[this.levelNum];

    if (this.levelNum > this.profile.unlockedLevel) {
      this.profile.unlockedLevel = this.levelNum;
      await saveProfile(this.profile);
    }

    requestGameMusic(this, this.levelNum);

    const bgKey = getLevelBg(this.levelNum);
    const bg = this.add.image(480, 270, this.textures.exists(bgKey) ? bgKey : 'bg_kitchen');
    bg.setDisplaySize(960, 540);

    const titleLabel = this.add.text(20, 16, `Level ${this.levelNum}: ${this.levelData.title}`, {
      fontSize: '18px', color: '#FFFFFF', fontFamily: 'sans-serif'
    });
    const phonicsLabel = this.add.text(20, 38, this.levelData.phonics, {
      fontSize: '16px', color: '#FFD700', fontFamily: 'sans-serif'
    });
    this.gameplayUI.push(titleLabel, phonicsLabel);

    this.hpBarBack = this.add.rectangle(480, 26, 320, 14, 0x333333).setOrigin(0.5);
    this.hpBar = this.add.rectangle(480 - 160, 26, 320, 14, 0xff4444).setOrigin(0, 0.5);

    this.streak = 0;
    this.streakText = this.add.text(920, 30, '', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(1, 0.5).setVisible(false);
    this.gameplayUI.push(this.streakText);

    const vis = LEVEL_VISUALS[this.levelNum];
    const kidX = vis?.kidX ?? 180;
    const kidY = vis?.kidY ?? 380;
    const bossX = vis?.bossX ?? 780;
    const bossY = vis?.bossY ?? 310;
    const bossScale = vis?.bossScale ?? 1.0;
    this.bossRestX = bossX;
    this.kidRestY = kidY;

    this.kid = this.add.sprite(kidX, kidY, 'atlas', atlasFrame('kid_idle_0')).play('kid_idle');
    this.kid.setScale(1.0);

    const bossAnim = getLevelBoss(this.levelNum);
    if (bossAnim === 'dragon') {
      this.boss = this.add.sprite(bossX, bossY, 'atlas', atlasFrame(`${bossAnim}_0`)).play(bossAnim);
      this.boss.setScale(1.15);
    } else {
      const [startIdx] = getBossIdlePair(bossAnim);
      const preferredStart = `${bossAnim}_${startIdx}`;
      const bossStartFrame = hasAtlasFrame(preferredStart) ? preferredStart : 'boss_kitchen_0';
      this.boss = this.add.sprite(bossX, bossY, 'atlas', atlasFrame(bossStartFrame)).play(bossAnim);
      this.boss.setOrigin(0.5, 0.85);
      this.boss.setScale(bossScale);

      this.bossPulseTween = this.tweens.add({
        targets: this.boss,
        scaleX: bossScale * 1.02,
        scaleY: bossScale * 1.03,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.splashEmitter = this.add.particles(0, 0, 'particle_dot', {
      speed: { min: 60, max: 180 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 450,
      gravityY: 120,
      emitting: false
    });

    this.trailEmitter = this.add.particles(0, 0, 'particle_dot', {
      speed: { min: 10, max: 40 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 300,
      gravityY: 50,
      emitting: false
    });

    this.defeatEmitter = this.add.particles(0, 0, 'particle_dot', {
      speed: { min: 80, max: 250 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: 80,
      emitting: false
    });

    this.confettiEmitter = this.add.particles(0, 0, 'particle_dot', {
      speedX: { min: -30, max: 30 },
      speedY: { min: 40, max: 100 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 1200,
      gravityY: 0,
      emitting: false
    });

    this.wordText = this.add.text(480, this.kid.y, '', {
      fontFamily: 'sans-serif',
      fontSize: '72px',
      color: '#F5F5F5',
      stroke: '#101010',
      strokeThickness: 10
    }).setOrigin(0.5);

    const y = 470;
    this.gameplayUI.push(
      this.makeButton(250, y, 'Easy (E)', () => void this.grade('easy')),
      this.makeButton(480, y, 'Hard (H)', () => void this.grade('hard')),
      this.makeButton(710, y, 'Try again (F)', () => void this.grade('fail'))
    );

    const unlockAudioNow = () => unlockAudio(this);
    this.input.once('pointerdown', unlockAudioNow);
    if (this.input.keyboard) this.input.keyboard.once('keydown', unlockAudioNow);

    if (this.input.keyboard) this.input.keyboard.on('keydown-E', this.onE);
    if (this.input.keyboard) this.input.keyboard.on('keydown-H', this.onH);
    if (this.input.keyboard) this.input.keyboard.on('keydown-F', this.onF);

    this.events.once('shutdown', () => {
      this.scene.stop('VolumeOverlay');
      if (this.input.keyboard) this.input.keyboard.off('keydown-E', this.onE);
      if (this.input.keyboard) this.input.keyboard.off('keydown-H', this.onH);
      if (this.input.keyboard) this.input.keyboard.off('keydown-F', this.onF);
      if (this.bossPulseTween) {
        this.bossPulseTween.stop();
        this.bossPulseTween = undefined;
      }
      if (this.bossRecoilTween) {
        this.bossRecoilTween.stop();
        this.bossRecoilTween = undefined;
      }
      if (this.kidCelebTween) {
        this.kidCelebTween.stop();
        this.kidCelebTween = undefined;
      }
      if (this.victoryBounceTween) {
        this.victoryBounceTween.stop();
        this.victoryBounceTween = undefined;
      }
      if (this.wordTransitionTween) {
        this.wordTransitionTween.stop();
        this.wordTransitionTween = undefined;
      }
      if (this.defeatEmitter) {
        this.defeatEmitter.destroy();
        this.defeatEmitter = undefined;
      }
      if (this.confettiEmitter) {
        this.confettiEmitter.destroy();
        this.confettiEmitter = undefined;
      }
      void flushSaveProfile();
    });

    if (this.levelData.sentences && this.levelData.sentences.length > 0) {
      this.initSentenceMode();
    } else {
      this.initWordMode();
    }

    this.renderHUD();
    this.scene.launch('VolumeOverlay');
  }

  private initWordMode() {
    const newWords = this.levelData.new ? this.levelData.new : [];
    const trickWords = this.levelData.trick ? this.levelData.trick : [];
    const allTargets = shuffle(Array.from(new Set([...newWords, ...trickWords])));

    // HP based on new words only (trick words are practice-only)
    const uniqueNew = Array.from(new Set(newWords));
    this.bossTargets = new Set(uniqueNew);
    this.bossCleared = new Set();
    this.maxHP = this.bossHP = uniqueNew.length;

    // All targets enter the deck (practice), but only new words reduce HP
    const review = this.selectReviewWords(GAME_CONSTANTS.REVIEW_WORDS_LIMIT, new Set(allTargets));
    const deck = this.buildInterleavedDeck(allTargets, review);

    this.scheduler = new Scheduler(deck, this.profile.words);
    this.currentId = this.scheduler.next();
    this.setWordText(this.currentId ? this.currentId : '');
  }

  private initSentenceMode() {
    const sentences = this.levelData.sentences ? this.levelData.sentences : [];
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
    return Object.entries(this.profile.words)
      .filter(([w, s]) => !exclude.has(w) && (s.due ? s.due : 0) <= now)
      .sort((a, b) => (a[1].due ? a[1].due : 0) - (b[1].due ? b[1].due : 0))
      .slice(0, limit)
      .map(([w]) => w);
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

  private makeButton(x: number, y: number, label: string, cb: () => void): Phaser.GameObjects.Text {
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

    return btn;
  }

  private wordTransitionTween?: Phaser.Tweens.Tween;

  private setWordText(word: string, animate = true) {
    const cleaned = word ? word : '';
    const len = Math.max(1, cleaned.length);

    // Kill any in-flight transition
    if (this.wordTransitionTween) {
      this.wordTransitionTween.stop();
      this.wordTransitionTween = undefined;
    }

    if (!animate || this.wordText.text === '') {
      // First word or no animation requested: show immediately
      this.wordText.setAlpha(1).setScale(1);
      this.wordText.setFontSize(Math.max(44, Math.min(72, Math.floor(92 - len * 4))));
      this.wordText.setText(cleaned);
      return;
    }

    // Fade out old word
    this.wordTransitionTween = this.tweens.add({
      targets: this.wordText,
      scaleX: 0.85,
      scaleY: 0.85,
      alpha: 0,
      duration: 120,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // Swap text while invisible
        this.wordText.setFontSize(Math.max(44, Math.min(72, Math.floor(92 - len * 4))));
        this.wordText.setText(cleaned);
        // Fade in new word
        this.wordTransitionTween = this.tweens.add({
          targets: this.wordText,
          scaleX: 1,
          scaleY: 1,
          alpha: 1,
          duration: 150,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.wordTransitionTween = undefined;
          }
        });
      }
    });
  }

  private renderHUD() {
    const frac = this.maxHP > 0 ? this.bossHP / this.maxHP : 1;
    const targetWidth = 320 * Phaser.Math.Clamp(frac, 0, 1);
    this.hpBar.x = 480 - 160;
    this.tweens.add({
      targets: this.hpBar,
      width: targetWidth,
      duration: 300,
      ease: 'Quad.easeOut'
    });
  }

  private hpBarDamageEffect() {
    // Flash HP bar white
    this.hpBar.setFillStyle(0xffffff);
    this.time.delayedCall(80, () => this.hpBar.setFillStyle(0xff4444));

    // Floating "-1" damage number
    const dmgText = this.add.text(480, this.hpBar.y + 4, '-1', {
      fontSize: '22px',
      color: '#FFD700',
      fontFamily: 'sans-serif',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dmgText,
      y: dmgText.y - 40,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => dmgText.destroy()
    });
  }

  private spray(r: Rating) {
    if (r !== 'fail') playCue(this, 'spray_shot');

    const water = this.add.image(this.kid.x + 40, this.kid.y - 40, 'atlas', atlasFrame('water'));
    water.setScale(2.5);

    if (r === 'fail') {
      water.setTint(0x888888);
      const missX = this.boss.x - 120;
      const missY = this.boss.y + 40;
      this.tweens.add({
        targets: water,
        x: missX,
        y: missY,
        alpha: 0,
        duration: 280,
        onComplete: () => {
          water.destroy();
          // Gray splash at miss point
          if (this.splashEmitter) {
            this.splashEmitter.setParticleTint(0x888888);
            this.splashEmitter.emitParticleAt(missX, missY, 4);
          }
        }
      });
      // Boss dodges left (water "missed")
      this.bossDodge();
      return;
    }

    const isEasy = r === 'easy';
    const tintColor = isEasy ? 0x66ccff : 0xffcc66;
    water.setTint(tintColor);

    // Kid celebration on Easy or Hard (scaled down for Hard)
    if (isEasy) this.kidCelebrate();
    else this.kidCelebrateSmall();

    // Water trail particles during flight
    const trailTimer = this.time.addEvent({
      delay: 40,
      repeat: 6,
      callback: () => {
        if (this.trailEmitter && water.active) {
          this.trailEmitter.setParticleTint(tintColor);
          this.trailEmitter.emitParticleAt(water.x, water.y, 2);
        }
      }
    });

    this.tweens.add({
      targets: water,
      x: this.boss.x - 40,
      y: this.boss.y - 20,
      duration: 280,
      onComplete: () => {
        water.destroy();
        trailTimer.destroy();

        // Particle splash at impact (scaled by streak for Easy)
        if (this.splashEmitter) {
          this.splashEmitter.setParticleTint(tintColor);
          const splashCount = isEasy ? 12 + Math.min(this.streak * 2, 12) : 8;
          this.splashEmitter.emitParticleAt(this.boss.x - 40, this.boss.y - 20, splashCount);
        }

        if (isEasy) {
          // Full boss flash + screen shake + recoil for Easy
          this.boss.setTintFill(0xffffff);
          this.time.delayedCall(80, () => this.boss.clearTint());

          const shakeDur = Math.min(120 + this.streak * 10, 200);
          const shakeInt = Math.min(0.004 + this.streak * 0.0005, 0.008);
          this.cameras.main.shake(shakeDur, shakeInt);

          this.bossRecoil();
        } else {
          // Lighter boss tint flash + smaller recoil for Hard (no screen shake)
          this.boss.setTintFill(0xdddddd);
          this.time.delayedCall(60, () => this.boss.clearTint());

          this.bossRecoilSmall();
        }
      }
    });
  }

  private bossRecoil() {
    if (this.bossRecoilTween) {
      this.bossRecoilTween.stop();
      this.boss.x = this.bossRestX;
    }
    const recoilDist = 15 + Math.min(this.streak, 8);
    this.bossRecoilTween = this.tweens.add({
      targets: this.boss,
      x: this.bossRestX + recoilDist,
      duration: 60,
      ease: 'Quad.easeOut',
      yoyo: true,
      hold: 30,
      onComplete: () => {
        this.boss.x = this.bossRestX;
        this.bossRecoilTween = undefined;
      }
    });
  }

  private bossRecoilSmall() {
    if (this.bossRecoilTween) {
      this.bossRecoilTween.stop();
      this.boss.x = this.bossRestX;
    }
    this.bossRecoilTween = this.tweens.add({
      targets: this.boss,
      x: this.bossRestX + 8,
      duration: 50,
      ease: 'Quad.easeOut',
      yoyo: true,
      hold: 20,
      onComplete: () => {
        this.boss.x = this.bossRestX;
        this.bossRecoilTween = undefined;
      }
    });
  }

  private bossDodge() {
    if (this.bossRecoilTween) {
      this.bossRecoilTween.stop();
      this.boss.x = this.bossRestX;
    }
    this.bossRecoilTween = this.tweens.add({
      targets: this.boss,
      x: this.bossRestX - 10,
      duration: 100,
      ease: 'Quad.easeOut',
      yoyo: true,
      hold: 40,
      onComplete: () => {
        this.boss.x = this.bossRestX;
        this.bossRecoilTween = undefined;
      }
    });
  }

  private kidCelebrate() {
    if (this.kidCelebTween) {
      this.kidCelebTween.stop();
      this.kid.y = this.kidRestY;
      this.kid.setScale(1.0);
    }
    const jumpY = this.kidRestY - 18 - Math.min(this.streak * 1.5, 12);
    const jumpScale = 1.12 + Math.min(this.streak * 0.01, 0.08);
    this.kidCelebTween = this.tweens.add({
      targets: this.kid,
      y: jumpY,
      scaleX: jumpScale,
      scaleY: jumpScale,
      duration: 100,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.kid.y = this.kidRestY;
        this.kid.setScale(1.0);
        this.kidCelebTween = undefined;
      }
    });
  }

  private kidCelebrateSmall() {
    if (this.kidCelebTween) {
      this.kidCelebTween.stop();
      this.kid.y = this.kidRestY;
      this.kid.setScale(1.0);
    }
    this.kidCelebTween = this.tweens.add({
      targets: this.kid,
      y: this.kidRestY - 9,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 80,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.kid.y = this.kidRestY;
        this.kid.setScale(1.0);
        this.kidCelebTween = undefined;
      }
    });
  }

  private async grade(r: Rating) {
    if (this.winInProgress || this.grading) return;

    this.grading = true;
    try {
      unlockAudio(this);

      if (r === 'easy') {
        this.streak++;
        if (this.streak > this.maxStreak) this.maxStreak = this.streak;
      } else if (r === 'fail') this.streak = 0;
      this.updateStreakDisplay();
      if (r === 'easy') this.checkStreakMilestone();

      this.spray(r);

      if (this.sentenceCard) {
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

    const isTargetWord = this.bossTargets.has(this.currentId);
    this.scheduler.grade(this.currentId, r, isTargetWord);
    debouncedSaveProfile(this.profile);

    if (r === 'fail') {
      playCue(this, 'fail_try_again');
      if (++this.mistakes >= GAME_CONSTANTS.MAX_FAILS_PER_LEVEL) return this.restartLevel();
    }

    if (r === 'hard') {
      playCue(this, 'hit_minor');
    }

    if (r === 'easy') {
      playCue(this, 'hit_success');
      if (isTargetWord && !this.bossCleared.has(this.currentId)) {
        this.bossCleared.add(this.currentId);
        this.bossHP--;
        playCue(this, 'word_mastered');
        this.renderHUD();
        this.hpBarDamageEffect();
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
      playCue(this, 'fail_try_again');
      if (++this.mistakes >= GAME_CONSTANTS.MAX_FAILS_PER_LEVEL) return this.restartLevel();
      this.sentenceCard!.resetCurrent();
      return;
    }

    if (r === 'hard') playCue(this, 'hit_minor');
    if (r === 'easy') playCue(this, 'hit_success');

    const hasMore = this.sentenceCard!.advance();
    if (hasMore) return;

    if (r === 'easy') {
      this.bossHP--;
      this.renderHUD();
      this.hpBarDamageEffect();
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
    playCue(this, 'stinger_level_fail');
    this.add.rectangle(0, 0, 960, 540, 0x000000, 0.55).setOrigin(0);
    this.add.text(480, 270, "Let's try that fire again!", {
      fontSize: '32px', color: '#FFD700', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.time.delayedCall(900, () => this.scene.restart());
  }

  private async win() {
    if (this.winInProgress) return;
    this.winInProgress = true;

    if (this.levelNum === this.profile.unlockedLevel && this.levelNum < GAME_CONSTANTS.TOTAL_LEVELS) {
      this.profile.unlockedLevel++;
    }

    if (!this.profile.clearedLevels.includes(this.levelNum)) {
      this.profile.clearedLevels.push(this.levelNum);
    }

    // Star rating: 3★ = 0 fails, 2★ = 1-3 fails, 1★ = 4+ fails
    const stars = this.mistakes === 0 ? 3 : this.mistakes <= 3 ? 2 : 1;
    const prevStars = this.profile.levelStars[this.levelNum] || 0;
    this.profile.levelStars[this.levelNum] = Math.max(prevStars, stars);

    // Best streak (never decreases)
    const prevBest = this.profile.bestStreak[this.levelNum] || 0;
    const isNewRecord = this.maxStreak > prevBest;
    this.profile.bestStreak[this.levelNum] = Math.max(prevBest, this.maxStreak);

    await flushSaveProfile();
    await saveProfile(this.profile);

    // Stop boss idle animation
    if (this.bossPulseTween) {
      this.bossPulseTween.stop();
      this.bossPulseTween = undefined;
    }

    // Hide gameplay UI (buttons, labels, HP bar, word text)
    for (const obj of this.gameplayUI) {
      if (obj && 'setVisible' in obj) (obj as unknown as { setVisible(v: boolean): void }).setVisible(false);
    }
    this.wordText.setVisible(false);
    this.hpBar.setVisible(false);
    this.hpBarBack.setVisible(false);
    if (this.sentenceCard) this.sentenceCard.setVisible(false);

    // T=0: Impact effects
    this.cameras.main.flash(200, 255, 255, 255);
    this.cameras.main.shake(300, 0.008);

    // Fire explosion at boss position
    const fireColors = [0xff6600, 0xff3300, 0xffcc00, 0xff9900];
    if (this.defeatEmitter) {
      for (const color of fireColors) {
        this.defeatEmitter.setParticleTint(color);
        this.defeatEmitter.emitParticleAt(this.boss.x, this.boss.y, 10);
      }
    }

    // Boss collapse: spin, shrink, fade
    this.tweens.add({
      targets: this.boss,
      scaleX: 0,
      scaleY: 0,
      angle: 360,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeIn'
    });

    // Audio
    duckMusic(this, 3, 320);
    if (getLevelBoss(this.levelNum) === 'dragon') playCue(this, 'stinger_boss_end');
    playCue(this, 'level_clear_fanfare');

    // T=500: Kid victory hop (big)
    this.time.delayedCall(500, () => {
      if (this.kidCelebTween) {
        this.kidCelebTween.stop();
        this.kid.y = this.kidRestY;
        this.kid.setScale(1.0);
      }
      this.kidCelebTween = this.tweens.add({
        targets: this.kid,
        y: this.kidRestY - 30,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 150,
        ease: 'Quad.easeOut',
        yoyo: true,
        onComplete: () => {
          this.kid.y = this.kidRestY;
          this.kid.setScale(1.0);
          this.kidCelebTween = undefined;
        }
      });
    });

    // T=700: First confetti wave
    this.time.delayedCall(700, () => this.emitConfetti());

    // T=800: Kid idle victory bounce loop
    this.time.delayedCall(800, () => {
      this.victoryBounceTween = this.tweens.add({
        targets: this.kid,
        y: this.kidRestY - 10,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 400,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });
    });

    // T=1000: "Level Clear!" text with bounce-in
    this.time.delayedCall(1000, () => {
      const txt = this.add.text(480, 200, 'Level Clear!', {
        fontSize: '54px',
        color: '#00E676',
        fontFamily: 'sans-serif',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5);
      txt.setScale(0);
      this.tweens.add({
        targets: txt,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        ease: 'Bounce.easeOut'
      });
    });

    // T=1400: Star rating display
    this.time.delayedCall(1400, () => {
      for (let s = 0; s < 3; s++) {
        const starX = 480 + (s - 1) * 50;
        const filled = s < stars;
        const star = this.add.text(starX, 250, filled ? '\u2605' : '\u2606', {
          fontSize: '42px',
          color: filled ? '#FFD700' : '#666666',
          fontFamily: 'sans-serif',
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setScale(0);

        this.time.delayedCall(s * 200, () => {
          this.tweens.add({
            targets: star,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Bounce.easeOut'
          });
        });
      }
    });

    // T=1800: New Record popup (if applicable)
    if (isNewRecord && this.maxStreak > 0) {
      this.time.delayedCall(1800, () => {
        this.emitConfetti();
        const rec = this.add.text(480, 300, `New Record! x${this.maxStreak}`, {
          fontSize: '28px',
          color: '#FF8C00',
          fontFamily: 'sans-serif',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5).setScale(0);

        this.tweens.add({
          targets: rec,
          scaleX: 1,
          scaleY: 1,
          duration: 350,
          ease: 'Bounce.easeOut'
        });
      });
    } else {
      this.time.delayedCall(1800, () => this.emitConfetti());
    }

    // T=2500: Gear unlock text fades in + reward sound
    this.time.delayedCall(2500, () => {
      playCue(this, 'unlock_reward');
      const gearLabel = GEAR_TEXT[this.levelNum] ? GEAR_TEXT[this.levelNum] : 'Great job!';
      const gear = this.add.text(480, 340, gearLabel, {
        fontSize: '24px',
        color: '#FFD700',
        fontFamily: 'sans-serif',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      gear.setAlpha(0);
      gear.setScale(0.6);
      this.tweens.add({
        targets: gear,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 400,
        ease: 'Back.easeOut'
      });
    });

    // T=3500: "Back to menu" button fades in
    this.time.delayedCall(3500, () => {
      const back = this.add.text(480, 420, 'Back to menu', {
        fontSize: '34px',
        color: '#FFFFFF',
        backgroundColor: '#222',
        fontFamily: 'sans-serif',
        padding: { left: 18, right: 18, top: 8, bottom: 8 }
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      back.setAlpha(0);
      this.tweens.add({
        targets: back,
        alpha: 1,
        duration: 300,
        ease: 'Linear'
      });

      back.on('pointerdown', () => back.setScale(0.92));
      back.on('pointerup', () => {
        playCue(this, 'ui_back');
        this.winInProgress = false;
        this.registry.set('lastLevelCleared', this.levelNum);
        this.scene.start('Menu');
      });
      back.on('pointerout', () => back.setScale(1));
    });
  }

  private emitConfetti() {
    if (!this.confettiEmitter) return;
    const colors = [0x00E676, 0xFFD700, 0x66ccff, 0xffffff];
    for (const color of colors) {
      this.confettiEmitter.setParticleTint(color);
      this.confettiEmitter.emitParticleAt(100 + Math.random() * 760, 20, 8);
    }
  }

  private updateStreakDisplay() {
    if (this.streak <= 0) {
      this.streakText.setVisible(false);
      return;
    }

    this.streakText.setVisible(true);
    this.streakText.setText(`x${this.streak}`);

    // Color tiers
    let color: string;
    if (this.streak >= 7) color = '#FF4500';
    else if (this.streak >= 5) color = '#FF8C00';
    else if (this.streak >= 3) color = '#FFD700';
    else color = '#FFFFFF';
    this.streakText.setColor(color);

    // Font size tiers
    const fontSize = this.streak >= 10 ? 40 : this.streak >= 5 ? 34 : 28;
    this.streakText.setFontSize(fontSize);

    // Pulse tween
    this.tweens.add({
      targets: this.streakText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 75,
      ease: 'Quad.easeOut',
      yoyo: true,
      onComplete: () => {
        this.streakText.setScale(1);
      }
    });
  }

  private checkStreakMilestone() {
    let text: string | null = null;
    let color = '#FFD700';
    let size = 36;
    let confetti = false;
    let flash = false;

    if (this.streak === 3) {
      text = 'Nice!';
      color = '#FFD700';
      size = 36;
    } else if (this.streak === 5) {
      text = 'Great!';
      color = '#FF8C00';
      size = 42;
      confetti = true;
    } else if (this.streak === 7) {
      text = 'Amazing!';
      color = '#FF00AA';
      size = 48;
      flash = true;
    } else if (this.streak >= 10 && this.streak % 5 === 0) {
      text = 'SUPER!';
      color = '#00E676';
      size = 54;
      confetti = true;
      flash = true;
    }

    if (!text) return;

    if (confetti) this.emitConfetti();
    if (flash) this.cameras.main.flash(100, 255, 255, 255);

    const popup = this.add.text(480, 180, text, {
      fontFamily: 'sans-serif',
      fontSize: `${size}px`,
      color,
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5).setScale(0);

    // Bounce in
    this.tweens.add({
      targets: popup,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Hold 400ms, then float up + fade out
        this.time.delayedCall(400, () => {
          this.tweens.add({
            targets: popup,
            y: popup.y - 60,
            alpha: 0,
            duration: 400,
            ease: 'Quad.easeIn',
            onComplete: () => popup.destroy()
          });
        });
      }
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
  return token.toLowerCase().replace(/[^a-z]/g, '');
}
