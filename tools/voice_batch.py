"""批量出候选音色：只用 instruction，不做任何变调或后处理。

规矩：配音不允许变调（老大明确要求）。所以这里只调用模型、只转码成 mp3，
不加 rubberband / asetrate / atempo。听感完全来自模型本身。

用法：
  python tools/voice_batch.py jobs.json      # {"名字": "声音描述", ...}
  python tools/voice_batch.py jobs.json --cfg 2.0
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FFMPEG = r"C:\Users\MIC lunchinm\Tools\ffmpeg\bin\ffmpeg.exe"
API = "http://127.0.0.1:7860/v1/audio/speech"


def synth(text: str, instruction: str, cfg: float = 2.0, seed: int = 42) -> bytes:
    boundary = "----voice"
    parts = []
    for name, value in (
        ("text", text),
        ("instruction", instruction),
        ("cfg_scale", str(cfg)),
        ("seed", str(seed)),
    ):
        parts.append(f"--{boundary}")
        parts.append(f'Content-Disposition: form-data; name="{name}"')
        parts.append("")
        parts.append(str(value))
    parts.append(f"--{boundary}--")
    parts.append("")
    body = "\r\n".join(parts).encode("utf-8")
    import urllib.request

    req = urllib.request.Request(
        API, data=body, headers={"content-type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        return resp.read()


def f0(path: str) -> float:
    with wave.open(path, "rb") as handle:
        rate = handle.getframerate()
        data = np.frombuffer(handle.readframes(handle.getnframes()), dtype="<i2").astype(np.float32)
    win, hop = int(rate * 0.04), int(rate * 0.02)
    values = []
    for i in range(0, len(data) - win, hop):
        seg = data[i:i + win]
        seg = seg - seg.mean()
        if np.sqrt((seg ** 2).mean()) < 300:
            continue
        corr = np.correlate(seg, seg, mode="full")[len(seg) - 1:]
        corr /= corr[0] + 1e-9
        lo, hi = int(rate / 400), int(rate / 60)
        if hi >= len(corr):
            continue
        lag = int(np.argmax(corr[lo:hi]) + lo)
        if corr[lag] < 0.3:
            continue
        values.append(rate / lag)
    return float(np.median(values)) if values else 0.0


def main() -> int:
    job_path = sys.argv[1]
    cfg = 2.0
    if "--cfg" in sys.argv:
        cfg = float(sys.argv[sys.argv.index("--cfg") + 1])
    jobs = json.load(open(job_path, encoding="utf-8"))
    out_dir = os.path.join(ROOT, "tools", "out", "voice-cand")
    os.makedirs(out_dir, exist_ok=True)
    for name, spec in jobs.items():
        instruction, line, seed = spec if isinstance(spec, list) else (spec, "明天开始，我午饭要加一份青菜。", 42)
        pcm = synth(line, instruction, cfg, seed)
        wav = os.path.join(out_dir, f"{name}.wav")
        mp3 = os.path.join(out_dir, f"候选{name}.mp3")
        with wave.open(wav, "wb") as handle:
            handle.setnchannels(1)
            handle.setsampwidth(2)
            handle.setframerate(24000)
            handle.writeframes(pcm)
        # 只转码，不加任何滤镜
        subprocess.run(
            [FFMPEG, "-y", "-loglevel", "error", "-i", wav, "-codec:a", "libmp3lame",
             "-b:a", "96k", "-ac", "1", mp3],
            check=True,
        )
        print(f"[ok] {name}  f0={f0(wav):.0f}Hz  {pcm.__len__() * 2 // 1024}KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
