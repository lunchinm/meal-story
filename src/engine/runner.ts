import type {
  AnyNode,
  BranchNode,
  ChapterNode,
  ChoiceNode,
  Content,
  EndingNode,
  EvidenceNode,
  PlateNode,
  SayNode,
} from './types';
import type { Stage } from '../ui/stage';
import { state } from '../state';
import { runPlate } from '../modules/plate';
import { runEvidence } from '../modules/evidence';

export class Runner {
  private readonly nodes = new Map<string, AnyNode>();

  constructor(
    private readonly content: Content,
    private readonly stage: Stage,
    private readonly onRestart: () => void,
  ) {
    Object.values(content.acts)
      .flat()
      .forEach((node) => this.nodes.set(node.id, node));
  }

  get firstNodeId(): string {
    return this.content.acts.act1?.[0]?.id ?? '';
  }

  start(id?: string): void {
    this.goto(id ?? this.firstNodeId);
  }

  private goto(id: string): void {
    const node = this.nodes.get(id);
    if (!node) {
      this.stage.toast(`找不到节点：${id}`);
      return;
    }
    state.nodeId = id;
    state.save();

    switch (node.type) {
      case 'say':
        this.playSay(node);
        break;
      case 'choice':
        this.playChoice(node);
        break;
      case 'plate':
        this.playPlate(node);
        break;
      case 'evidence':
        this.playEvidence(node);
        break;
      case 'branch':
        this.playBranch(node);
        break;
      case 'chapter':
        this.playChapter(node);
        break;
      case 'ending':
        this.playEnding(node);
        break;
    }
  }

  private playSay(node: SayNode): void {
    if (node.scene) this.stage.setScene(node.scene);
    this.stage.setActor(node.actor, node.expr ?? 'normal');
    this.stage.say(node, () => {
      if (node.next) this.goto(node.next);
      else this.stage.toast('剧情到这里就断了，检查一下 content 里的 next');
    });
  }

  private playChoice(node: ChoiceNode): void {
    this.stage.choices(node, (index) => {
      const option = node.options[index];
      if (!option) return;
      if (option.flag) state.flags.add(option.flag);
      state.save();
      this.goto(option.next);
    });
  }

  private playPlate(node: PlateNode): void {
    this.stage.setScene('canteen');
    this.stage.setActor(undefined);
    runPlate(node, this.content.cards, this.stage).then((result) => {
      result.picked.forEach((id) => state.picked.add(id));
      state.save();
      this.goto(node.next);
    });
  }

  private playEvidence(node: EvidenceNode): void {
    this.stage.setActor(undefined);
    runEvidence(node, this.stage).then((result) => {
      if (result.correct) state.flags.add(`evidence:${node.id}`);
      state.save();
      this.goto(node.next);
    });
  }

  private playChapter(node: ChapterNode): void {
    this.stage.setActor(undefined);
    this.stage.chapter(node.title, node.subtitle ?? '', () => this.goto(node.next));
  }

  private playBranch(node: BranchNode): void {
    const hit = node.rules.find((rule) =>
      rule.all
        ? rule.flags.every((flag) => state.flags.has(flag))
        : rule.flags.some((flag) => state.flags.has(flag)),
    );
    this.goto(hit ? hit.next : node.fallback);
  }

  private playEnding(node: EndingNode): void {
    this.stage.ending(node, this.onRestart);
  }
}
