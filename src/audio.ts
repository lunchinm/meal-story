/**
 * 音效与背景垫音。
 * 全部是本地合成的波形，不采样现成素材，也不含人声。
 * 浏览器不允许自动播放，所以 BGM 在第一次点击后才起。
 */
import clickUrl from '../assets/sfx/sfx_click.wav';
import pageUrl from '../assets/sfx/sfx_page.wav';
import passUrl from '../assets/sfx/sfx_pass.wav';
import failUrl from '../assets/sfx/sfx_fail.wav';
import endingUrl from '../assets/sfx/sfx_ending.wav';
import bgmUrl from '../assets/sfx/bgm_loop.mp3';

const sounds: Record<string, string> = {
  click: clickUrl,
  page: pageUrl,
  pass: passUrl,
  fail: failUrl,
  ending: endingUrl,
};

let muted = false;
let bgm: HTMLAudioElement | null = null;
let started = false;

export function play(name: keyof typeof sounds): void {
  if (muted) return;
  try {
    const audio = new Audio(sounds[name]);
    audio.volume = name === 'ending' ? 0.5 : 0.35;
    void audio.play().catch(() => {});
  } catch {
    /* 音频播放失败不影响剧情 */
  }
}

export function startBgm(): void {
  if (started) return;
  started = true;
  try {
    bgm = new Audio(bgmUrl);
    bgm.loop = true;
    bgm.volume = muted ? 0 : 0.18;
    void bgm.play().catch(() => {});
  } catch {
    bgm = null;
  }
}

export function toggleMute(): boolean {
  muted = !muted;
  if (bgm) bgm.volume = muted ? 0 : 0.18;
  return muted;
}

export function isMuted(): boolean {
  return muted;
}
