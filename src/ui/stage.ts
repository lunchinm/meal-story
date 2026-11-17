import type { ChoiceNode, EndingNode, ExploreNode, KnowledgeCard, NotebookNode, SayNode } from '../engine/types';
import { backgrounds, actors } from '../assets';
import { play, speak, startBgm, stopVoice, getVolume, setVolume } from '../audio';
import { getSettings, saveSettings } from '../settings';
import { state } from '../state';
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
const PROP_IMAGE: Record<string, string> = {
  poster: 'chat_poster',
  tray: 'chat_tray',
  menu: 'chat_menu',
  note: 'bg_class',
  product_front: 'ch_banner_3',
  product_back: 'ch_banner_3',
  nutrition: 'ch_banner_3',
};

/** 群聊头像：取角色常态立绘，CSS 裁成圆形 */
const SPEAKER_ACTOR: Record<string, string> = {
  米粒: 'mili',
  周简: 'zhoujian',
  许知夏: 'zhixia',
  苏桃: 'sutao',
  陆燃: 'luran',
  罗师傅: 'luomaster',
};

/** 群聊里用假时间戳，按消息顺序往后走，读起来像真聊天 */
function chatTime(index: number): string {
  const base = 12 * 60 + 2;
  const minute = base + Math.floor(index * 0.7);
  const hh = String(Math.floor(minute / 60) % 24).padStart(2, '0');
  const mm = String(minute % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

const PROP_LABEL: Record<string, string> = {
  poster: '群里的宣传图',
  product_front: '看瓶子正面',
  product_back: '翻到背面',
  nutrition: '看营养成分表',
  note: '看便签',
  menu: '看菜牌',
  tray: '看实物',
};


const NAME_KEY = 'meal_player_name';
const ENDING_KEY = 'meal_endings';

function readPlayerName(): string {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function savePlayerName(name: string): void {
  try {
    if (name) window.localStorage.setItem(NAME_KEY, name);
    else window.localStorage.removeItem(NAME_KEY);
  } catch {
    /* 忽略隐私模式下的写入失败 */
  }
}

function readEndings(): Set<string> {
  try {
    const raw = window.localStorage.getItem(ENDING_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function saveEndings(ids: Set<string>): void {
  try {
    window.localStorage.setItem(ENDING_KEY, JSON.stringify([...ids]));
  } catch {
    /* 同上 */
  }
}

type LogEntry = { speaker: string; text: string; id: string };

export class Stage {
  /** 自动播放 */
  autoMode = false;
  /** 快进（只跳已读） */
  skipMode = false;
  private autoTimer: number | null = null;
  private advanceAction?: () => void;
  private typeTimer: number | null = null;
  private log: LogEntry[] = [];
  private chatEntries: Array<{ speaker: string; text: string; pic?: string; time: string }> = [];
  private uiHidden = false;

  onAutoSkipChange?: (auto: boolean, skip: boolean) => void;

  private chatSeg = -1;
  private chatLog: { speaker: string; text: string }[] = [];
  private chatActive = false;
  private lastWasChat = false;

  /** 当前是否在群聊段落，选项后续对白要沿用气泡 */
  inChat(): boolean {
    return this.chatActive;
  }

  /** 当前群聊段号，用来把后续消息接在同一段里 */
  chatSegId(): number {
    return this.chatSeg;
  }
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
    this.root.classList.add('title-mode');
    this.setScene('title');
    this.setActor(undefined);
    const panel = h('div', 'title-screen');
    panel.append(
      h('div', 'title-kicker', '“合理膳食 · 免疫基石”创意宣传大赛'),
      h('div', 'title-name', '今天吃什么？'),
      h('div', 'title-sub', '校园膳食调查簿'),
      h('div', 'title-meta', '四章 · 约 30—40 分钟 ｜ 对话 + 配餐 + 看标签'),
    );

    const nameRow = h('label', 'title-name-row');
    nameRow.append(h('span', 'title-name-label', '调查员'));
    const nameInput = document.createElement('input');
    nameInput.className = 'title-name-input';
    nameInput.type = 'text';
    nameInput.maxLength = 12;
    nameInput.placeholder = '可不填，默认“你”';
    nameInput.value = readPlayerName();
    nameInput.addEventListener('click', (event) => event.stopPropagation());
    nameRow.append(nameInput);
    panel.append(nameRow);

    const actions = h('div', 'title-actions');
    const start = h('button', 'btn btn-primary', hasSave ? '重新开始' : '开始调查');
    start.addEventListener('click', () => {
      savePlayerName(nameInput.value.trim());
      onStart();
    });
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


  /** 群聊：固定高度的手机界面，新消息自动落底 */
  private sayChat(node: SayNode, onNext: () => void): void {
    this.root.classList.remove('title-mode');
    const seg = (node as unknown as { seg?: number }).seg ?? 0;
    const newThread = !this.lastWasChat || seg !== this.chatSeg;
    if (newThread) {
      this.chatSeg = seg;
      this.chatEntries = [];
    }
    this.lastWasChat = true;

    const entry = {
      speaker: node.speaker ?? '旁白',
      text: node.text,
      pic: node.prop ? PROP_IMAGE[node.prop as PropId] : undefined,
      time: chatTime(this.chatEntries.length),
    };
    this.chatEntries.push(entry);
    this.pushLog(entry.speaker, entry.text, node.id);
    state.readNodes.add(node.id);
    this.chatActive = true;

    let phone = this.uiLayer.querySelector('.phone') as HTMLElement | null;
    let body: HTMLElement;
    const fresh = !phone;
    if (!phone) {
      phone = h('div', 'phone enter');
      const head = h('div', 'phone-head');
      const title = h('div', 'phone-title', '今天吃什么');
      const sub = h('div', 'phone-sub', '群聊 · 5 人');
      const headText = h('div', 'phone-head-text');
      headText.append(title, sub);
      head.append(h('div', 'phone-avatar-stack'), headText);
      body = h('div', 'phone-body');
      phone.append(head, body);
      this.uiLayer.append(phone);
      // 重建时把这段历史完整画出来（图片消息也要保留）
      for (const past of this.chatEntries.slice(0, -1)) {
        body.append(this.buildChatRow(past, false));
      }
    } else {
      body = phone.querySelector('.phone-body') as HTMLElement;
      phone.querySelector('.phone-choices')?.remove();
    }

    body.append(this.buildChatRow(entry, true));
    while (body.children.length > 60) body.firstElementChild?.remove();
    if (fresh) body.scrollTop = body.scrollHeight;
    else this.scrollChatToBottom(body);

    play('page');
    const handler = () => {
      this.detachAdvance();
      play('click');
      onNext();
    };
    this.advanceAction = handler;
    this.advanceHandler = handler;
    this.uiLayer.addEventListener('click', handler, { once: true });
    this.scheduleAdvance();
  }

  /** 一条聊天消息：头像 + 名字 + 时间 + 气泡（可带图片） */
  private buildChatRow(entry: { speaker: string; text: string; pic?: string; time: string }, isNew: boolean): HTMLElement {
    const mine = entry.speaker === '你';
    const row = h('div', mine ? 'chat-row mine' : 'chat-row');
    if (isNew) row.classList.add('enter');

    if (!mine) {
      const avatar = h('div', 'chat-avatar');
      const actorId = SPEAKER_ACTOR[entry.speaker];
      const url = actorId ? actors[`ch_${actorId}_normal`] : undefined;
      if (url) avatar.style.backgroundImage = `url(${url})`;
      else avatar.textContent = entry.speaker.slice(0, 1);
      row.append(avatar);
    }

    const col = h('div', 'chat-col');
    if (!mine) {
      const meta = h('div', 'chat-meta');
      meta.append(h('span', 'chat-name', entry.speaker), h('span', 'chat-time', entry.time));
      col.append(meta);
    } else {
      col.append(h('div', 'chat-meta mine'), h('span', 'chat-time', entry.time));
    }

    const bubble = h('div', 'chat-bubble');
    bubble.append(h('div', 'chat-text', entry.text));
    if (entry.pic) {
      const url = backgrounds[entry.pic];
      const pic = h('button', 'chat-pic');
      const img = document.createElement('img');
      img.className = 'chat-pic-img';
      img.loading = 'lazy';
      if (url) img.src = url;
      img.alt = entry.text.slice(0, 12);
      pic.append(img);
      pic.addEventListener('click', (event) => {
        event.stopPropagation();
        play('page');
        if (url) this.openImage(url, entry.text);
      });
      bubble.append(pic);
    }
    col.append(bubble);
    row.append(col);
    return row;
  }

  /** 大图查看器 */
  openImage(url: string, caption: string): void {
    this.clearAutoTimer();
    this.overlayLayer.innerHTML = '';
    const viewer = h('div', 'image-viewer');
    const img = document.createElement('img');
    img.src = url;
    img.alt = caption;
    const cap = h('div', 'image-viewer-cap', `${caption}（点击任意处关闭）`);
    viewer.append(img, cap);
    viewer.addEventListener('click', (event) => {
      event.stopPropagation();
      this.overlayLayer.innerHTML = '';
      this.overlayLayer.classList.remove('on');
      this.scheduleAdvance();
    });
    this.overlayLayer.classList.add('on');
    this.overlayLayer.append(viewer);
  }

  /** 只有本来就在底部时才跟着滚，玩家上翻不打断 */
  private scrollChatToBottom(body: HTMLElement): void {
    const nearBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 120;
    if (!nearBottom) return;
    requestAnimationFrame(() => {
      body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    });
  }

  say(node: SayNode, onNext: () => void): void {
    this.detachAdvance();
    this.root.classList.remove('title-mode');
    this.pushLog(node.speaker ?? '旁白', node.text, node.id);
    const wasRead = state.readNodes.has(node.id);
    state.readNodes.add(node.id);
    // 快进只跳已读；遇到没读过的就停下来
    if (this.skipMode && !wasRead) {
      this.skipMode = false;
      this.onAutoSkipChange?.(this.autoMode, this.skipMode);
    }
    this.uiLayer.innerHTML = '';
    this.overlayLayer.innerHTML = '';

    if (node.channel === 'chat') {
      this.sayChat(node, onNext);
      return;
    }
    this.chatSeg = -1;
    this.chatLog = [];
    this.chatActive = false;
    this.lastWasChat = false;

    const box = h('div', 'dialog enter');
    if (node.speaker) box.append(h('div', 'speaker', node.speaker));
    const textEl = h('div', 'text', '');
    box.append(textEl);
    // 打字机：点一下先显示全句，再点才推进
    let typing = 0;
    let typedAll = false;
    const fullText = node.text;
    const typeNext = () => {
      if (typedAll) return;
      typing += 1;
      textEl.textContent = fullText.slice(0, typing);
      if (typing >= fullText.length) {
        typedAll = true;
        box.classList.add('typed');
        return;
      }
      this.typeTimer = window.setTimeout(typeNext, 22);
    };
    this.clearTypeTimer();
    typeNext();

    const chipRow = h('div', 'chip-row');
    if (node.prop || node.card) box.append(chipRow);

    if (node.prop) {
      const chip = h('button', 'card-chip');
      chip.insertAdjacentHTML('beforeend', `${icon('card')}<span>${PROP_LABEL[node.prop] ?? '看一眼'}</span>`);
      chip.addEventListener('click', (event) => {
        event.stopPropagation();
        this.showProp(node.prop as PropId);
      });
      chipRow.append(chip);
    }

    if (node.card) {
      const chip = h('button', 'card-chip');
      chip.insertAdjacentHTML('beforeend', `${icon('card')}<span>看依据</span>`);
      chip.addEventListener('click', (event) => {
        event.stopPropagation();
        this.showCard(node.card!);
      });
      chipRow.append(chip);
    } else {
      const tip = h('div', 'next-tip');
      tip.append(h('span', 'next-tip-text', '点击继续'));
      tip.insertAdjacentHTML('beforeend', icon('next'));
      box.append(tip);
    }

    if (node.hint) this.hintChip(node.hint, box);

    this.uiLayer.append(box);
    speak(node.id);

    const proceed = () => {
      if (!typedAll) {
        this.clearTypeTimer();
        typedAll = true;
        typing = fullText.length;
        textEl.textContent = fullText;
        box.classList.add('typed');
        this.scheduleAdvance();
        return;
      }
      this.detachAdvance();
      stopVoice();
      this.uiLayer.innerHTML = '';
      play('click');
      onNext();
    };
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('button')) return;
      proceed();
    };
    this.advanceAction = proceed;
    this.advanceHandler = handler;
    this.root.addEventListener('click', handler);
    this.scheduleAdvance();
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
    this.clearAutoTimer();
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
      this.scheduleAdvance();
    });
    this.root.addEventListener('click', dismiss);
    play('page');
  }

  /* ---------- 选项 ---------- */

  /** 群聊里的选项：做成底部快捷回复条 */
  private chatChoices(node: ChoiceNode, onPick: (index: number) => void): void {
    const phone = this.uiLayer.querySelector('.phone') as HTMLElement | null;
    if (!phone) {
      this.chatActive = false;
      this.choices(node, onPick);
      return;
    }
    const bar = h('div', 'phone-choices enter');
    if (node.question) bar.append(h('div', 'phone-choices-q', node.question));
    node.options.forEach((opt, i) => {
      const btn = h('button', 'quick', opt.text);
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        play('page');
        // 先把玩家这句话发出去，再交给上层播后续
        const body = phone.querySelector('.phone-body') as HTMLElement;
        const row = h('div', 'msg me enter');
        row.append(h('div', 'msg-text', opt.text));
        body.append(row);
        this.scrollChatToBottom(body);
        bar.remove();
        this.lastWasChat = true;
        window.setTimeout(() => onPick(i), 220);
      });
      bar.append(btn);
    });
    phone.append(bar);
    const body = phone.querySelector('.phone-body') as HTMLElement | null;
    if (body) this.scrollChatToBottom(body);
  }

  choices(node: ChoiceNode, onPick: (index: number) => void): void {
    this.detachAdvance();
    this.stopAutoSkip();
    // 直接跳到分支节点时可能还没有背景，补一个默认场景
    if (!this.bgImage.classList.contains('on')) this.setScene('canteen');
    if (this.chatActive) {
      this.chatChoices(node, onPick);
      return;
    }
    this.uiLayer.innerHTML = '';
    this.chatActive = false;
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


  /* ---------- 记录与调查簿 ---------- */

  /** 记录一条行为：只闪一下便签图标，不给加分提示 */
  recordFlash(label: string): void {
    const chip = h('div', 'record-chip');
    chip.insertAdjacentHTML('beforeend', `${icon('card')}<span>记录：${label}</span>`);
    this.toastLayer.append(chip);
    window.setTimeout(() => chip.remove(), 1400);
  }

  /** 调查簿：逐条展开看解释与来源 */
  notebook(node: NotebookNode, onDone: () => void): void {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    const board = this.board('notebook');
    const head = h('div', 'board-head');
    head.append(h('div', 'board-title', node.title), h('div', 'board-sub', '可逐条翻开，也可以直接继续'));
    const body = h('div', 'board-body notebook-body');
    const entries = node.entries.filter((entry) => !entry.flag || state.flags.has(entry.flag));

    entries.forEach((entry, index) => {
      const item = h('button', 'nb-item');
      const num = h('span', 'nb-num', String(index + 1));
      const label = h('span', 'nb-label', entry.label);
      item.append(num, label);
      const detail = h('div', 'nb-detail');
      detail.append(h('div', 'nb-text', entry.text));
      if (entry.source) detail.append(h('div', 'nb-source', `来源：${entry.source}`));
      detail.hidden = true;
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        detail.hidden = !detail.hidden;
        item.classList.toggle('open', !detail.hidden);
        play('page');
      });
      const wrap = h('div', 'nb-entry');
      wrap.append(item, detail);
      body.append(wrap);
    });

    if (entries.length === 0) {
      body.append(h('div', 'explore-hint', '这次没有记下需要核实的内容，可以直接继续。'));
    }

    const foot = h('div', 'board-foot');
    foot.append(h('div', 'spacer'));
    const quit = h('button', 'btn btn-ghost', '保存并退出');
    quit.addEventListener('click', (event) => {
      event.stopPropagation();
      state.save();
      window.location.reload();
    });
    foot.append(quit);
    const next = h('button', 'btn btn-primary', '继续');
    next.addEventListener('click', (event) => {
      event.stopPropagation();
      play('page');
      onDone();
    });
    foot.append(next);
    board.append(head, body, foot);
  }

  /* ---------- 物件点击探索 ---------- */

  explore(node: ExploreNode, onDone: () => void): void {
    this.detachAdvance();
    this.uiLayer.innerHTML = '';
    const board = this.board('explore');
    const head = h('div', 'board-head');
    const counter = h('div', 'board-sub', '');
    head.append(h('div', 'board-title', node.title), counter);
    const body = h('div', 'board-body explore-body');
    const grid = h('div', 'explore-grid');
    const panel = h('div', 'explore-panel');
    panel.append(h('div', 'explore-hint', '点左边的物件看看。看过的会在再次点击时给一句回顾。'));
    body.append(grid, panel);

    const viewed = new Set<string>();
    const foot = h('div', 'board-foot');
    const talk = h('button', 'btn btn-primary', '和大家聊聊');
    talk.disabled = true;
    foot.append(h('div', 'spacer'), talk);
    board.append(head, body, foot);

    const refresh = () => {
      counter.textContent = `已查看 ${viewed.size} / ${node.items.length}`;
      talk.disabled = viewed.size < 2;
    };

    node.items.forEach((item) => {
      const card = h('button', 'explore-card');
      card.append(h('div', 'explore-name', item.label));
      card.addEventListener('click', (event) => {
        event.stopPropagation();
        panel.innerHTML = '';
        play('page');
        if (viewed.has(item.id)) {
          panel.append(h('div', 'explore-summary', item.summary));
          return;
        }
        viewed.add(item.id);
        card.classList.add('seen');
        item.lines.forEach((line) => {
          const row = h('div', 'explore-line');
          if (line.speaker) row.append(h('div', 'explore-speaker', line.speaker));
          row.append(h('div', 'explore-text', line.text));
          if (line.card) {
            const chip = h('button', 'card-chip');
            chip.insertAdjacentHTML('beforeend', `${icon('card')}<span>查看依据</span>`);
            chip.addEventListener('click', (e) => {
              e.stopPropagation();
              this.showCard(line.card!);
            });
            row.append(chip);
          }
          panel.append(row);
        });
        refresh();
      });
      grid.append(card);
    });

    talk.addEventListener('click', (event) => {
      event.stopPropagation();
      play('pass');
      onDone();
    });
    refresh();
  }


  /* ---------- 自动播放 / 快进 / 回想 ---------- */

  setAuto(on: boolean): void {
    // 选项、关卡、面板在场时自动播放无意义，直接不开
    if (on && this.uiLayer.querySelector('.choice, .quick, .board, .ending-card, .chapter-card')) {
      this.autoMode = false;
      this.onAutoSkipChange?.(false, this.skipMode);
      return;
    }
    this.autoMode = on;
    if (on) this.skipMode = false;
    this.clearAutoTimer();
    this.onAutoSkipChange?.(this.autoMode, this.skipMode);
    // 当前停在对话上就立即接着走
    if (on) this.scheduleAdvance();
  }

  setSkip(on: boolean): void {
    this.skipMode = on;
    if (on) this.autoMode = false;
    this.clearAutoTimer();
    this.onAutoSkipChange?.(this.autoMode, this.skipMode);
    if (on) this.scheduleAdvance(60);
  }

  toggleAuto(): void {
    this.setAuto(!this.autoMode);
  }

  toggleSkip(): void {
    this.setSkip(!this.skipMode);
  }

  private clearTypeTimer(): void {
    if (this.typeTimer !== null) {
      window.clearTimeout(this.typeTimer);
      this.typeTimer = null;
    }
  }

  private clearAutoTimer(): void {
    if (this.autoTimer !== null) {
      window.clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }

  /** 对话停在可推进状态时，按设置决定多久后自动走 */
  private scheduleAdvance(forceDelay?: number): void {
    this.clearAutoTimer();
    if (!this.autoMode && !this.skipMode) return;
    // 还在打字就别抢跑，等打完这一句再计时
    if (this.typeTimer !== null && !forceDelay) {
      this.autoTimer = window.setTimeout(() => this.scheduleAdvance(), 200);
      return;
    }
    const delay = forceDelay ?? this.currentDelay;
    this.autoTimer = window.setTimeout(() => {
      this.autoTimer = null;
      // 有面板盖在上面时先不动，等玩家收起来
      if (this.overlayLayer.classList.contains('on')) return;
      this.advanceAction?.();
    }, delay);
  }

  /** 进入关卡、选项、面板时停掉自动与快进 */
  stopAutoSkip(): void {
    this.clearAutoTimer();
    if (this.autoMode || this.skipMode) {
      this.autoMode = false;
      this.skipMode = false;
      this.onAutoSkipChange?.(false, false);
    }
  }

  private get currentDelay(): number {
    const base = getSettings().autoDelay;
    return this.skipMode ? 60 : base;
  }

  private pushLog(speaker: string, text: string, id: string): void {
    this.log.push({ speaker, text, id });
    if (this.log.length > 300) this.log.shift();
  }

  /** 回想：把这一路看过的对白列出来 */
  openBacklog(): void {
    this.clearAutoTimer();
    this.overlayLayer.innerHTML = '';
    const panel = h('div', 'backlog-panel');
    panel.append(h('div', 'backlog-title', `对话回想（${this.log.length} 条）`));
    const list = h('div', 'backlog-list');
    if (this.log.length === 0) {
      list.append(h('div', 'backlog-empty', '还没有可以回看的对白。'));
    }
    this.log.forEach((entry) => {
      const row = h('div', 'backlog-row');
      row.append(h('div', 'backlog-speaker', entry.speaker || '旁白'));
      row.append(h('div', 'backlog-text', entry.text));
      list.append(row);
    });
    panel.append(list);
    const close = h('button', 'btn btn-ghost', '收起');
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      this.overlayLayer.innerHTML = '';
      this.overlayLayer.classList.remove('on');
      this.scheduleAdvance();
    });
    panel.append(close);
    this.overlayLayer.classList.add('on');
    this.overlayLayer.append(panel);
    requestAnimationFrame(() => {
      list.scrollTop = list.scrollHeight;
    });
    play('page');
  }

  /** 设置面板：三条音量 + 自动播放停顿 */
  openSettings(): void {
    this.clearAutoTimer();
    this.overlayLayer.innerHTML = '';
    const panel = h('div', 'settings-panel');
    panel.append(h('div', 'settings-title', '设置'));

    const rows: Array<{ label: string; channel: 'bgm' | 'se' | 'voice' }> = [
      { label: '背景音乐', channel: 'bgm' },
      { label: '音效', channel: 'se' },
      { label: '角色语音', channel: 'voice' },
    ];
    rows.forEach((row) => {
      const line = h('div', 'settings-row');
      line.append(h('label', 'settings-label', row.label));
      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '100';
      input.value = String(Math.round(getVolume(row.channel) * 100));
      input.className = 'settings-range';
      input.dataset.channel = row.channel;
      input.addEventListener('input', () => {
        setVolume(row.channel, Number(input.value) / 100);
      });
      input.addEventListener('click', (event) => event.stopPropagation());
      line.append(input);
      const value = h('span', 'settings-value', `${input.value}`);
      input.addEventListener('input', () => {
        value.textContent = input.value;
      });
      line.append(value);
      panel.append(line);
    });

    const speedRow = h('div', 'settings-row');
    speedRow.append(h('label', 'settings-label', '自动播放停顿'));
    const speed = document.createElement('input');
    speed.type = 'range';
    speed.min = '600';
    speed.max = '3000';
    speed.step = '100';
    speed.value = String(getSettings().autoDelay);
    speed.className = 'settings-range';
    speed.dataset.channel = 'auto';
    speed.addEventListener('click', (event) => event.stopPropagation());
    speed.addEventListener('input', () => {
      saveSettings({ autoDelay: Number(speed.value) });
      speedValue.textContent = `${(Number(speed.value) / 1000).toFixed(1)} 秒`;
    });
    const speedValue = h('span', 'settings-value', `${(getSettings().autoDelay / 1000).toFixed(1)} 秒`);
    speedRow.append(speed, speedValue);
    panel.append(speedRow);

    panel.append(h('div', 'settings-note', '快捷键：A 自动播放 ｜ S 快进已读 ｜ L 回想 ｜ Esc 关闭 ｜ 右键 隐藏界面'));

    const close = h('button', 'btn btn-ghost', '完成');
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      this.overlayLayer.innerHTML = '';
      this.overlayLayer.classList.remove('on');
      this.scheduleAdvance();
    });
    panel.append(close);
    this.overlayLayer.classList.add('on');
    this.overlayLayer.append(panel);
    play('page');
  }

  /** 右键隐藏/恢复界面，方便看立绘和背景 */
  toggleUiHidden(): boolean {
    this.uiHidden = !this.uiHidden;
    this.root.classList.toggle('ui-hidden', this.uiHidden);
    return this.uiHidden;
  }

  /* ---------- 结局 ---------- */

  ending(node: EndingNode, onRestart: () => void): void {
    this.detachAdvance();
    this.root.classList.add('title-mode');
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
    if (node.cards && node.cards.length > 0) {
      const wrap = h('div', 'ending-cards');
      wrap.append(h('div', 'ending-cards-title', '片尾这四张，可以带走'));
      const row = h('div', 'ending-cards-row');
      node.cards.forEach((id, index) => {
        const item = h('button', 'ending-card-item');
        item.append(h('span', 'ending-card-num', String(index + 1)));
        const cardData = (window as unknown as { __knowledge?: KnowledgeCard[] }).__knowledge?.find((c) => c.id === id);
        item.append(h('span', 'ending-card-name', cardData?.title ?? `第 ${index + 1} 张`));
        item.addEventListener('click', (event) => {
          event.stopPropagation();
          this.showCard(id);
        });
        row.append(item);
      });
      wrap.append(row);
      card.append(wrap);
    }

    if (node.unlocks && node.unlocks.length > 0) {
      const box = h('div', 'ending-unlocks');
      box.append(h('div', 'ending-unlocks-title', '片尾后解锁'));
      const list = h('div', 'ending-unlocks-list');
      node.unlocks.forEach((text) => list.append(h('span', 'ending-unlock', text)));
      box.append(list);
      card.append(box);
    }

    // 结局相册
    const album = h('div', 'ending-album');
    album.append(h('div', 'ending-album-title', '结局相册'));
    const slots = h('div', 'ending-album-row');
    const seen = readEndings();
    seen.add(node.id);
    saveEndings(seen);
    const all = (window as unknown as { __endings?: Array<{ id: string; title: string }> }).__endings ?? [];
    all.forEach((entry) => {
      const got = seen.has(entry.id);
      const slot = h('div', got ? 'ending-slot got' : 'ending-slot');
      slot.append(h('span', 'ending-slot-mark', got ? '✔' : '·'));
      slot.append(h('span', 'ending-slot-name', got ? entry.title : '未解锁'));
      slots.append(slot);
    });
    album.append(slots);
    card.append(album);

    const name = readPlayerName();
    if (name) {
      card.append(h('div', 'ending-player', `本次调查员：${name}`));
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
    this.clearAutoTimer();
    const image = id === 'poster' ? backgrounds['poster_meal'] : id === 'tray' ? backgrounds['ch_banner_2'] : undefined;
    const view = buildProp(id, image);
    const panel = h('div', 'prop-panel enter');
    const head = h('div', 'prop-head');
    head.append(h('div', 'prop-title', view.title), h('div', 'prop-badge', '教学示例'));
    const close = h('button', 'btn btn-ghost btn-small', '收起');
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      panel.remove();
      if (!this.overlayLayer.children.length) this.overlayLayer.classList.remove('on');
      this.scheduleAdvance();
    });
    head.append(close);
    panel.append(head, view.body);
    panel.addEventListener('click', (event) => event.stopPropagation());
    this.overlayLayer.classList.add('on');
    this.overlayLayer.append(panel);
  }
}
