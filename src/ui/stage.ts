import type { ChoiceNode, EndingNode, SayNode } from '../engine/types';

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * 所有画面都在这里落 DOM。
 * 剧情只给数据，stage 只负责画和收点击。
 */
export class Stage {
  readonly root: HTMLDivElement;
  private readonly bgLayer: HTMLDivElement;
  private readonly actorsLayer: HTMLDivElement;
  private readonly uiLayer: HTMLDivElement;
  private readonly overlayLayer: HTMLDivElement;
  private readonly toastLayer: HTMLDivElement;
  private advanceHandler: ((e: MouseEvent) => void) | null = null;

  constructor(host: HTMLElement) {
    this.root = h('div', 'stage');
    this.bgLayer = h('div', 'layer bg');

    const noise = h('div', 'layer grain');
    const frame = h('div', 'layer frame');

    this.actorsLayer = h('div', 'layer actors');
    this.uiLayer = h('div', 'layer ui');
    this.overlayLayer = h('div', 'layer overlay');
    this.toastLayer = h('div', 'layer toast');

    this.root.append(this.bgLayer, noise, frame, this.actorsLayer, this.uiLayer, this.overlayLayer, this.toastLayer);
    host.append(this.root);
  }

  setScene(scene: 'class' | 'canteen' | 'store' | 'chat'): void {
    this.bgLayer.dataset.scene = scene;
  }

  /* ---------- 标题页 ---------- */

  title(hasSave: boolean, onStart: () => void, onContinue: () => void): void {
    this.clearAll();
    this.setScene('chat');
    const panel = h('div', 'title-screen');
    panel.append(
      h('div', 'title-kicker', '“合理膳食 · 免疫基石”创意宣传大赛'),
      h('div', 'title-name', '今天吃什么？'),
      h('div', 'title-sub', '校园膳食调查簿'),
      h('div', 'title-meta', '8—12 分钟 ｜ 对话 + 配餐 + 看标签'),
    );

    const actions = h('div', 'title-actions');
    const start = h('button', 'btn btn-primary', hasSave ? '重新开始' : '开始调查');
    start.addEventListener('click', onStart);
    actions.append(start);
    if (hasSave) {
      const cont = h('button', 'btn', '继续上次');
      cont.addEventListener('click', onContinue);
      actions.append(cont);
    }

    panel.append(actions);
    this.uiLayer.append(panel);
  }

  /* ---------- 对话 ---------- */

  say(node: SayNode, onNext: () => void): void {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    this.overlayLayer.innerHTML = '';

    const box = h('div', 'dialog');
    if (node.speaker) box.append(h('div', 'speaker', node.speaker));
    box.append(h('div', 'text', node.text));
    const tip = h('div', 'next-tip', '点击继续 ▸');
    box.append(tip);

    box.classList.add('enter');
    this.uiLayer.append(box);

    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      this.detachAdvance();
      this.uiLayer.innerHTML = '';
      onNext();
    };
    this.advanceHandler = handler;
    this.root.addEventListener('click', handler);
  }

  private detachAdvance(): void {
    if (this.advanceHandler) {
      this.root.removeEventListener('click', this.advanceHandler);
      this.advanceHandler = null;
    }
  }

  /* ---------- 选项 ---------- */

  choices(node: ChoiceNode, onPick: (index: number) => void): void {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    const wrap = h('div', 'choice-panel');
    if (node.question) wrap.append(h('div', 'choice-question', node.question));
    const list = h('div', 'choice-list');
    node.options.forEach((opt, i) => {
      const btn = h('button', 'choice', opt.text);
      btn.addEventListener('click', () => onPick(i));
      list.append(btn);
    });
    wrap.append(list);
    this.uiLayer.append(wrap);
  }

  /* ---------- 结局 ---------- */

  ending(node: EndingNode, onRestart: () => void): void {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    this.overlayLayer.innerHTML = '';
    this.setScene('canteen');

    const card = h('div', 'ending-card');
    card.append(h('div', 'ending-tag', '结局'), h('div', 'ending-title', node.title));
    node.body.forEach((line) => card.append(h('p', 'ending-line', line)));
    if (node.action) {
      const action = h('div', 'ending-action');
      action.append(h('span', 'ending-action-label', '明天能做的一件事'), h('span', 'ending-action-text', node.action));
      card.append(action);
    }
    const again = h('button', 'btn', '再走一遍');
    again.addEventListener('click', onRestart);
    card.append(again);
    this.uiLayer.append(card);
  }

  /* ---------- 给互动模块用的画布 ---------- */

  /** 清掉对话层，返回一个干净的全屏面板 */
  board(className: string): HTMLDivElement {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    const board = h('div', `board ${className}`);
    this.uiLayer.append(board);
    return board;
  }

  toast(message: string, ms = 2200): void {
    const el = h('div', 'toast-item', message);
    this.toastLayer.append(el);
    window.setTimeout(() => el.classList.add('out'), ms);
    window.setTimeout(() => el.remove(), ms + 400);
  }

  clearAll(): void {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    this.overlayLayer.innerHTML = '';
    this.toastLayer.innerHTML = '';
  }
}
