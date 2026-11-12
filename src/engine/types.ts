export type NodeType = 'say' | 'choice' | 'plate' | 'evidence' | 'ending';

export type SceneName = 'class' | 'canteen' | 'store' | 'chat';

export interface SayNode {
  id: string;
  type: 'say';
  speaker?: string;
  text: string;
  scene?: SceneName;
  next?: string;
}

export interface ChoiceOption {
  text: string;
  next: string;
  flag?: string;
}

export interface ChoiceNode {
  id: string;
  type: 'choice';
  question?: string;
  options: ChoiceOption[];
}

export interface PlateCheck {
  /** 必须覆盖的类别关键词，例如 ["蔬菜"] */
  require?: string[];
  /** 同一类别最多选几张 */
  maxSame?: number;
}

export interface PlateHints {
  overBudget?: string;
  missing?: string;
  other?: string;
}

export interface PlateNode {
  id: string;
  type: 'plate';
  speaker?: string;
  text?: string;
  budget: number;
  slots: number;
  /** 本关可用的食物卡 id */
  cards: string[];
  check?: PlateCheck;
  hint?: PlateHints;
  next: string;
}

export interface EvidenceClaim {
  id: string;
  text: string;
  /** 这句话是否真的需要核实 */
  suspect: boolean;
  reason: string;
}

export interface EvidenceNode {
  id: string;
  type: 'evidence';
  prompt?: string;
  claims: EvidenceClaim[];
  /** 需要选中几条才算对 */
  need?: number;
  allowRetry?: boolean;
  next: string;
}

export interface EndingNode {
  id: string;
  type: 'ending';
  title: string;
  body: string[];
  action?: string;
}

export type AnyNode = SayNode | ChoiceNode | PlateNode | EvidenceNode | EndingNode;

export interface FoodCard {
  id: string;
  name: string;
  category: string;
  portion: string;
  price: number;
  note?: string;
}

export interface KnowledgeCard {
  id: string;
  title: string;
  body: string;
  source?: string;
}

export interface Content {
  acts: Record<string, AnyNode[]>;
  cards: FoodCard[];
  knowledge: KnowledgeCard[];
}
