export type NodeType =
  | 'say' | 'choice' | 'plate' | 'evidence' | 'ending' | 'branch' | 'chapter'
  | 'record' | 'notebook' | 'explore' | 'random' | 'compare' | 'review';

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
  /** 条件显示：flag 存在才显示；notFlag 存在则不显示 */
  showIf?: { flag?: string; notFlag?: string };
  /** 选完之后先弹这几句，再回主线；可带说话人 */
  reply?: string | Array<string | { speaker?: string; text: string }>;
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
  /** 片尾四张知识卡（knowledge 里的 id） */
  cards?: string[];
  /** 片尾后解锁的内容 */
  unlocks?: string[];
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
  | CompareNode
  | ReviewNode
  | BranchNode
  | ChapterNode
  | EndingNode
  | RecordNode
  | NotebookNode
  | ExploreNode
  | RandomNode;

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

/** 记录：落地一条【记录“X”】，不弹加分提示，只闪一下便签图标 */
export interface RecordNode {
  id: string;
  type: 'record';
  flag: string;
  label: string;
  next: string;
}

export interface NotebookEntry {
  label: string;
  text: string;
  source?: string;
  /** 只有拿到这个 flag 才显示 */
  flag?: string;
}

/** 调查簿：章末摊开的簿子，逐条点开看解释与来源 */
export interface NotebookNode {
  id: string;
  type: 'notebook';
  title: string;
  entries: NotebookEntry[];
  next: string;
}

export interface ExploreItem {
  id: string;
  label: string;
  /** 重复点击时的一句话回顾 */
  summary: string;
  lines: Array<{ speaker?: string; text: string; card?: string }>;
}

/** 物件点击探索：首次给对白，重复只给摘要，看完两个才能继续 */
export interface ExploreNode {
  id: string;
  type: 'explore';
  title: string;
  items: ExploreItem[];
  next: string;
}

export interface RandomEvent {
  id: string;
  /** 需要命中的 flag（为空表示无条件） */
  flags?: string[];
  next: string;
}

/** 随机事件池：等概率抽一个没触发过的，同一局不重复 */
export interface RandomNode {
  id: string;
  type: 'random';
  pool: RandomEvent[];
  next: string;
}
