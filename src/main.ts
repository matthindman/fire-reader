import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import LessonScene from './scenes/LessonScene';
import GameScene from './scenes/GameScene';
import ResultScene from './scenes/ResultScene';
import SettingsModal from './ui/SettingsModal';
import ParentDashboard from './ui/ParentDashboard';

const jsWarning = document.getElementById('js-warning');
if (jsWarning) jsWarning.remove();

function formatReason(reason: unknown): string {
  if (reason instanceof Error) return `${reason.name}: ${reason.message}`;
  if (typeof reason === 'string') return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return String(reason);
  }
}

function showStartupError(reason: unknown): void {
  if (document.getElementById('startup-error')) return;

  const panel = document.createElement('pre');
  panel.id = 'startup-error';
  panel.style.position = 'fixed';
  panel.style.left = '12px';
  panel.style.right = '12px';
  panel.style.top = '12px';
  panel.style.zIndex = '100000';
  panel.style.whiteSpace = 'pre-wrap';
  panel.style.margin = '0 auto';
  panel.style.padding = '12px';
  panel.style.fontFamily = 'monospace';
  panel.style.fontSize = '14px';
  panel.style.lineHeight = '1.4';
  panel.style.color = '#ffcccc';
  panel.style.background = '#2b0000';
  panel.style.border = '1px solid #aa3333';
  panel.textContent = `Startup error:\n${formatReason(reason)}\n\nOpen DevTools Console for full details.`;
  document.body.appendChild(panel);
}

window.addEventListener('error', (evt) => {
  const reason = evt.error ? evt.error : evt.message;
  showStartupError(reason);
});

window.addEventListener('unhandledrejection', (evt) => {
  showStartupError(evt.reason);
});

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

try {
  new Phaser.Game(config);
} catch (err) {
  showStartupError(err);
  throw err;
}
