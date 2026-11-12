const SAVE_KEY = 'meal_save_v1';

export interface SaveData {
  nodeId: string;
  flags: string[];
  picked: string[];
  updatedAt: string;
}

export const state = {
  nodeId: '',
  flags: new Set<string>(),
  /** 玩家在餐盘里选过的食物卡 id */
  picked: new Set<string>(),

  save(): void {
    const data: SaveData = {
      nodeId: this.nodeId,
      flags: [...this.flags],
      picked: [...this.picked],
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // 离线单文件、隐私模式下写不了就算了，不影响游玩
    }
  },

  load(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  },

  restore(): boolean {
    const data = this.load();
    if (!data || !data.nodeId) return false;
    this.nodeId = data.nodeId;
    this.flags = new Set(data.flags ?? []);
    this.picked = new Set(data.picked ?? []);
    return true;
  },

  reset(): void {
    this.nodeId = '';
    this.flags.clear();
    this.picked.clear();
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* 同上 */
    }
  },
};
