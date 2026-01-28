import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import LessonScene from './scenes/LessonScene';
import GameScene from './scenes/GameScene';
import ResultScene from './scenes/ResultScene';
import SettingsModal from './ui/SettingsModal';
import ParentDashboard from './ui/ParentDashboard';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#000000',
  parent: 'game',
  dom: { createContainer: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, MenuScene, LessonScene, GameScene, ResultScene, SettingsModal, ParentDashboard]
};

new Phaser.Game(config);
