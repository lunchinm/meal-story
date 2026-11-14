import './ui/styles.css';
import { loadContent } from './engine/loader';
import { Runner } from './engine/runner';
import { Stage } from './ui/stage';
import { state } from './state';
import { toggleMute, isMuted } from './audio';

const host = document.getElementById('app');
if (!host) {
  throw new Error('缺少 #app 容器');
}

const content = loadContent();
// 知识卡给 stage 读，避免把 data 一层层传下去
(window as unknown as { __knowledge: unknown }).__knowledge = content.knowledge;

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
  mountMuteButton();
}

function restart(): void {
  state.reset();
  showTitle();
}

/** 右上角的静音开关，录屏时也用得上 */
function mountMuteButton(): void {
  if (document.querySelector('.mute-btn')) return;
  const btn = document.createElement('button');
  btn.className = 'mute-btn';
  btn.textContent = isMuted() ? '🔇' : '🔊';
  btn.title = '开关声音';
  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const muted = toggleMute();
    btn.textContent = muted ? '🔇' : '🔊';
  });
  document.body.append(btn);
}

// 调试用：地址后面加 ?node=a2-02 直接从某一幕开机
const jumpTo = new URLSearchParams(location.search).get('node');
if (jumpTo) {
  runner.start(jumpTo);
  mountMuteButton();
} else {
  showTitle();
}

// 空格 / 回车 也能推进对话，录屏时手不用一直点
window.addEventListener('keydown', (event) => {
  if (event.key !== ' ' && event.key !== 'Enter') return;
  const target = document.activeElement as HTMLElement | null;
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
  if (target && target.tagName === 'BUTTON' && target.closest('.board')) return;
  const dialog = document.querySelector('.dialog, .phone');
  if (dialog) {
    event.preventDefault();
    (dialog as HTMLElement).click();
  }
});
