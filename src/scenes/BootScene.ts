import Phaser from 'phaser';
import { loadProfile } from '../storage';
import { validateLevels } from '../validate';
import { ensureAnimations } from '../anims';
import { initAtlasFrames, hasAtlasFrame, sampleAtlasFrames } from '../atlasUtil';
import { setPersistedMuteState } from '../audio';
import atlasData from '../../assets/atlas.json';

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

    this.load.atlas(
      'atlas',
      new URL('../../assets/atlas.png', import.meta.url).toString(),
      atlasData as unknown as object
    );

    this.load.image('bg1', new URL('../../assets/backgrounds/bg1_kitchen.png', import.meta.url).toString());
    this.load.image('bg2', new URL('../../assets/backgrounds/bg2_alley.png', import.meta.url).toString());
    this.load.image('bg3', new URL('../../assets/backgrounds/bg3_campsite.png', import.meta.url).toString());
    this.load.image('bg4', new URL('../../assets/backgrounds/bg4_home_stove.png', import.meta.url).toString());
    this.load.image('bg5', new URL('../../assets/backgrounds/bg5_parkinglot.png', import.meta.url).toString());
    this.load.image('bg6', new URL('../../assets/backgrounds/bg6_backyard_bbq.png', import.meta.url).toString());
    this.load.image('bg7', new URL('../../assets/backgrounds/bg7_forest.png', import.meta.url).toString());
    this.load.image('bg8', new URL('../../assets/backgrounds/bg8_warehouse.png', import.meta.url).toString());
    this.load.image('bg9', new URL('../../assets/backgrounds/bg9_office.png', import.meta.url).toString());
    this.load.image('bg10', new URL('../../assets/backgrounds/bg10_castle.png', import.meta.url).toString());

    this.load.audio('bgm', new URL('../../assets/audio/bgm.wav', import.meta.url).toString());
    this.load.audio('spray', new URL('../../assets/audio/spray.wav', import.meta.url).toString());
    this.load.audio('hit', new URL('../../assets/audio/hit.wav', import.meta.url).toString());
    this.load.audio('fail', new URL('../../assets/audio/fail.wav', import.meta.url).toString());
    this.load.audio('victory', new URL('../../assets/audio/victory.wav', import.meta.url).toString());

    this.load.audio('bgm_menu_loop', new URL('../../assets/audio/music/bgm_menu_loop.wav', import.meta.url).toString());
    this.load.audio('bgm_game_loop_a', new URL('../../assets/audio/music/bgm_game_loop_a.wav', import.meta.url).toString());
    this.load.audio('bgm_game_loop_b', new URL('../../assets/audio/music/bgm_game_loop_b.wav', import.meta.url).toString());
    this.load.audio('bgm_game_loop_c', new URL('../../assets/audio/music/bgm_game_loop_c.wav', import.meta.url).toString());
    this.load.audio('stinger_level_clear', new URL('../../assets/audio/music/stinger_level_clear.wav', import.meta.url).toString());
    this.load.audio('stinger_level_fail', new URL('../../assets/audio/music/stinger_level_fail.wav', import.meta.url).toString());
    this.load.audio('stinger_boss_end', new URL('../../assets/audio/music/stinger_boss_end.wav', import.meta.url).toString());

    this.load.audio('ui_click_v01', new URL('../../assets/audio/sfx/ui_click_v01.wav', import.meta.url).toString());
    this.load.audio('ui_confirm_v01', new URL('../../assets/audio/sfx/ui_confirm_v01.wav', import.meta.url).toString());
    this.load.audio('ui_back_v01', new URL('../../assets/audio/sfx/ui_back_v01.wav', import.meta.url).toString());
    this.load.audio('ui_toggle_on_v01', new URL('../../assets/audio/sfx/ui_toggle_on_v01.wav', import.meta.url).toString());
    this.load.audio('ui_toggle_off_v01', new URL('../../assets/audio/sfx/ui_toggle_off_v01.wav', import.meta.url).toString());
    this.load.audio('spray_shot_v01', new URL('../../assets/audio/sfx/spray_shot_v01.wav', import.meta.url).toString());
    this.load.audio('spray_shot_v02', new URL('../../assets/audio/sfx/spray_shot_v02.wav', import.meta.url).toString());
    this.load.audio('hit_success_v01', new URL('../../assets/audio/sfx/hit_success_v01.wav', import.meta.url).toString());
    this.load.audio('hit_success_v02', new URL('../../assets/audio/sfx/hit_success_v02.wav', import.meta.url).toString());
    this.load.audio('hit_minor_v01', new URL('../../assets/audio/sfx/hit_minor_v01.wav', import.meta.url).toString());
    this.load.audio('fail_try_again_v01', new URL('../../assets/audio/sfx/fail_try_again_v01.wav', import.meta.url).toString());
    this.load.audio('fail_try_again_v02', new URL('../../assets/audio/sfx/fail_try_again_v02.wav', import.meta.url).toString());
    this.load.audio('word_mastered_v01', new URL('../../assets/audio/sfx/word_mastered_v01.wav', import.meta.url).toString());
    this.load.audio('unlock_reward_v01', new URL('../../assets/audio/sfx/unlock_reward_v01.wav', import.meta.url).toString());
  }

  create() {
    const loadErrors = this.registry.get('loadErrors') as string[] | undefined;
    if (loadErrors && loadErrors.length) {
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

    if (!this.textures.exists('particle_dot')) {
      const gfx = this.add.graphics();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(8, 8, 8);
      gfx.generateTexture('particle_dot', 16, 16);
      gfx.destroy();
    }

    loadProfile().then(profile => {
      this.sound.mute = profile.muted;
      setPersistedMuteState(profile.muted);
      document.body.classList.toggle('contrast-high', profile.contrastHigh);
    }).finally(() => {
      this.scene.start('Menu');
    });
  }
}
