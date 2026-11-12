import './ui/styles.css';
import { loadContent } from './engine/loader';
import { Runner } from './engine/runner';
import { Stage } from './ui/stage';
import { state } from './state';

const host = document.getElementById('app');
if (!host) {
  throw new Error('缺少 #app 容器');
}

const content = loadContent();
const stage = new Stage(host);
const runner = new Runner(content, stage, () => restart());

function hasSave(): boolean {
  const data = state.load();
  return Boolean(data?.nodeId);
}

function showTitle(): void {
  stage.title(
    hasSave(),
    () => {
      state.reset();
      runner.start();
    },
    () => {
      const data = state.load();
      state.restore();
      runner.start(data?.nodeId);
    },
  );
}

function restart(): void {
  state.reset();
  showTitle();
}

// 调试用：地址后面加 ?node=a2-02 直接从某一幕开机，跳着改画面用
const jumpTo = new URLSearchParams(location.search).get('node');
if (jumpTo) {
  runner.start(jumpTo);
} else {
  showTitle();
}
window.addEventListener('keydown', (event) => {
  if (event.key !== ' ' && event.key !== 'Enter') return;
  const target = document.activeElement as HTMLElement | null;
  if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT')) return;
  const dialog = document.querySelector('.dialog');
  if (dialog) {
    event.preventDefault();
    (dialog as HTMLElement).click();
  }
});
