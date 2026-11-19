# -*- coding: utf-8 -*-
"""用火山云端 TTS 试配几条：验证质量，同时验证整条链路。

鉴权（已实测可用）：
  POST https://openspeech.bytedance.com/api/v3/tts/unidirectional
  X-Api-Key: <控制台 API Key>
  X-Api-App-Id: <APP ID>
  X-Api-Resource-Id: seed-tts-2.0
  X-Api-Request-Id: <uuid>
返回是 NDJSON 流，每行一个 JSON，音频在 "data"（base64），按序拼接即为完整音频。
"""
import base64
import io
import json
import os
import subprocess
import uuid
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, ".artifacts", "voice-cloud")
FFMPEG = r"C:\Users\MIC lunchinm\Tools\ffmpeg\bin\ffmpeg.exe"
FFPROBE = FFMPEG.replace("ffmpeg.exe", "ffprobe.exe")
API = "https://openspeech.bytedance.com/api/v3/tts/unidirectional"


def load_env():
    env = {}
    for line in io.open(os.path.join(ROOT, ".env"), encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


ENV = load_env()

# 台词一律按节点编号从剧本里取，绝不手抄（上次手抄抄错了两条）
def load_lines():
    import glob
    out = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "content", "act*.json"))):
        for n in json.load(io.open(f, encoding="utf-8")):
            if n.get("type") == "say" and n.get("id"):
                out[n["id"]] = (n.get("speaker", ""), n.get("text", ""))
    return out


ALL = load_lines()
# 之前波形体检挑出来的可疑句，直接做前后对比
LINE_IDS = ["a1-47", "a3-53", "a4-53"]
LINES = [(i, ALL[i][1]) for i in LINE_IDS if i in ALL]

# 官方音色（先验证可用性，不可用会打印错误）
VOICES = [
    ("Vivi2.0", "zh_female_vv_uranus_bigtts"),
]


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
        "X-Api-Resource-Id": "seed-tts-2.0",
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


def to_mp3(raw, dest):
    tmp = dest + ".tmp"
    io.open(tmp, "wb").write(raw)
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", tmp,
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-codec:a", "libmp3lame", "-b:a", "64k", "-ac", "1", "-ar", "24000", dest],
                   check=True)
    os.remove(tmp)


def dur(p):
    return float(subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip())


os.makedirs(OUT, exist_ok=True)
chars = 0
for tag, spk in VOICES:
    for nid, text in LINES:
        dest = os.path.join(OUT, f"{nid}-{tag}.mp3")
        try:
            raw = synth(text, spk)
        except urllib.error.HTTPError as e:
            print(f"[fail] {nid} {tag}: HTTP {e.code} {e.read().decode('utf-8','replace')[:200]}")
            continue
        except Exception as e:  # noqa: BLE001
            print(f"[fail] {nid} {tag}: {e}")
            continue
        to_mp3(raw, dest)
        chars += len(text)
        print(f"[ok] {nid} {tag}  {len(text)}字 {dur(dest):.2f}s  {len(raw)//1024}KB原始")
print(f"\n共合成 {chars} 字（免费额度 20000 字，消耗 {chars/20000*100:.2f}%）")
