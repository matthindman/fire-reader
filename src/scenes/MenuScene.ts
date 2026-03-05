import Phaser from 'phaser';
import { loadProfile, isStorageAvailable } from '../storage';
import { playCue, requestMenuMusic, unlockAudio } from '../audio';
import { LEVELS } from '../data/levels';
import { LEVEL_VISUALS, getLevelBg, getLevelBoss } from '../visuals';
import { atlasFrame, hasAtlasFrame } from '../atlasUtil';
import { getBossIdlePair } from '../anims';
import { GAME_CONSTANTS } from '../constants';

// Grid layout constants
const CARD_W = 144;
const CARD_H = 120;
const GAP = 14;
const COLS = 5;
const GRID_LEFT = (960 - (COLS * CARD_W + (COLS - 1) * GAP)) / 2;

const TITLE_Y = 40;
const KID_X = 130;
const KID_Y = 44;
const KID_SCALE = 0.45;
const GRID_TOP = 110;

// Scrolling
const VISIBLE_HEIGHT = 400; // visible grid area height
const SCROLL_BOTTOM = GRID_TOP + VISIBLE_HEIGHT;

export default class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  private cards: Phaser.GameObjects.Container[] = [];
  private inputLocked = false;
  private emberEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private titleFloatTween?: Phaser.Tweens.Tween;
  private kidFloatTween?: Phaser.Tweens.Tween;
  private bossTweens: Phaser.Tweens.Tween[] = [];
  private gridContainer?: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScrollY = 0;
  private dragging = false;
  private dragStartY = 0;
  private dragStartScrollY = 0;

  create() {
    this.cards = [];
    this.inputLocked = false;
    this.bossTweens = [];
    this.scrollY = 0;

    const unlockAudioNow = () => unlockAudio(this);
    requestMenuMusic(this);

    this.input.once('pointerdown', unlockAudioNow);
    if (this.input.keyboard) this.input.keyboard.once('keydown', unlockAudioNow);

    const touchUnlock = () => unlockAudioNow();
    this.game.canvas.addEventListener('touchstart', touchUnlock, { once: true, passive: true });
    this.scene.launch('VolumeOverlay');

    this.events.once('shutdown', () => {
      this.scene.stop('VolumeOverlay');
      this.game.canvas.removeEventListener('touchstart', touchUnlock);
      this.cleanupTweens();
    });

    const loading = this.add.text(480, 270, 'Loading...', { fontSize: '22px', color: '#AAAAAA' }).setOrigin(0.5);
    void this.buildMenu(loading);
  }

  private async buildMenu(loadingText: Phaser.GameObjects.Text) {
    const profile = await loadProfile();
    loadingText.destroy();

    // Background embers
    this.setupEmbers();

    // Title
    const title = this.add.text(480, TITLE_Y, 'FIRE-READER', {
      fontSize: '46px',
      color: '#FFD700',
      fontFamily: 'sans-serif',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    title.setScale(0);

    // Kid sprite
    const kid = this.add.sprite(KID_X, KID_Y, 'atlas', atlasFrame('kid_idle_0')).play('kid_idle');
    kid.setScale(0);
    kid.setOrigin(0.5);

    // Create scrollable grid container
    this.gridContainer = this.add.container(0, 0);

    // Create level cards inside grid container
    const clearedSet = new Set(profile.clearedLevels || []);
    const stars = profile.levelStars || {};
    const streaks = profile.bestStreak || {};
    this.cards = [];
    for (let i = 1; i <= GAME_CONSTANTS.TOTAL_LEVELS; i++) {
      const unlocked = i <= profile.unlockedLevel;
      const cleared = clearedSet.has(i);
      const card = this.createCard(i, unlocked, cleared, stars[i] || 0, streaks[i] || 0);
      card.setScale(0);
      this.cards.push(card);
      this.gridContainer.add(card);
    }

    // Calculate max scroll
    const totalRows = Math.ceil(GAME_CONSTANTS.TOTAL_LEVELS / COLS);
    const totalHeight = totalRows * (CARD_H + GAP) - GAP;
    this.maxScrollY = Math.max(0, totalHeight - VISIBLE_HEIGHT);

    // Scroll mask
    const maskShape = this.make.graphics({ x: 0, y: 0 });
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(0, GRID_TOP, 960, VISIBLE_HEIGHT);
    const mask = maskShape.createGeometryMask();
    this.gridContainer.setMask(mask);

    // Scroll input handling
    this.setupScrolling();

    // Settings button (hidden initially)
    const settings = this.add.text(880, 505, 'Settings', {
      fontSize: '18px',
      color: '#FFFFFF',
      fontFamily: 'sans-serif'
    }).setInteractive({ useHandCursor: true });
    settings.setAlpha(0);

    settings.on('pointerup', () => {
      playCue(this, 'ui_click');
      if (!this.scene.isActive('Settings')) this.scene.launch('Settings');
    });

    // Storage warning
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

    // Entrance animations
    this.entranceAnimations(title, kid, settings);

    // Check for win celebration (returning from a level clear)
    const lastCleared = this.registry.get('lastLevelCleared') as number | undefined;
    if (typeof lastCleared === 'number') {
      this.registry.remove('lastLevelCleared');
      if (lastCleared < GAME_CONSTANTS.TOTAL_LEVELS) {
        const entranceDuration = 500 + Math.min(this.cards.length, 20) * 60 + 350;
        this.time.delayedCall(entranceDuration + 200, () => {
          this.celebrateUnlock(lastCleared);
        });
      }
    }
  }

  private getCardPos(i: number): { x: number; y: number } {
    const idx = i - 1;
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = GRID_LEFT + col * (CARD_W + GAP) + CARD_W / 2;
    const y = GRID_TOP + row * (CARD_H + GAP) + CARD_H / 2;
    return { x, y };
  }

  private createCard(i: number, unlocked: boolean, cleared = false, starCount = 0, bestStreak = 0): Phaser.GameObjects.Container {
    const pos = this.getCardPos(i);
    const container = this.add.container(pos.x, pos.y);

    // 1. Border rectangle (gold if cleared, green if unlocked, gray if locked)
    const borderColor = cleared ? 0xFFD700 : unlocked ? 0x00E676 : 0x555555;
    const border = this.add.rectangle(0, 0, CARD_W, CARD_H, borderColor);
    container.add(border);

    // 2. Background image thumbnail
    const bgKey = getLevelBg(i);
    const hasBg = this.textures.exists(bgKey);
    if (hasBg) {
      const bg = this.add.image(0, 0, bgKey);
      bg.setDisplaySize(CARD_W - 6, CARD_H - 6);
      container.add(bg);
    } else {
      // Dark placeholder for missing art
      const placeholder = this.add.rectangle(0, 0, CARD_W - 6, CARD_H - 6, 0x1a1a1a);
      container.add(placeholder);
      const questionMark = this.add.text(0, -8, '?', {
        fontSize: '32px', color: '#555555', fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      container.add(questionMark);
    }

    // 3. Boss sprite (only if has atlas frames)
    const bossAnimKey = getLevelBoss(i);
    const isDragon = bossAnimKey === 'dragon';
    const [startIdx] = getBossIdlePair(bossAnimKey);
    const bossFrame = isDragon ? `${bossAnimKey}_0` : `${bossAnimKey}_${startIdx}`;
    if (hasAtlasFrame(bossFrame)) {
      const bossSprite = this.add.sprite(0, -8, 'atlas', atlasFrame(bossFrame));
      bossSprite.setScale(0.4);
      if (this.anims.exists(bossAnimKey)) bossSprite.play(bossAnimKey);
      container.add(bossSprite);

      // Boss pulse animation on unlocked cards
      if (unlocked) {
        const bossTween = this.tweens.add({
          targets: bossSprite,
          scaleX: 0.43,
          scaleY: 0.43,
          duration: 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        this.bossTweens.push(bossTween);
      }
    }

    // 4. Level number (top-left)
    const numText = this.add.text(-CARD_W / 2 + 6, -CARD_H / 2 + 4, `${i}`, {
      fontSize: '22px',
      color: '#FFFFFF',
      fontFamily: 'sans-serif',
      stroke: '#000000',
      strokeThickness: 3
    });
    container.add(numText);

    // 5. Title text (bottom center)
    const levelTitle = LEVELS[i]?.title || `Level ${i}`;
    const titleText = this.add.text(0, CARD_H / 2 - 14, levelTitle, {
      fontSize: '10px',
      color: '#FFFFFF',
      fontFamily: 'sans-serif',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    container.add(titleText);

    // 6. Stars + streak (bottom area, above title)
    if (starCount > 0) {
      const starStr = '\u2605'.repeat(starCount) + '\u2606'.repeat(3 - starCount);
      const starsText = this.add.text(0, CARD_H / 2 - 26, starStr, {
        fontSize: '12px',
        color: '#FFD700',
        fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      container.add(starsText);
    }
    if (bestStreak > 0) {
      const streakLabel = this.add.text(CARD_W / 2 - 8, -CARD_H / 2 + 4, `x${bestStreak}`, {
        fontSize: '13px',
        color: '#FF8C00',
        fontFamily: 'sans-serif',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(1, 0);
      container.add(streakLabel);
    }

    if (!unlocked) {
      // 7. Dark overlay + lock icon
      const overlay = this.add.rectangle(0, 0, CARD_W - 6, CARD_H - 6, 0x000000, 0.55);
      container.add(overlay);

      const lockIcon = this.add.text(0, -4, '\u{1F512}', {
        fontSize: '28px'
      }).setOrigin(0.5);
      container.add(lockIcon);
    } else {
      // 7. Interactive with hover/click handlers
      container.setInteractive(
        new Phaser.Geom.Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H),
        Phaser.Geom.Rectangle.Contains
      );
      if (container.input) container.input.cursor = 'pointer';

      const hoverColor = cleared ? 0xFFE44D : 0x33FF99;
      const restColor = cleared ? 0xFFD700 : 0x00E676;

      container.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 150,
          ease: 'Quad.easeOut'
        });
        border.setFillStyle(hoverColor);
      });

      container.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Quad.easeOut'
        });
        border.setFillStyle(restColor);
      });

      container.on('pointerdown', () => {
        if (this.inputLocked) return;
        container.setScale(0.95);
      });

      container.on('pointerup', () => {
        if (this.inputLocked) return;
        container.setScale(1);
        playCue(this, 'ui_confirm');
        this.inputLocked = true;
        this.scene.start('Lesson', { levelNum: i });
      });
    }

    return container;
  }

  private setupScrolling() {
    if (this.maxScrollY <= 0) return;

    // Mouse wheel
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _dx: number, dy: number) => {
      this.scrollY = Phaser.Math.Clamp(this.scrollY + dy * 0.5, 0, this.maxScrollY);
      this.applyScroll();
    });

    // Touch/mouse drag
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y >= GRID_TOP && pointer.y <= SCROLL_BOTTOM) {
        this.dragging = true;
        this.dragStartY = pointer.y;
        this.dragStartScrollY = this.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      const dy = this.dragStartY - pointer.y;
      this.scrollY = Phaser.Math.Clamp(this.dragStartScrollY + dy, 0, this.maxScrollY);
      this.applyScroll();
    });

    this.input.on('pointerup', () => {
      this.dragging = false;
    });
  }

  private applyScroll() {
    if (this.gridContainer) {
      this.gridContainer.setY(-this.scrollY);
    }
  }

  private entranceAnimations(title: Phaser.GameObjects.Text, kid: Phaser.GameObjects.Sprite, settings: Phaser.GameObjects.Text) {
    // Title bounce-in
    this.tweens.add({
      targets: title,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        this.titleFloatTween = this.tweens.add({
          targets: title,
          y: TITLE_Y - 3,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // Kid pop-in
    this.time.delayedCall(200, () => {
      this.tweens.add({
        targets: kid,
        scaleX: KID_SCALE,
        scaleY: KID_SCALE,
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.kidFloatTween = this.tweens.add({
            targets: kid,
            y: KID_Y - 3,
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });
    });

    // Staggered card entrance (only first ~20 visible cards)
    const visibleCards = Math.min(this.cards.length, 20);
    for (let c = 0; c < this.cards.length; c++) {
      const delay = 500 + Math.min(c, visibleCards) * 60;
      this.time.delayedCall(delay, () => {
        this.tweens.add({
          targets: this.cards[c],
          scaleX: 1,
          scaleY: 1,
          duration: 350,
          ease: 'Back.easeOut'
        });
      });
    }

    // Settings fade-in after cards finish entering
    const settingsDelay = 500 + visibleCards * 60 + 350 + 100;
    this.time.delayedCall(settingsDelay, () => {
      this.tweens.add({
        targets: settings,
        alpha: 1,
        duration: 300,
        ease: 'Linear'
      });
    });
  }

  private setupEmbers() {
    this.emberEmitter = this.add.particles(0, 0, 'particle_dot', {
      x: { min: 50, max: 910 },
      y: 560,
      speedY: { min: -40, max: -80 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      tint: 0xff6600,
      lifespan: { min: 3000, max: 5000 },
      frequency: 250,
      gravityY: -10
    });
  }

  private celebrateUnlock(levelCleared: number) {
    const cardIdx = levelCleared; // 0-indexed: cards[3] = level 4
    if (cardIdx >= this.cards.length) return;

    const card = this.cards[cardIdx];

    // Scroll to make the newly unlocked card visible
    const cardPos = this.getCardPos(levelCleared + 1);
    const cardScreenY = cardPos.y - this.scrollY;
    if (cardScreenY > SCROLL_BOTTOM - CARD_H || cardScreenY < GRID_TOP) {
      this.scrollY = Phaser.Math.Clamp(cardPos.y - GRID_TOP - CARD_H, 0, this.maxScrollY);
      this.applyScroll();
    }

    // Camera flash
    this.cameras.main.flash(200, 255, 255, 255);

    // Scale pop 1.3 -> 1.0
    card.setScale(1.3);
    this.tweens.add({
      targets: card,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Bounce.easeOut'
    });

    // Confetti burst
    const confetti = this.add.particles(0, 0, 'particle_dot', {
      speed: { min: 60, max: 200 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 1200,
      gravityY: 80,
      emitting: false
    });

    const colors = [0x00E676, 0xFFD700, 0x66ccff, 0xff66aa];
    const worldX = card.x;
    const worldY = card.y - this.scrollY;
    for (const color of colors) {
      confetti.setParticleTint(color);
      confetti.emitParticleAt(worldX, worldY, 8);
    }

    playCue(this, 'unlock_reward');

    this.time.delayedCall(1500, () => confetti.destroy());
  }

  private cleanupTweens() {
    if (this.titleFloatTween) {
      this.titleFloatTween.stop();
      this.titleFloatTween = undefined;
    }
    if (this.kidFloatTween) {
      this.kidFloatTween.stop();
      this.kidFloatTween = undefined;
    }
    for (const t of this.bossTweens) {
      t.stop();
    }
    this.bossTweens = [];
    if (this.emberEmitter) {
      this.emberEmitter.destroy();
      this.emberEmitter = undefined;
    }
  }
}
