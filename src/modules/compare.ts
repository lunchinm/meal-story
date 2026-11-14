import type { CompareNode } from '../engine/types';
import type { Stage } from '../ui/stage';
import { play } from '../audio';
import { Bottle, type BottleDesign } from './bottle';

export interface CompareResult {
  picked: string;
  correct: boolean;
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

/**
 * 同类对比关。
 * 两件商品各自可以翻到背面看标签，玩家判断哪一件整份含糖更高。
 */
export function runCompare(node: CompareNode, stage: Stage): Promise<CompareResult> {
  const board = stage.board('compare');
  const head = el('div', 'board-head');
  head.append(
    el('div', 'board-title', node.prompt ?? '哪一件整份含糖更高？'),
    el('div', 'board-sub', '先翻到背面看标签'),
  );
  if (node.hint) stage.hintChip(node.hint, head);

  const body = el('div', 'board-body compare-wrap');
  const row = el('div', 'compare-row');
  body.append(row);

  const foot = el('div', 'board-foot');
  const hintLine = el('div', 'hint-line');
  const spacer = el('div', 'spacer');
  const submit = el('button', 'btn btn-primary', '选它');
  foot.append(hintLine, spacer, submit);
  board.append(head, body, foot);

  const bottles = new Map<string, Bottle>();
  const flipped = new Set<string>();
  let picked = '';
  let done = false;
  let attempts = 0;
  let resolveFn: (r: CompareResult) => void = () => {};
  const promise = new Promise<CompareResult>((resolve) => {
    resolveFn = resolve;
  });

  function designOf(offer: (typeof node.offers)[number]): BottleDesign {
    const isTea = /茶/.test(offer.name);
    return {
      main: isTea ? '#c8452a' : '#2f7d7a',
      accent: isTea ? '#e0663f' : '#4aa39c',
      name: offer.name.replace(/\s*500ml$/i, ''),
      subtitle: isTea ? '清爽解腻' : '零蔗糖 · 0 卡',
      back: offer.back.slice(0, 3),
    };
  }

  function render(): void {
    row.innerHTML = '';
    bottles.clear();
    node.offers.forEach((offer) => {
      const card = el('div', picked === offer.id ? 'offer on' : 'offer');
      card.append(el('div', 'offer-name', offer.name));

      const face = el('div', 'offer-face bottle-face');
      const canvas = document.createElement('canvas');
      canvas.className = 'bottle-canvas';
      canvas.tabIndex = 0;
      canvas.setAttribute('aria-label', `${offer.name}，按住左右拖动可转动`);
      face.append(canvas);
      const tip = el('div', 'bottle-tip', '按住左右拖动转动瓶身');
      face.append(tip);
      card.append(face);

      const bottle = new Bottle(canvas, designOf(offer));
      bottles.set(offer.id, bottle);

      const flip = el('button', 'btn btn-ghost btn-small', '转到背面');
      flip.addEventListener('click', (event) => {
        event.stopPropagation();
        bottle.show(false);
      });
      card.append(flip);

      card.addEventListener('click', () => {
        if (done) return;
        picked = offer.id;
        hintLine.textContent = '';
        render();
      });
      row.append(card);
    });
  }

  function finish(correct: boolean): void {
    if (done) return;
    done = true;
    submit.disabled = true;
    window.setTimeout(() => resolveFn({ picked, correct }), 220);
  }

  submit.addEventListener('click', () => {
    if (!picked) {
      stage.toast('先选一件');
      return;
    }
    attempts += 1;
    const offer = node.offers.find((o) => o.id === picked);
    if (!offer) return;
    const correct = picked === node.worse;
    hintLine.textContent = offer.note;
    if (correct) {
      play('pass');
      finish(true);
      return;
    }
    play('fail');
    if (attempts >= 2) finish(false);
  });

  render();
  return promise;
}
