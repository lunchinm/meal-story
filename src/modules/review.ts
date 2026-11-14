import type { ReviewNode } from '../engine/types';
import type { Stage } from '../ui/stage';
import { play } from '../audio';

export interface ReviewResult {
  picked: string;
  correct: boolean;
  attempts: number;
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
 * 全天记录关。
 * 玩家先看到早、中、晚三份记录，判断哪一餐最该改；判错给理由，可以再选。
 */
export function runReview(node: ReviewNode, stage: Stage): Promise<ReviewResult> {
  const board = stage.board('review');
  const head = el('div', 'board-head');
  head.append(
    el('div', 'board-title', node.prompt ?? '哪一餐最该先改？'),
    el('div', 'board-sub', `共 ${node.options.length} 份记录`),
  );
  if (node.hint) stage.hintChip(node.hint, head);

  const body = el('div', 'board-body review-wrap');
  const list = el('div', 'review-list');
  body.append(list);

  const foot = el('div', 'board-foot');
  const hintLine = el('div', 'hint-line');
  const spacer = el('div', 'spacer');
  const submit = el('button', 'btn btn-primary', '就改这一餐');
  foot.append(hintLine, spacer, submit);

  board.append(head, body, foot);

  let picked = '';
  let attempts = 0;
  let done = false;
  let resolveFn: (r: ReviewResult) => void = () => {};
  const promise = new Promise<ReviewResult>((resolve) => {
    resolveFn = resolve;
  });

  function render(): void {
    list.innerHTML = '';
    node.options.forEach((opt) => {
      const on = picked === opt.id;
      const card = el('button', on ? 'record on' : 'record');
      card.append(el('div', 'record-head', opt.label), el('div', 'record-detail', opt.detail));
      card.addEventListener('click', () => {
        if (done) return;
        picked = opt.id;
        hintLine.textContent = '';
        render();
      });
      list.append(card);
    });
  }

  function finish(correct: boolean): void {
    if (done) return;
    done = true;
    submit.disabled = true;
    window.setTimeout(() => resolveFn({ picked, correct, attempts }), 220);
  }

  submit.addEventListener('click', () => {
    if (!picked) {
      stage.toast('先点一份记录');
      return;
    }
    const opt = node.options.find((o) => o.id === picked);
    if (!opt) return;
    attempts += 1;
    hintLine.textContent = opt.reason;
    if (opt.correct) {
      play('pass');
      finish(true);
      return;
    }
    play('fail');
    if (attempts >= 2) {
      stage.toast('先按这个判断往下走');
      finish(false);
    }
  });

  render();
  return promise;
}
