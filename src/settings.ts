/**
 * 音量与阅读节奏设置。三条音量分开，另加自动播放速度。
 * 存在 localStorage，重开游戏仍然生效。
 */

export interface Settings {
  bgm: number;
  se: number;
  voice: number;
  /** 自动播放每句的基础停顿（毫秒） */
  autoDelay: number;
}

const KEY = 'meal_settings_v1';

const DEFAULTS: Settings = { bgm: 0.09, se: 0.35, voice: 1, autoDelay: 1400 };

let current: Settings = { ...DEFAULTS };

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      current = {
        bgm: typeof parsed.bgm === 'number' ? parsed.bgm : DEFAULTS.bgm,
        se: typeof parsed.se === 'number' ? parsed.se : DEFAULTS.se,
        voice: typeof parsed.voice === 'number' ? parsed.voice : DEFAULTS.voice,
        autoDelay: typeof parsed.autoDelay === 'number' ? parsed.autoDelay : DEFAULTS.autoDelay,
      };
    }
  } catch {
    current = { ...DEFAULTS };
  }
  return { ...current };
}

export function getSettings(): Settings {
  return { ...current };
}

export function saveSettings(patch: Partial<Settings>): Settings {
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* 隐私模式下写不进去，内存里仍然生效 */
  }
  return { ...current };
}
