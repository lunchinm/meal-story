export type NodeType = 'say' | 'choice' | 'plate' | 'evidence' | 'ending' | 'branch' | 'chapter';

export type SceneName = 'class' | 'canteen' | 'store' | 'chat';

export interface ChapterNode {
  id: string;
  type: 'chapter';
  title: string;
  subtitle?: string;
  /** 章节过场图，assets/bg 里的 key */
  image?: string;
  next: string;
}

export interface SayNode {
  id: string;
  type: 'say';
  /** chat＝群聊消息，stage＝当面说话；群聊不出立绘也不配音 */
  channel?: 'chat' | 'stage';
  /** 这句台词要展示的道具：标签、便签、菜牌等 */
  prop?: string;
  speaker?: string;
  text: string;
  scene?: SceneName;
  /** 立绘 id：assets 里的 ch_<actor>_<expr> */
  actor?: string;
  expr?: 'normal' | 'happy' | 'worried';
  /** 可展开的知识卡 id */
  card?: string;
  /** 给玩家的提示，点“提示”才展开 */
  hint?: string;
  next?: string;
}

export interface BranchRule {
  /** 集合里任一 flag 命中就走这条（all 为 true 时要求全部命中） */
  flags: string[];
  all?: boolean;
  next: string;
}

export interface BranchNode {
  id: string;
  type: 'branch';
  rules: BranchRule[];
  fallback: string;
}

export interface ChoiceOption {
  text: string;
  next: string;
  flag?: string;
  /** 选完之后先弹这一句，再回主线 */
  reply?: string;
  /** 这句由谁说，默认旁白 */
  replySpeaker?: string;
}

export interface ChoiceNode {
  id: string;
  type: 'choice';
  question?: string;
  hint?: string;
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
  tip?: string;
  next: string;
}

export interface EvidenceClaim {
  id: string;
  text: string;
  /** 这句话是否真的需要核实 */
  suspect: boolean;
  reason: string;
}

export interface PosterRegion {
  /** 对应哪一条说法 */
  claimId: string;
  /** 对应宣传图上的第几行文字（从 0 数） */
  line: number;
  label: string;
}

export interface EvidenceNode {
  id: string;
  type: 'evidence';
  prompt?: string;
  /** 有图就用图上圈选，没有就退回点选列表 */
  image?: string;
  posterText?: string[];
  regions?: PosterRegion[];
  claims: EvidenceClaim[];
  hint?: string;
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
  /** 结局插画，assets/bg 里的 key */
  image?: string;
}

export interface ReviewOption {
  id: string;
  label: string;
  detail: string;
  /** 是不是「最该改」的那一餐 */
  correct: boolean;
  reason: string;
}

export interface ReviewNode {
  id: string;
  type: 'review';
  prompt?: string;
  hint?: string;
  options: ReviewOption[];
  next: string;
}

export interface CompareOffer {
  id: string;
  name: string;
  front: string;
  back: string[];
  note: string;
}

export interface CompareNode {
  id: string;
  type: 'compare';
  prompt?: string;
  hint?: string;
  offers: CompareOffer[];
  /** 哪一件整份含糖更高 */
  worse: string;
  next: string;
}

export type AnyNode =
  | SayNode
  | ChoiceNode
  | PlateNode
  | EvidenceNode
  | EndingNode
  | BranchNode
  | ChapterNode
  | ReviewNode
  | CompareNode;

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
