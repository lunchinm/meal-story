import type { ChoiceNode, EndingNode, KnowledgeCard, SayNode } from '../engine/types';
import { backgrounds, actors } from '../assets';
import { play, speak, startBgm, stopVoice } from '../audio';
import { icon } from './icons';
import { buildProp, type PropId } from './props';

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
const PROP_LABEL: Record<string, string> = {
  product_front: '看瓶子正面',
  product_back: '翻到背面',
  nutrition: '看营养成分表',
  note: '看便签',
  menu: '看菜牌',
  tray: '看实物',
};

export class Stage {
  private chatSeg = -1;
  private chatLog: { speaker: string; text: string }[] = [];
  readonly root: HTMLDivElement;
  private readonly bgLayer: HTMLDivElement;
  private readonly bgImage: HTMLDivElement;
  private readonly actorsLayer: HTMLDivElement;
  private readonly uiLayer: HTMLDivElement;
  private readonly overlayLayer: HTMLDivElement;
  private readonly toastLayer: HTMLDivElement;
  private advanceHandler: ((e: MouseEvent) => void) | null = null;
  private lastActor = '';

  constructor(host: HTMLElement) {
    this.root = h('div', 'stage');
    this.bgLayer = h('div', 'layer bg');
    this.bgImage = h('div', 'layer bg-image');
    const noise = h('div', 'layer grain');
    const frame = h('div', 'layer frame');

    this.actorsLayer = h('div', 'layer actors');
    this.uiLayer = h('div', 'layer ui');
    this.overlayLayer = h('div', 'layer overlay');
    this.toastLayer = h('div', 'layer toast');

    this.root.append(
      this.bgLayer,
      this.bgImage,
      noise,
      frame,
      this.actorsLayer,
      this.uiLayer,
      this.overlayLayer,
      this.toastLayer,
    );
    host.append(this.root);

    // 第一次点击解锁音频（浏览器策略）
    this.root.addEventListener('click', () => startBgm(), { capture: true });
  }

  setScene(scene: string): void {
    this.bgLayer.dataset.scene = scene;
    const url = backgrounds[`bg_${scene}`];
    this.bgImage.style.backgroundImage = url ? `url(${url})` : '';
    this.bgImage.classList.toggle('on', Boolean(url));
  }

  /** 只换立绘，不动背景 */
  setActor(actor?: string, expr: string = 'normal'): void {
    const key = actor ? `ch_${actor}_${expr}` : '';
    if (key === this.lastActor) return;
    this.lastActor = key;
    this.actorsLayer.innerHTML = '';
    if (!key) return;
    const url = actors[key];
    if (!url) return;
    const img = h('img', 'actor');
    img.src = url;
    img.alt = actor ?? '';
    this.actorsLayer.append(img);
  }

  /* ---------- 标题页 ---------- */

  title(hasSave: boolean, onStart: () => void, onContinue: () => void): void {
    this.clearAll();
    this.setScene('title');
    this.setActor(undefined);
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


  /** 群聊：手机界面 + 消息气泡，攒在同一段里 */
  private sayChat(node: SayNode, onNext: () => void): void {
    const seg = (node as unknown as { seg?: number }).seg ?? 0;
    if (seg !== this.chatSeg) {
      this.chatSeg = seg;
      this.chatLog = [];
    }
    this.chatLog.push({ speaker: node.speaker ?? '旁白', text: node.text });

    const phone = h('div', 'phone enter');
    const head = h('div', 'phone-head');
    head.append(h('div', 'phone-title', '今天吃什么'), h('div', 'phone-sub', '群聊 · 5 人'));
    const body = h('div', 'phone-body');
    for (const msg of this.chatLog) {
      const row = h('div', msg.speaker === '你' ? 'msg me' : 'msg');
      if (msg.speaker !== '你') row.append(h('div', 'msg-name', msg.speaker));
      row.append(h('div', 'msg-text', msg.text));
      body.append(row);
    }
    body.scrollTop = body.scrollHeight;
    phone.append(head, body);
    this.uiLayer.append(phone);

    play('page');
    const handler = () => {
      this.detachAdvance();
      play('click');
      onNext();
    };
    this.advanceHandler = handler;
    this.uiLayer.addEventListener('click', handler, { once: true });
  }

  say(node: SayNode, onNext: () => void): void {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    this.overlayLayer.innerHTML = '';

    if (node.channel === 'chat') {
      this.sayChat(node, onNext);
      return;
    }
    this.chatSeg = -1;
    this.chatLog = [];

    const box = h('div', 'dialog enter');
    if (node.speaker) box.append(h('div', 'speaker', node.speaker));
    box.append(h('div', 'text', node.text));

    if (node.prop) {
      const chip = h('button', 'card-chip');
      chip.insertAdjacentHTML('beforeend', `${icon('card')}<span>${PROP_LABEL[node.prop] ?? '看一眼'}</span>`);
      chip.addEventListener('click', (event) => {
        event.stopPropagation();
        this.showProp(node.prop as PropId);
      });
      box.append(chip);
      box.classList.add('has-chip');
    }

    if (node.card) {
      const chip = h('button', 'card-chip');
      chip.insertAdjacentHTML('beforeend', `${icon('card')}<span>看依据</span>`);
      chip.addEventListener('click', (event) => {
        event.stopPropagation();
        this.showCard(node.card!);
      });
      box.append(chip);
    } else {
      const tip = h('div', 'next-tip');
      tip.append(h('span', 'next-tip-text', '点击继续'));
      tip.insertAdjacentHTML('beforeend', icon('next'));
      box.append(tip);
    }

    if (node.hint) this.hintChip(node.hint, box);

    this.uiLayer.append(box);
    speak(node.id);

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('button')) return;
      this.detachAdvance();
      stopVoice();
      this.uiLayer.innerHTML = '';
      play('click');
      onNext();
    };
    this.advanceHandler = handler;
    this.root.addEventListener('click', handler);
  }

  private detachAdvance(): void {
    stopVoice();
    if (this.advanceHandler) {
      this.root.removeEventListener('click', this.advanceHandler);
      this.advanceHandler = null;
    }
  }

  /* ---------- 知识卡 ---------- */

  private showCard(id: string): void {
    const card = (window as unknown as { __knowledge?: KnowledgeCard[] }).__knowledge?.find((c) => c.id === id);
    if (!card) return;
    this.overlayLayer.innerHTML = '';
    const panel = h('div', 'card-panel');
    panel.append(h('div', 'card-title', card.title), h('p', 'card-body', card.body));
    if (card.source) panel.append(h('div', 'card-source', `依据：${card.source}`));
    const close = h('button', 'btn btn-ghost', '收起');
    panel.append(close);
    this.overlayLayer.classList.add('on');
    this.overlayLayer.append(panel);
    this.overlayLayer.classList.add('on');

    const dismiss = (event: MouseEvent) => {
      if (event.target instanceof Node && panel.contains(event.target) && event.target !== close) return;
      if (event.target instanceof Node && panel.contains(event.target)) return;
      close.click();
    };
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      this.overlayLayer.innerHTML = '';
      this.overlayLayer.classList.remove('on');
      this.root.removeEventListener('click', dismiss);
    });
    this.root.addEventListener('click', dismiss);
    play('page');
  }

  /* ---------- 选项 ---------- */

  choices(node: ChoiceNode, onPick: (index: number) => void): void {
    // 有 reply 的选项，先由调用方决定是否展示，这里只负责按钮
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    const wrap = h('div', 'choice-panel');
    if (node.question) wrap.append(h('div', 'choice-question', node.question));
    const list = h('div', 'choice-list');
    node.options.forEach((opt, i) => {
      const btn = h('button', 'choice', opt.text);
      btn.addEventListener('click', () => {
        play('page');
        onPick(i);
      });
      list.append(btn);
    });
    wrap.append(list);
    if (node.hint) this.hintChip(node.hint, wrap);
    this.uiLayer.append(wrap);
  }

  /* ---------- 结局 ---------- */

  ending(node: EndingNode, onRestart: () => void): void {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    this.overlayLayer.innerHTML = '';
    this.setScene(node.image ? 'ending' : 'canteen');
    if (node.image && backgrounds[node.image]) {
      this.bgImage.style.backgroundImage = `url(${backgrounds[node.image]})`;
      this.bgImage.classList.add('on');
    }
    this.setActor(undefined);
    play('ending');

    const card = h('div', 'ending-card');
    card.append(h('div', 'ending-tag', '结局'), h('div', 'ending-title', node.title));
    node.body.forEach((line) => card.append(h('p', 'ending-line', line)));
    if (node.action) {
      const action = h('div', 'ending-action');
      action.append(
        h('span', 'ending-action-label', '明天能做的一件事'),
        h('span', 'ending-action-text', node.action),
      );
      card.append(action);
    }
    const again = h('button', 'btn', '再走一遍');
    again.addEventListener('click', onRestart);
    card.append(again);
    this.uiLayer.append(card);
  }


  /* ---------- 章节卡 ---------- */

  chapter(title: string, subtitle: string, image: string | undefined, onDone: () => void): void {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    this.overlayLayer.innerHTML = '';
    const card = h('div', 'chapter-card');
    const art = image ? backgrounds[image] : undefined;
    if (art) {
      const img = h('div', 'chapter-art');
      img.style.backgroundImage = `url(${art})`;
      card.append(img);
    }
    card.append(h('div', 'chapter-kicker', '调查进行到'), h('div', 'chapter-title', title));
    if (subtitle) card.append(h('div', 'chapter-sub', subtitle));
    this.uiLayer.append(card);
    play('page');

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      this.uiLayer.innerHTML = '';
      this.detachAdvance();
      onDone();
    };
    const handler = (event: MouseEvent) => {
      event.stopPropagation();
      finish();
    };
    // 挂在卡片自己身上：挂到舞台上的话，“开始调查”那一下会顺着冒泡把卡点掉
    card.addEventListener('click', handler);
    window.setTimeout(finish, 1800);
  }

  /* ---------- 提示 ---------- */

  hintChip(text: string, host: HTMLElement): void {
    const chip = h('button', 'hint-chip');
    chip.insertAdjacentHTML('beforeend', `${icon('hint')}<span>提示</span>`);
    const panel = h('div', 'hint-panel', text);
    panel.hidden = true;
    chip.addEventListener('click', (event) => {
      event.stopPropagation();
      panel.hidden = !panel.hidden;
      chip.innerHTML = `${icon('hint')}<span>${panel.hidden ? '提示' : '收起提示'}</span>`;
    });
    host.append(chip, panel);
  }
  /* ---------- 给互动模块用的画布 ---------- */

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
    this.overlayLayer.classList.remove('on');
    this.toastLayer.innerHTML = '';
  }

  private showProp(id: PropId): void {
    const view = buildProp(id);
    const panel = h('div', 'prop-panel enter');
    const head = h('div', 'prop-head');
    head.append(h('div', 'prop-title', view.title));
    const close = h('button', 'btn btn-ghost btn-small', '收起');
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      panel.remove();
      if (!this.overlayLayer.children.length) this.overlayLayer.classList.remove('on');
    });
    head.append(close);
    panel.append(head, view.body);
    panel.addEventListener('click', (event) => event.stopPropagation());
    this.overlayLayer.classList.add('on');
    this.overlayLayer.append(panel);
  }
}
