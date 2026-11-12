"""合成项目音效与背景垫音。

不采样任何现成素材、不使用人声——纯振荡器算出来的波形，
所以没有授权问题，也不会把本体音色带进作品。
"""
from __future__ import annotations

import os
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "sfx")
RATE = 44100


def envelope(n: int, attack: float = 0.01, decay: float = 0.9) -> np.ndarray:
    a = max(1, int(attack * RATE))
    env = np.ones(n)
    env[:a] = np.linspace(0, 1, a)
    env[a:] = np.linspace(1, 0, n - a) ** (1 / max(decay, 0.01))
    return env


def tone(freq: float, dur: float, amp: float = 0.25, harm: float = 0.0) -> np.ndarray:
    t = np.arange(int(dur * RATE)) / RATE
    wave_ = np.sin(2 * np.pi * freq * t)
    if harm:
        wave_ = wave_ + harm * np.sin(2 * np.pi * freq * 2 * t)
    return (wave_ * envelope(len(t)) * amp).astype(np.float32)


def sweep(f0: float, f1: float, dur: float, amp: float = 0.2) -> np.ndarray:
    n = int(dur * RATE)
    t = np.arange(n) / RATE
    freq = np.linspace(f0, f1, n)
    phase = 2 * np.pi * np.cumsum(freq) / RATE
    return (np.sin(phase) * envelope(n, decay=0.6) * amp).astype(np.float32)


def noise(dur: float, amp: float = 0.15) -> np.ndarray:
    n = int(dur * RATE)
    rng = np.random.default_rng(7)
    raw = rng.normal(0, 1, n)
    # 一阶低通，去掉刺耳的高频
    smooth = np.convolve(raw, np.ones(24) / 24, mode="same")
    return (smooth * envelope(n, decay=0.5) * amp).astype(np.float32)


def save(name: str, data: np.ndarray, amp_norm: float = 0.6) -> None:
    os.makedirs(OUT, exist_ok=True)
    peak = float(np.max(np.abs(data))) or 1.0
    pcm = np.clip(data / peak * amp_norm, -1, 1)
    path = os.path.join(OUT, name)
    with wave.open(path, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes((pcm * 32767).astype("<i2").tobytes())
    print(f"[sfx] {name}  {os.path.getsize(path) // 1024}KB")


def make_click() -> None:
    save("sfx_click.wav", tone(1150, 0.06, harm=0.25), 0.35)


def make_page() -> None:
    save("sfx_page.wav", noise(0.16) + sweep(400, 900, 0.16, 0.1), 0.4)


def make_pass() -> None:
    first = tone(660, 0.09, harm=0.2)
    second = tone(880, 0.16, harm=0.2)
    save("sfx_pass.wav", np.concatenate([first, second]), 0.45)


def make_fail() -> None:
    save("sfx_fail.wav", tone(190, 0.22, harm=0.35), 0.4)


def make_ending() -> None:
    parts = [tone(f, 0.5, 0.22, harm=0.15) for f in (523.25, 659.25, 783.99, 1046.5)]
    gap = np.zeros(int(0.06 * RATE), dtype=np.float32)
    joined = []
    for part in parts:
        joined.extend([part, gap])
    save("sfx_ending.wav", np.concatenate(joined), 0.5)


def make_bgm(seconds: float = 48.0) -> None:
    n = int(seconds * RATE)
    t = np.arange(n) / RATE
    # 三个低音正弦叠一个缓慢起伏的 LFO，做成安静的垫音
    base = (
        0.5 * np.sin(2 * np.pi * 110 * t)
        + 0.32 * np.sin(2 * np.pi * 164.81 * t + 0.4)
        + 0.22 * np.sin(2 * np.pi * 220 * t + 1.1)
        + 0.10 * np.sin(2 * np.pi * 329.63 * t + 2.0)
    )
    lfo = 0.65 + 0.35 * np.sin(2 * np.pi * t / 12.0)
    fade = np.ones(n)
    edge = int(2.5 * RATE)
    fade[:edge] = np.linspace(0, 1, edge)
    fade[-edge:] = np.linspace(1, 0, edge)
    save("bgm_loop.wav", (base * lfo * fade).astype(np.float32), 0.12)


if __name__ == "__main__":
    make_click()
    make_page()
    make_pass()
    make_fail()
    make_ending()
    make_bgm()
    print("done")
