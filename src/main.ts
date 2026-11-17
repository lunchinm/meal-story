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
// 结局相册要列出全部结局标题
(window as unknown as { __endings: unknown }).__endings = (['act1', 'act2', 'act3', 'act4'] as const)
  .flatMap((key) => content.acts[key])
  .filter((node) => node.type === 'ending')
  .map((node) => ({ id: node.id, title: (node as { title: string }).title }));

const stage = new Stage(host);
const runner = new Runner(content, stage, () => restart());

function hasSave(): boolean {
  const data = state.load();
  return Boolean(data?.nodeId);
}

/** 离开标题页时把预览入口收掉，避免挡住游戏画面 */
function hidePreview(): void {
  document.getElementById('preview-entry')?.remove();
  document.querySelector('.preview-panel')?.remove();
}

function showTitle(): void {
  stage.title(
    hasSave(),
    () => {
      hidePreview();
      state.reset();
      runner.start();
    },
    () => {
      hidePreview();
      const data = state.load();
      state.restore();
      runner.start(data?.nodeId);
    },
  );
  mountMuteButton();
  mountHud();
  mountPreview();
}

function restart(): void {
  state.reset();
  showTitle();
}


/** 右上角工具条：自动、快进、回想、设置 */
function mountHud(): void {
  if (document.querySelector('.hud')) return;
  const hud = document.createElement('div');
  hud.className = 'hud';

  const auto = document.createElement('button');
  auto.className = 'hud-btn hud-auto';
  auto.textContent = '自动';
  auto.title = '自动播放（A）';
  auto.addEventListener('click', (event) => {
    event.stopPropagation();
    stage.toggleAuto();
  });

  const skip = document.createElement('button');
  skip.className = 'hud-btn hud-skip';
  skip.textContent = '快进';
  skip.title = '快进已读（S）';
  skip.addEventListener('click', (event) => {
    event.stopPropagation();
    stage.toggleSkip();
  });

  const log = document.createElement('button');
  log.className = 'hud-btn hud-log';
  log.textContent = '回想';
  log.title = '回看对白（L）';
  log.addEventListener('click', (event) => {
    event.stopPropagation();
    stage.openBacklog();
  });

  const config = document.createElement('button');
  config.className = 'hud-btn hud-config';
  config.textContent = '设置';
  config.title = '音量与节奏';
  config.addEventListener('click', (event) => {
    event.stopPropagation();
    stage.openSettings();
  });

  hud.append(auto, skip, log, config);
  document.body.append(hud);

  stage.onAutoSkipChange = (isAuto, isSkip) => {
    auto.classList.toggle('on', isAuto);
    skip.classList.toggle('on', isSkip);
    auto.textContent = isAuto ? '自动 ·开' : '自动';
    skip.textContent = isSkip ? '快进 ·开' : '快进';
  };
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


// A 自动 / S 快进 / L 回想 / Esc 关闭面板 / 右键隐藏界面
window.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement | null;
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
  const key = event.key.toLowerCase();
  if (key === 'a') {
    stage.toggleAuto();
  } else if (key === 's') {
    stage.toggleSkip();
  } else if (key === 'l') {
    stage.openBacklog();
  } else if (event.key === 'Escape') {
    document.querySelectorAll('.overlay.on').forEach((node) => {
      (node as HTMLElement).innerHTML = '';
      node.classList.remove('on');
    });
    document.querySelector('.ui-hidden')?.classList.remove('ui-hidden');
  }
});

window.addEventListener('contextmenu', (event) => {
  if (!document.querySelector('.stage')) return;
  event.preventDefault();
  stage.toggleUiHidden();
});

// 调试用：地址后面加 ?node=a2-02 直接从某一幕开机
const jumpTo = new URLSearchParams(location.search).get('node');
if (jumpTo) {
  runner.start(jumpTo);
  mountMuteButton();
  mountHud();
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

/** 预览入口：列出章节、关卡与结局，点了直接跳过去 */
function mountPreview(): void {
  const existing = document.getElementById('preview-entry');
  existing?.remove();

  const entry = document.createElement('button');
  entry.id = 'preview-entry';
  entry.className = 'preview-entry';
  entry.textContent = '预览';

  const panel = document.createElement('div');
  panel.className = 'preview-panel';
  panel.hidden = true;

  const title = document.createElement('div');
  title.className = 'preview-title';
  title.textContent = '跳到哪一段';
  panel.append(title);

  const labelOf = (node: AnyNodeLike): string => {
    if (node.type === 'chapter') return node.title ?? node.id;
    if (node.type === 'ending') return `结局：${node.title ?? node.id}`;
    if (node.type === 'plate') return '配餐关';
    if (node.type === 'evidence') return '证据关';
    if (node.type === 'compare') return '对比关';
    if (node.type === 'review') return '记录关';
    return node.id;
  };

  const groups: Array<[string, AnyNodeLike[]]> = [
    ['章节', []],
    ['关卡', []],
    ['结局', []],
  ];
  for (const [name, nodes] of Object.entries(content.acts)) {
    void name;
    for (const node of nodes as AnyNodeLike[]) {
      if (node.type === 'chapter' || node.type === 'ending') groups[0][1].push(node);
      else if (['plate', 'evidence', 'compare', 'review'].includes(node.type)) groups[1][1].push(node);
    }
  }
  groups[0][1].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  groups[1][1].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  groups[2][1] = groups[0][1].filter((n) => n.type === 'ending');
  groups[0][1] = groups[0][1].filter((n) => n.type === 'chapter');

  for (const [title2, nodes] of groups) {
    if (nodes.length === 0) continue;
    const section = document.createElement('div');
    section.className = 'preview-group';
    section.append(Object.assign(document.createElement('div'), { className: 'preview-group-title', textContent: title2 }));
    for (const node of nodes) {
      const btn = document.createElement('button');
      btn.className = 'preview-item';
      btn.textContent = labelOf(node);
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        panel.hidden = true;
        hidePreview();
        state.reset();
        runner.start(node.id);
      });
      section.append(btn);
    }
    panel.append(section);
  }

  const close = document.createElement('button');
  close.className = 'preview-close';
  close.textContent = '收起';
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') panel.hidden = true;
  });
  close.addEventListener('click', (event) => {
    event.stopPropagation();
    panel.hidden = true;
  });
  panel.append(close);

  entry.addEventListener('click', (event) => {
    event.stopPropagation();
    panel.hidden = !panel.hidden;
  });

  host!.append(entry, panel);
}

type AnyNodeLike = { id: string; type: string; title?: string };
