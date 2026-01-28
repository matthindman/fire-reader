import Phaser from 'phaser';
import { loadProfile } from '../storage';
import { validateLevels } from '../validate';
import { ensureAnimations } from '../anims';
import { initAtlasFrames, hasAtlasFrame, sampleAtlasFrames } from '../atlasUtil';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(w / 2 - 160, h / 2 - 25, 320, 50);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(w / 2, h / 2 - 55, 'Loading...', {
      fontSize: '20px', color: '#ffffff', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    const percentText = this.add.text(w / 2, h / 2, '0%', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    const loadErrors: string[] = [];

    this.load.on('loaderror', (fileObj: Phaser.Loader.File) => {
      console.error(`Failed to load: ${fileObj.key} from ${fileObj.url}`);
      loadErrors.push(fileObj.key);
    });

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00E676, 1);
      progressBar.fillRect(w / 2 - 150, h / 2 - 15, 300 * value, 30);
      percentText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      if (loadErrors.length) this.registry.set('loadErrors', loadErrors);
    });

    const bg = (file: string) => new URL(`../../assets/backgrounds/${file}`, import.meta.url).toString();
    const au = (file: string) => new URL(`../../assets/audio/${file}`, import.meta.url).toString();

    this.load.atlas(
      'atlas',
      new URL('../../assets/atlas.png', import.meta.url).toString(),
      new URL('../../assets/atlas.json', import.meta.url).toString()
    );

    this.load.image('bg1', bg('bg1_kitchen.png'));
    this.load.image('bg2', bg('bg2_alley.png'));
    this.load.image('bg3', bg('bg3_campsite.png'));
    this.load.image('bg4', bg('bg4_home_stove.png'));
    this.load.image('bg5', bg('bg5_parkinglot.png'));
    this.load.image('bg6', bg('bg6_backyard_bbq.png'));
    this.load.image('bg7', bg('bg7_forest.png'));
    this.load.image('bg8', bg('bg8_warehouse.png'));
    this.load.image('bg9', bg('bg9_office.png'));
    this.load.image('bg10', bg('bg10_castle.png'));

    this.load.audio('bgm', [au('bgm.wav')]);
    this.load.audio('spray', au('spray.wav'));
    this.load.audio('hit', au('hit.wav'));
    this.load.audio('fail', au('fail.wav'));
    this.load.audio('victory', au('victory.wav'));
  }

  create() {
    const loadErrors = this.registry.get('loadErrors') as string[] | undefined;
    if (loadErrors?.length) {
      this.add.text(480, 200, 'Warning: Failed to load game assets', {
        fontSize: '28px', color: '#FF4444', fontFamily: 'sans-serif'
      }).setOrigin(0.5);

      this.add.text(480, 270, `Missing: ${loadErrors.join(', ')}`, {
        fontSize: '18px', color: '#AAAAAA', fontFamily: 'sans-serif',
        wordWrap: { width: 700 }, align: 'center'
      }).setOrigin(0.5);

      this.add.text(480, 350, 'Please refresh or check your build/assets.', {
        fontSize: '20px', color: '#FFFFFF', fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      return;
    }

    const levelsOk = validateLevels();
    if (!levelsOk) {
      this.add.text(480, 240, 'Warning: Level data validation failed', {
        fontSize: '26px', color: '#FF4444', align: 'center', fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      this.add.text(480, 310, 'Check console for details.', {
        fontSize: '18px', color: '#FFFFFF', fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      return;
    }

    const tex = this.textures.get('atlas');
    initAtlasFrames(tex);

    const required = ['kid_idle_0', 'water', 'boss_kitchen_0'];
    const missing = required.filter(b => !hasAtlasFrame(b));
    if (missing.length) {
      this.add.text(480, 210, 'Warning: Atlas frames missing', {
        fontSize: '26px', color: '#FF4444', fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      this.add.text(480, 270, `Missing: ${missing.join(', ')}`, {
        fontSize: '18px', color: '#AAAAAA', fontFamily: 'sans-serif',
        wordWrap: { width: 720 }, align: 'center'
      }).setOrigin(0.5);
      this.add.text(480, 350, `Example frames found: ${sampleAtlasFrames(8).join(', ')}`, {
        fontSize: '14px', color: '#AAAAAA', fontFamily: 'sans-serif',
        wordWrap: { width: 820 }, align: 'center'
      }).setOrigin(0.5);
      return;
    }

    try {
      ensureAnimations(this.anims, tex);
    } catch (e) {
      console.error(e);
      this.add.text(480, 270, 'Warning: Failed to create animations.\nCheck atlas naming.', {
        fontSize: '22px', color: '#FF4444', align: 'center', fontFamily: 'sans-serif'
      }).setOrigin(0.5);
      return;
    }

    loadProfile().then(profile => {
      this.sound.mute = profile.muted;
      document.body.classList.toggle('contrast-high', profile.contrastHigh);
    }).finally(() => {
      this.scene.start('Menu');
    });
  }
}
