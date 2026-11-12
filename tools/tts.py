"""给每句对白配音：只用 instruction 描述音色，不做任何变调或后处理。

规矩（老大定的）：配音不允许变调，rubberband / asetrate / atempo 一概不用。
换音色只能换描述、换种子、重出。

产物：assets/voice/<节点id>.mp3
用法：python tools/tts.py [--force] [--only a1-04,a1-06]
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "voice")
CACHE = os.path.join(ROOT, "tools", "out", "tts-cache")
FFMPEG = r"C:\Users\MIC lunchinm\Tools\ffmpeg\bin\ffmpeg.exe"
API = "http://127.0.0.1:7860/v1/audio/speech"
CFG = 2.0

# 每个角色一套描述，定稿后不要改
VOICES = {
    "旁白": ("三十多岁的女性，声音温柔但偏低，语速慢，像纪录片解说", 42),
    "米粒": ("年轻的女生，声音偏高，像撒娇那样轻快，尾音上扬", 42),
    "周简": ("说话的是二十岁左右的男生，声音偏低，语速平缓，语气平静", 42),
    "许知夏": ("说话的是十八九岁的女生，声音软一点，语气轻松俏皮", 42),
    "苏桃": ("说话的是二十出头的女生，声音略沙哑带气声，语速中快，语气懒散俏皮", 42),
}


def synth(text: str, instruction: str, seed: int) -> bytes:
    boundary = "----tts"
    parts = []
    for name, value in (
        ("text", text),
        ("instruction", instruction),
        ("cfg_scale", str(CFG)),
        ("seed", str(seed)),
    ):
        parts.append(f"--{boundary}")
        parts.append(f'Content-Disposition: form-data; name="{name}"')
        parts.append("")
        parts.append(str(value))
    parts.append(f"--{boundary}--")
    parts.append("")
    body = "\r\n".join(parts).encode("utf-8")
    req = urllib.request.Request(
        API, data=body, headers={"content-type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        return resp.read()


def pcm_to_mp3(pcm: bytes, dest: str) -> None:
    wav_path = dest.replace(".mp3", ".tmp.wav")
    with wave.open(wav_path, "wb") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(24000)
        handle.writeframes(pcm)
    subprocess.run(
        [FFMPEG, "-y", "-loglevel", "error", "-i", wav_path, "-codec:a", "libmp3lame",
         "-b:a", "96k", "-ac", "1", dest],
        check=True,
    )
    os.remove(wav_path)


def main() -> int:
    force = "--force" in sys.argv
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))

    os.makedirs(OUT, exist_ok=True)
    os.makedirs(CACHE, exist_ok=True)

    nodes = []
    for n in (1, 2, 3, 4):
        nodes.extend(json.load(open(os.path.join(ROOT, "content", f"act{n}.json"), encoding="utf-8")))

    made = skipped = failed = 0
    started_all = time.time()
    for node in nodes:
        if node.get("type") != "say":
            continue
        text = (node.get("text") or "").strip()
        if not text:
            continue
        if only and node["id"] not in only:
            continue
        speaker = node.get("speaker") or "旁白"
        instruction, seed = VOICES.get(speaker, VOICES["旁白"])
        dest = os.path.join(OUT, f"{node['id']}.mp3")
        if os.path.exists(dest) and not force:
            skipped += 1
            continue
        key = hashlib.sha1(f"{text}|{instruction}|{seed}".encode("utf-8")).hexdigest()[:16]
        cached = os.path.join(CACHE, key + ".mp3")
        try:
            if os.path.exists(cached) and not force:
                shutil.copyfile(cached, dest)
            else:
                started = time.time()
                pcm = synth(text, instruction, seed)
                pcm_to_mp3(pcm, dest)
                shutil.copyfile(dest, cached)
                print(f"[tts] {node['id']:<6} {speaker:<4} {time.time() - started:5.1f}s", flush=True)
            made += 1
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"[fail] {node['id']}: {exc}", flush=True)

    total = time.time() - started_all
    print(f"完成 {made} 条（跳过 {skipped}，失败 {failed}），用时 {total / 60:.1f} 分钟", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
