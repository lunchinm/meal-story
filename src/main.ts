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


/** 文本框右下角的图标工具条：回退、回想、自动、快进、设置（Ren'Py 惯例位置） */
const ICONS: Record<string, string> = {
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6 4 11l5 5" /><path d="M4 11h9a6 6 0 0 1 0 12h-2" /></svg>',
  log: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>',
  auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5l11 7-11 7z" /></svg>',
  skip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l8 7-8 7z" /><path d="M14 5l8 7-8 7z" /></svg>',
  config:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></svg>',
};

function mountHud(): void {
  if (document.querySelector('.quickmenu')) return;
  const bar = document.createElement('div');
  bar.className = 'quickmenu';

  const make = (key: string, label: string, onClick: () => void) => {
    const btn = document.createElement('button');
    btn.className = `qm-btn qm-${key}`;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = ICONS[key];
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick();
    });
    bar.append(btn);
    return btn;
  };

  const back = make('back', '回退一句', () => {
    if (!runner.back()) stage.toast('已经是最前面了');
  });
  const log = make('log', '回想（L）', () => stage.openBacklog());
  const auto = make('auto', '自动播放（A）', () => stage.toggleAuto());
  const skip = make('skip', '快进已读（S）', () => stage.toggleSkip());
  make('config', '设置', () => stage.openSettings());

  const stageEl = document.querySelector('.stage');
  (stageEl ?? document.body).append(bar);

  stage.onAutoSkipChange = (isAuto, isSkip) => {
    auto.classList.toggle('on', isAuto);
    skip.classList.toggle('on', isSkip);
  };
  void back;
  void log;
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
