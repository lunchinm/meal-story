/**
 * 音效、旁白语音与背景垫音。
 *
 * 语音和音效分开两条通道：推进对话时语音会被打断，音效不会。
 * 浏览器不允许自动播放，所以 BGM 和语音都在第一次点击后才起。
 */
import clickUrl from '../assets/sfx/sfx_click.wav';
import pageUrl from '../assets/sfx/sfx_page.wav';
import passUrl from '../assets/sfx/sfx_pass.wav';
import failUrl from '../assets/sfx/sfx_fail.wav';
import endingUrl from '../assets/sfx/sfx_ending.wav';
import bgmUrl from '../assets/sfx/bgm_loop.mp3';
import { voices } from './assets';

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
let voice: HTMLAudioElement | null = null;

export function play(name: keyof typeof sounds): void {
  if (muted) return;
  try {
    const audio = new Audio(sounds[name]);
    audio.volume = name === 'ending' ? 0.5 : 0.35;
    void audio.play().catch(() => {});
  } catch {
    /* 播放失败不影响剧情 */
  }
}

/** 播一句对白语音，按节点 id 找音频；没有就静默 */
export function speak(nodeId: string): void {
  stopVoice();
  if (muted) return;
  const url = voices[nodeId];
  if (!url) return;
  try {
    voice = new Audio(url);
    voice.volume = 0.9;
    void voice.play().catch(() => {});
  } catch {
    voice = null;
  }
}

export function stopVoice(): void {
  if (!voice) return;
  try {
    voice.pause();
    voice.currentTime = 0;
  } catch {
    /* 忽略 */
  }
  voice = null;
}

export function startBgm(): void {
  if (started) return;
  started = true;
  try {
    bgm = new Audio(bgmUrl);
    bgm.loop = true;
    bgm.volume = muted ? 0 : 0.12;
    void bgm.play().catch(() => {});
  } catch {
    bgm = null;
  }
}

export function toggleMute(): boolean {
  muted = !muted;
  if (bgm) bgm.volume = muted ? 0 : 0.12;
  if (muted) stopVoice();
  return muted;
}

export function isMuted(): boolean {
  return muted;
}
