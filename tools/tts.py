"""给每句对白合成语音。

走本机 TTS 适配器（127.0.0.1:9880），按说话人做轻微变调区分角色，
再用 ffmpeg 转成 mp3 存到 assets/voice/<节点id>.mp3。

用法：
  python tools/tts.py            # 只补缺的
  python tools/tts.py --force    # 全部重做
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "voice")
CACHE = os.path.join(ROOT, "tools", "out", "tts-cache")
TTS = "http://127.0.0.1:9880/tts"
FFMPEG = r"C:\Users\MIC lunchinm\Tools\ffmpeg\bin\ffmpeg.exe"

# 音高系数：>1 更细更高，<1 更低沉；时长用 atempo 拉回来
VOICE = {
    "米粒": (1.07, "语速稍快，语气活泼"),
    "周简": (0.93, "语速稍慢，语气平静"),
    "许知夏": (0.99, "吐字清楚，语气耐心"),
    "苏桃": (1.04, "语气轻快，尾音上扬"),
    "旁白": (0.96, "语速稍慢，像在讲一件家常事"),
}


def tts_wav(text: str, instruction: str) -> bytes:
    body = json.dumps({"text": text, "instruction": instruction}).encode()
    req = urllib.request.Request(TTS, data=body, headers={"content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=240) as resp:
        return resp.read()


def to_mp3(wav_path: str, mp3_path: str, pitch: float) -> None:
    if abs(pitch - 1.0) < 0.01:
        af = "anull"
    else:
        rate = int(24000 * pitch)
        af = f"asetrate={rate},aresample=24000,atempo={1 / pitch:.4f},volume=1.0"
    subprocess.run(
        [FFMPEG, "-y", "-loglevel", "error", "-i", wav_path, "-af", af,
         "-codec:a", "libmp3lame", "-b:a", "48k", "-ac", "1", mp3_path],
        check=True,
    )


def main() -> int:
    force = "--force" in sys.argv
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(CACHE, exist_ok=True)

    acts = []
    for n in (1, 2, 3, 4):
        path = os.path.join(ROOT, "content", f"act{n}.json")
        acts.extend(json.load(open(path, encoding="utf-8")))

    made = 0
    skipped = 0
    for node in acts:
        if node.get("type") != "say":
            continue
        if only and node["id"] not in only:
            continue
        text = (node.get("text") or "").strip()
        if not text:
            continue
        speaker = node.get("speaker") or "旁白"
        pitch, tip = VOICE.get(speaker, VOICE["旁白"])
        dest = os.path.join(OUT, f"{node['id']}.mp3")
        if os.path.exists(dest) and not force:
            skipped += 1
            continue
        key = hashlib.sha1((text + speaker + tip).encode("utf-8")).hexdigest()[:16]
        wav_path = os.path.join(CACHE, key + ".wav")
        try:
            if not os.path.exists(wav_path) or force:
                started = time.time()
                data = tts_wav(text, tip)
                with open(wav_path, "wb") as fh:
                    fh.write(data)
                print(f"[tts] {node['id']} {speaker} {time.time() - started:.1f}s")
            to_mp3(wav_path, dest, pitch)
            made += 1
        except (urllib.error.URLError, subprocess.CalledProcessError, TimeoutError) as exc:
            print(f"[fail] {node['id']}: {exc}")

    print(f"生成 {made} 条，跳过 {skipped} 条")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
