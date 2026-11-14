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
import bgmDefault from '../assets/sfx/bgm_loop.mp3';
import bgmChat from '../assets/sfx/bgm_chat.mp3';
import bgmCanteen from '../assets/sfx/bgm_canteen.mp3';
import bgmStore from '../assets/sfx/bgm_store.mp3';
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
    voice.volume = 1.0;
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

const BGM_TRACKS: Record<string, string> = {
  chat: bgmChat,
  canteen: bgmCanteen,
  store: bgmStore,
  class: bgmCanteen,
  title: bgmDefault,
  ending: bgmDefault,
};

let currentTrack = '';

/** 进哪一幕就换哪一段，同一段不重复起播 */
export function startBgm(scene = 'title'): void {
  const url = BGM_TRACKS[scene] ?? bgmDefault;
  if (bgm && currentTrack === url) {
    if (bgm.paused) void bgm.play().catch(() => {});
    return;
  }
  currentTrack = url;
  if (bgm) {
    try {
      bgm.pause();
    } catch {
      /* 忽略 */
    }
  }
  try {
    bgm = new Audio(url);
    bgm.loop = true;
    bgm.volume = muted ? 0 : 0.09;
    void bgm.play().catch(() => {});
  } catch {
    bgm = null;
  }
  started = true;
}

export function bgmStarted(): boolean {
  return started;
}

export function toggleMute(): boolean {
  muted = !muted;
  if (bgm) bgm.volume = muted ? 0 : 0.09;
  if (muted) stopVoice();
  return muted;
}

export function isMuted(): boolean {
  return muted;
}
