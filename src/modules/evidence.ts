import type { EvidenceNode } from '../engine/types';
import type { Stage } from '../ui/stage';
import { play } from '../audio';
import { backgrounds } from '../assets';

export interface EvidenceResult {
  picked: string[];
  attempts: number;
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
 * 证据判断关。
 * 目前是“点选可疑说法”，图上的区域圈选留到 v1.1。
 * 允许改一次：第一次判错会把理由摆出来，这正是教学点。
 */
export function runEvidence(node: EvidenceNode, stage: Stage): Promise<EvidenceResult> {
  let resolveFn: (result: EvidenceResult) => void = () => {};
  const promise = new Promise<EvidenceResult>((resolve) => {
    resolveFn = resolve;
  });

  const expected = node.claims.filter((claim) => claim.suspect).map((claim) => claim.id);
  const selected = new Set<string>();
  let attempts = 0;
  let done = false;

  if (node.image && node.regions && node.regions.length > 0) {
    return runPoster(node, stage, expected);
  }

  const board = stage.board('evidence');
  const head = el('div', 'board-head');
  head.append(
    el('div', 'board-title', node.prompt ?? '把要核实的地方点出来'),
    el('div', 'board-sub', `选出 ${node.need ?? expected.length} 处`),
  );

  if (node.hint) stage.hintChip(node.hint, head);

  const body = el('div', 'board-body evidence-wrap');
  const list = el('div', 'claim-list');
  body.append(list);

  const foot = el('div', 'board-foot');
  const hintLine = el('div', 'hint-line');
  const spacer = el('div', 'spacer');
  const submitBtn = el('button', 'btn btn-primary', '确定');
  foot.append(hintLine, spacer, submitBtn);

  board.append(head, body, foot);

  function render(): void {
    list.innerHTML = '';
    node.claims.forEach((claim) => {
      const on = selected.has(claim.id);
      const btn = el('button', on ? 'claim on' : 'claim');
      const mark = el('span', 'claim-mark', '✓');
      const textWrap = el('span');
      textWrap.append(el('div', 'claim-text', claim.text));
      if (attempts > 0) {
        textWrap.append(el('div', 'claim-reason', claim.reason));
      }
      btn.append(mark, textWrap);
      btn.addEventListener('click', () => {
        if (done) return;
        if (on) selected.delete(claim.id);
        else selected.add(claim.id);
        hintLine.textContent = '';
        render();
      });
      list.append(btn);
    });
  }

  function finish(correct: boolean): void {
    if (done) return;
    done = true;
    submitBtn.disabled = true;
    window.setTimeout(() => resolveFn({ picked: [...selected], attempts, correct }), 240);
  }

  submitBtn.addEventListener('click', () => {
    if (selected.size === 0) {
      stage.toast('先点一下你觉得要核实的地方');
      return;
    }
    attempts += 1;
    const picked = [...selected].sort();
    const target = [...expected].sort();
    const correct = picked.length === target.length && picked.every((id, i) => id === target[i]);

    if (correct) {
      finish(true);
      return;
    }

    hintLine.textContent = '和答案不一样，理由都摆出来了，再看一眼';
    render();
    if (attempts >= (node.allowRetry === false ? 1 : 2)) {
      stage.toast('先按这个结论往下走');
      finish(false);
    }
  });

  render();
  return promise;
}

/** 图上圈选：直接点宣传图上的文字行 */
function runPoster(node: EvidenceNode, stage: Stage, expected: string[]): Promise<EvidenceResult> {
  let resolveFn: (result: EvidenceResult) => void = () => {};
  const promise = new Promise<EvidenceResult>((resolve) => {
    resolveFn = resolve;
  });

  const selected = new Set<string>();
  let attempts = 0;
  let done = false;
  const lines = node.posterText ?? [];

  const board = stage.board('poster-mode');
  const head = el('div', 'board-head');
  head.append(
    el('div', 'board-title', node.prompt ?? '在宣传图上圈出要核实的说法'),
    el('div', 'board-sub', `选出 ${node.need ?? expected.length} 处`),
  );
  if (node.hint) stage.hintChip(node.hint, head);

  const body = el('div', 'board-body poster-wrap');
  const art = el('div', 'poster-art');
  const url = backgrounds[node.image ?? ''];
  if (url) art.style.backgroundImage = `url(${url})`;

  const copy = el('div', 'poster-copy');
  lines.forEach((text, index) => {
    const region = (node.regions ?? []).find((r) => (r as unknown as { line?: number }).line === index);
    if (!region) {
      copy.append(el('div', `poster-line poster-line-${index}`, text));
      return;
    }
    const on = selected.has(region.claimId);
    const btn = el('button', on ? `poster-line poster-line-${index} spot on` : `poster-line poster-line-${index} spot`);
    btn.append(el('span', 'spot-text', text));
    btn.addEventListener('click', () => {
      if (done) return;
      if (selected.has(region.claimId)) selected.delete(region.claimId);
      else selected.add(region.claimId);
      hintLine.textContent = '';
      render();
    });
    copy.append(btn);
  });
  art.append(copy);

  const tip = el('div', 'poster-tip', '点击图里的文字，把它圈出来');
  body.append(art, tip);

  const foot = el('div', 'board-foot');
  const hintLine = el('div', 'hint-line');
  const spacer = el('div', 'spacer');
  const submit = el('button', 'btn btn-primary', '确定');
  foot.append(hintLine, spacer, submit);
  board.append(head, body, foot);

  function render(): void {
    copy.querySelectorAll('.spot').forEach((node2) => {
      const text = node2.textContent ?? '';
      const region = (node.regions ?? []).find((r) => r.label === text);
      if (region) node2.classList.toggle('on', selected.has(region.claimId));
    });
  }

  function finish(correct: boolean): void {
    if (done) return;
    done = true;
    submit.disabled = true;
    window.setTimeout(() => resolveFn({ picked: [...selected], attempts, correct }), 220);
  }

  submit.addEventListener('click', () => {
    if (selected.size === 0) {
      stage.toast('在图上点一下要核实的地方');
      return;
    }
    attempts += 1;
    const picked = [...selected].sort();
    const target = [...expected].sort();
    const correct = picked.length === target.length && picked.every((id, i) => id === target[i]);
    if (correct) {
      play('pass');
      finish(true);
      return;
    }
    hintLine.textContent = '圈的地方不太对：找哪句话给了承诺却没说条件';
    render();
    if (attempts >= 2) {
      stage.toast('先按这个判断往下走');
      finish(false);
    }
  });

  render();
  return promise;
}
