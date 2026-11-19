# -*- coding: utf-8 -*-
"""对比同一角色不同句子的基频中位数，判断音色是否串了。

用法: python tools/f0-check.py a3-55 a3-56 --role 苏桃
"""
import io
import json
import os
import subprocess
import sys
import wave

import numpy as np

MS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = os.path.join(MS, "assets", "voice")
FFMPEG = r"C:\Users\MIC lunchinm\Tools\ffmpeg\bin\ffmpeg.exe"


def load_pcm(path, sr=16000):
    proc = subprocess.run(
        [FFMPEG, "-v", "error", "-i", path, "-f", "wav", "-ar", str(sr), "-ac", "1", "-"],
        capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.decode("utf-8", "replace")[:200])
    wf = wave.open(io.BytesIO(proc.stdout))
    data = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).astype(np.float32)
    return data / 32768.0, wf.getframerate()


def f0_median(path):
    """逐帧自相关估基频，只统计有声帧。"""
    x, sr = load_pcm(path)
    frame, hop = int(0.04 * sr), int(0.02 * sr)
    lo, hi = int(sr / 400), int(sr / 70)   # 70–400 Hz
    vals = []
    for i in range(0, len(x) - frame, hop):
        seg = x[i:i + frame]
        if np.sqrt(np.mean(seg ** 2)) < 0.01:
            continue
        seg = seg - seg.mean()
        corr = np.correlate(seg, seg, mode="full")[frame - 1:]
        if corr[0] <= 0:
            continue
        corr = corr / corr[0]
        seg_range = corr[lo:hi]
        if len(seg_range) == 0:
            continue
        peak = int(np.argmax(seg_range)) + lo
        if corr[peak] < 0.3:
            continue
        vals.append(sr / peak)
    return float(np.median(vals)) if vals else 0.0


def role_samples(role, exclude=(), n=4):
    """取该角色若干句作为参照。"""
    out = []
    for act in (1, 2, 3, 4):
        p = os.path.join(MS, "content", f"act{act}.json")
        for node in json.load(io.open(p, encoding="utf-8")):
            if node.get("type") != "say" or node.get("speaker") != role:
                continue
            nid = node["id"]
            if nid in exclude:
                continue
            f = os.path.join(VOICE, nid + ".mp3")
            if os.path.exists(f):
                out.append((nid, f))
            if len(out) >= n:
                return out
    return out


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    role = None
    if "--role" in sys.argv:
        role = sys.argv[sys.argv.index("--role") + 1]
        args = [a for a in args if a != role]

    for nid in args:
        f = os.path.join(VOICE, nid + ".mp3")
        if not os.path.exists(f):
            print(f"{nid}: 文件不存在")
            continue
        v = f0_median(f)
        print(f"{nid}: F0 中位 {v:.1f} Hz")

    if role:
        print(f"\n--- {role} 的参照样本 ---")
        base = []
        for nid, f in role_samples(role, exclude=set(args)):
            v = f0_median(f)
            base.append(v)
            print(f"{nid}: F0 中位 {v:.1f} Hz")
        if base:
            med = float(np.median(base))
            print(f"\n{role} 参照中位: {med:.1f} Hz")
            for nid in args:
                f = os.path.join(VOICE, nid + ".mp3")
                if not os.path.exists(f):
                    continue
                v = f0_median(f)
                diff = abs(v - med) / med * 100
                flag = "一致" if diff < 12 else "偏差大，可能串音"
                print(f"  {nid}: {v:.1f} Hz，与参照差 {diff:.1f}% → {flag}")
