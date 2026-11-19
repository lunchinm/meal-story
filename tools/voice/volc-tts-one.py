# -*- coding: utf-8 -*-
"""单句试音：验证复刻出来的音色能不能合成，只跑一句。

用法: python tools/volc-tts-one.py [角色] [节点编号]
默认: 米粒 a1-29
"""
import base64
import glob
import io
import json
import os
import subprocess
import sys
import uuid
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, ".artifacts", "voice-cloud")
FFMPEG = 'ffmpeg'
FFPROBE = FFMPEG.replace("ffmpeg.exe", "ffprobe.exe")
API = "https://openspeech.bytedance.com/api/v3/tts/unidirectional"

# 控制台「我的音色」里复刻好的 speaker_id
SPEAKERS = {
    "米粒": "S_7ZsvZsE2",
    "许知夏": "S_JyPUZsE2",
    "苏桃": "S_5UEUZsE2",
    "罗师傅": "S_REKUZsE2",
    "陆燃": "S_zIZTZsE2",
    "周简": "S_dYCTZsE2",
}


def load_env():
    env = {}
    for line in io.open(os.path.join(ROOT, ".env"), encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


ENV = load_env()


def find_text(node_id):
    for f in sorted(glob.glob(os.path.join(ROOT, "content", "act*.json"))):
        for n in json.load(io.open(f, encoding="utf-8")):
            if n.get("id") == node_id:
                return n.get("speaker", ""), n.get("text", "")
    return "", ""


def synth(text, speaker):
    body = {
        "user": {"uid": "mealstory"},
        "namespace": "BidirectionalTTS",
        "req_params": {
            "text": text,
            "speaker": speaker,
            "audio_params": {"format": "mp3", "sample_rate": 24000},
        },
    }
    headers = {
        "Content-Type": "application/json",
        "X-Api-Key": ENV["VOLC_API_KEY"],
        "X-Api-App-Id": ENV["VOLC_APP_ID"],
        "X-Api-Resource-Id": "seed-tts-2.0",   # 合成接口必带，复刻接口反而不能带
        "X-Api-Request-Id": str(uuid.uuid4()),
    }
    req = urllib.request.Request(API, data=json.dumps(body).encode(), headers=headers, method="POST")
    chunks = []
    with urllib.request.urlopen(req, timeout=120) as resp:
        for raw in resp:
            line = raw.decode("utf-8", "replace").strip()
            if not line:
                continue
            obj = json.loads(line)
            if obj.get("data"):
                chunks.append(base64.b64decode(obj["data"]))
            if obj.get("code") not in (None, 0, 20000000):
                raise RuntimeError(f"code={obj.get('code')} message={obj.get('message')}")
    return b"".join(chunks)


def save(raw, dest):
    tmp = dest + ".tmp"
    io.open(tmp, "wb").write(raw)
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", tmp,
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-codec:a", "libmp3lame", "-b:a", "64k", "-ac", "1", "-ar", "24000", dest],
                   check=True)
    os.remove(tmp)
    return float(subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", dest], capture_output=True, text=True).stdout.strip())


role = sys.argv[1] if len(sys.argv) > 1 else "米粒"
nid = sys.argv[2] if len(sys.argv) > 2 else "a1-29"
spk_line, text = find_text(nid)
print(f"角色={role} speaker={SPEAKERS.get(role)} 节点={nid} 剧本角色={spk_line}")
print(f"台词：{text}")

os.makedirs(OUT, exist_ok=True)
dest = os.path.join(OUT, f"试音-{role}-{nid}.mp3")
try:
    raw = synth(text, SPEAKERS[role])
except urllib.error.HTTPError as e:
    print("FAIL", e.code, e.read().decode("utf-8", "replace")[:400])
    raise SystemExit(1)
except Exception as e:  # noqa: BLE001
    print("FAIL", e)
    raise SystemExit(1)

d = save(raw, dest)
chars = len([c for c in text if c.strip()])
print(f"OK  {dest}")
print(f"时长 {d:.2f}s，{chars} 字 → {chars/d:.1f} 字/秒（正常 4–6）")
