import Phaser from 'phaser';
import { loadProfile } from '../storage';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default class ParentDashboard extends Phaser.Scene {
  private domElement?: Phaser.GameObjects.DOMElement;
  private escHandler?: () => void;

  constructor() { super('ParentDashboard'); }

  create() {
    void this.initAsync();
  }

  private async initAsync() {
    const { words } = await loadProfile();

    const rows = Object.entries(words).map(([word, st]) => ({
      word,
      interval: (st.interval ? st.interval : 0).toFixed(1),
      ease: (st.ease ? st.ease : 1.3).toFixed(2),
      successes: st.successes ? st.successes : 0
    })).sort((a, b) => b.successes - a.successes);

    const csv = ['word,interval_hours,ease,successes']
      .concat(rows.map(r => `${r.word},${r.interval},${r.ease},${r.successes}`))
      .join('\n');

    const html = `
      <style>
        .panel{width:520px;background:#111;color:#fff;border:1px solid #444;padding:10px;font-family:sans-serif}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #333;padding:4px 6px}
        th{background:#222}
        tbody tr:nth-child(even){background:#181818}
        .wrap{max-height:260px;overflow:auto;margin-top:8px}
        button{margin-top:10px;margin-right:8px}
      </style>
      <div class="panel">
        <div><b>Word mastery (local only)</b></div>
        <div class="wrap">
          <table>
            <thead><tr><th>Word</th><th>Interval (h)</th><th>Ease</th><th>OK</th></tr></thead>
            <tbody>
              ${rows.map(r => `<tr>
                <td>${escapeHtml(r.word)}</td><td>${r.interval}</td><td>${r.ease}</td><td>${r.successes}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <button id="copy">Copy CSV</button>
        <button id="close">Close</button>
      </div>
    `;

    this.domElement = this.add.dom(480, 270).createFromHTML(html);
    this.domElement.addListener('click');

    this.domElement.on('click', (e: any) => {
      const t = e.target as HTMLElement;
      if (t.id === 'close') this.scene.stop();
      if (t.id === 'copy' && navigator.clipboard) navigator.clipboard.writeText(csv);
    });

    this.escHandler = () => this.scene.stop();
    if (this.input.keyboard) this.input.keyboard.on('keydown-ESC', this.escHandler);

    this.events.once('shutdown', () => {
      if (this.escHandler && this.input.keyboard) this.input.keyboard.off('keydown-ESC', this.escHandler);
      if (this.domElement) this.domElement.destroy();
      this.domElement = undefined;
    });
  }
}
