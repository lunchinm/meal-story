import type { CompareNode } from '../engine/types';
import type { Stage } from '../ui/stage';
import { play } from '../audio';

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

  const flipped = new Set<string>();
  let picked = '';
  let done = false;
  let attempts = 0;
  let resolveFn: (r: CompareResult) => void = () => {};
  const promise = new Promise<CompareResult>((resolve) => {
    resolveFn = resolve;
  });

  function render(): void {
    row.innerHTML = '';
    node.offers.forEach((offer) => {
      const card = el('div', picked === offer.id ? 'offer on' : 'offer');
      const back = flipped.has(offer.id);
      card.append(el('div', 'offer-name', offer.name));
      const face = el('div', 'offer-face');
      if (back) {
        const ul = el('div', 'offer-back');
        offer.back.forEach((line) => ul.append(el('div', 'offer-line', line)));
        face.append(ul);
      } else {
        face.append(el('div', 'offer-front', offer.front));
      }
      card.append(face);

      const flip = el('button', 'btn btn-ghost btn-small', back ? '看正面' : '翻到背面');
      flip.append(document.createElement('span'));
      flip.addEventListener('click', (event) => {
        event.stopPropagation();
        if (back) flipped.delete(offer.id);
        else flipped.add(offer.id);
        render();
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
