import type { FoodCard, PlateNode } from '../engine/types';
import type { Stage } from '../ui/stage';
import { foods } from '../assets';
import { play } from '../audio';

export interface PlateResult {
  picked: string[];
  attempts: number;
  passed: boolean;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function fill(template: string | undefined, values: Record<string, string | number>): string {
  if (!template) return '';
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

/**
 * 餐盘关。
 * 判定只看三件事：超预算、必需类别、同类过量。
 * 不设唯一答案，也不许卡死：第三次仍不达标就放行。
 */
export function runPlate(node: PlateNode, allCards: FoodCard[], stage: Stage): Promise<PlateResult> {
  let resolveFn: (result: PlateResult) => void = () => {};
  const promise = new Promise<PlateResult>((resolve) => {
    resolveFn = resolve;
  });

  const catalog = node.cards
    .map((id) => allCards.find((card) => card.id === id))
    .filter((card): card is FoodCard => Boolean(card));

  const picked: string[] = [];
  let attempts = 0;
  let done = false;

  const board = stage.board('plate');
  const head = el('div', 'board-head');
  head.append(
    el('div', 'board-title', node.speaker ? `${node.speaker}的午餐` : '配一份午餐'),
    el('div', 'board-sub', `预算 ${node.budget} 元 ｜ ${node.slots} 个位置`),
  );

  if (node.tip) stage.hintChip(node.tip, head);

  const body = el('div', 'board-body plate-wrap');
  const grid = el('div', 'card-grid');
  const side = el('div', 'plate-side');
  const tray = el('div', 'tray');
  const meterLabel = el('div', 'board-sub');
  const meter = el('div', 'meter');
  const meterBar = el('span');
  meter.append(meterBar);
  const hintLine = el('div', 'hint-line');

  body.append(grid, side);
  side.append(tray, meterLabel, meter, hintLine);

  const foot = el('div', 'board-foot');
  const clearBtn = el('button', 'btn btn-ghost', '清空');
  const spacer = el('div', 'spacer');
  const submitBtn = el('button', 'btn btn-primary', '提交');
  foot.append(clearBtn, spacer, submitBtn);

  board.append(head, body, foot);

  const priceOf = (id: string) => catalog.find((card) => card.id === id)?.price ?? 0;
  const totalPrice = () => picked.reduce((sum, id) => sum + priceOf(id), 0);

  function renderTray(): void {
    tray.innerHTML = '';
    for (let i = 0; i < node.slots; i += 1) {
      const id = picked[i];
      const card = id ? catalog.find((c) => c.id === id) : undefined;
      tray.append(el('div', card ? 'slot filled' : 'slot', card ? card.name : '空位'));
    }
    const total = totalPrice();
    const left = node.budget - total;
    meterLabel.textContent = `已选 ${picked.length}/${node.slots} ｜ 合计 ${total} 元 ｜ ${
      left >= 0 ? `还剩 ${left} 元` : `超了 ${-left} 元`
    }`;
    meter.classList.toggle('over', left < 0);
    meterBar.style.width = `${Math.min(100, (total / node.budget) * 100)}%`;
  }

  function renderGrid(): void {
    grid.innerHTML = '';
    catalog.forEach((card) => {
      const btn = el('button', picked.includes(card.id) ? 'food on' : 'food');
      const art = foods[`food_${card.id}`];
      if (art) {
        const img = el('img', 'food-art');
        img.src = art;
        img.alt = card.name;
        btn.append(img);
      }
      btn.append(el('div', 'food-name', card.name), el('div', 'food-meta', `${card.portion} ｜ ${card.price} 元`));
      btn.title = card.note ?? '';
      btn.addEventListener('click', () => {
        const index = picked.indexOf(card.id);
        if (index >= 0) {
          picked.splice(index, 1);
        } else if (picked.length >= node.slots) {
          stage.toast('位置满了，先取消一个');
          return;
        } else {
          picked.push(card.id);
        }
        hintLine.textContent = '';
        renderGrid();
        renderTray();
      });
      grid.append(btn);
    });
  }

  /** 返回不通过的理由；null 表示这盘可以 */
  function checkProblem(): string | null {
    const total = totalPrice();
    if (total > node.budget) {
      return fill(node.hint?.overBudget, { n: Math.round(total - node.budget) }) || '超预算了';
    }

    const categories = picked.map((id) => catalog.find((c) => c.id === id)?.category ?? '');
    const require = node.check?.require ?? [];
    const missing = require.find((keyword) => !categories.some((cat) => cat.includes(keyword)));
    if (missing) {
      return fill(node.hint?.missing, { category: missing }) || `还缺一份${missing}`;
    }

    const maxSame = node.check?.maxSame ?? 99;
    const counts = new Map<string, number>();
    categories.forEach((cat) => counts.set(cat, (counts.get(cat) ?? 0) + 1));
    const crowded = [...counts.entries()].find(([, n]) => n > maxSame);
    if (crowded) {
      return node.hint?.other ?? `${crowded[0]}选得有点多`;
    }
    return null;
  }

  function finish(passed: boolean): void {
    if (done) return;
    done = true;
    board.querySelectorAll('button').forEach((btn) => {
      (btn as HTMLButtonElement).disabled = true;
    });
    window.setTimeout(() => resolveFn({ picked: [...picked], attempts, passed }), 240);
  }

  clearBtn.addEventListener('click', () => {
    picked.length = 0;
    hintLine.textContent = '';
    renderGrid();
    renderTray();
  });

  submitBtn.addEventListener('click', () => {
    if (picked.length === 0) {
      stage.toast('先选几样');
      return;
    }
    attempts += 1;
    const problem = checkProblem();
    if (!problem) {
      finish(true);
      return;
    }
    hintLine.textContent = problem;
    play('fail');
    if (attempts >= 3) {
      stage.toast('不如先这样，剧情往下走，回头再调');
      finish(false);
    }
  });

  renderGrid();
  renderTray();
  return promise;
}
