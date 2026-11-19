# -*- coding: utf-8 -*-
"""探测豆包语音新版 API Key 的调用方式：只打一次请求看报错，不做批量。

先用官方音色打通鉴权，再换成我们复刻的音色。
"""
import base64
import io
import json
import os
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_env():
    env = {}
    p = os.path.join(ROOT, ".env")
    if os.path.exists(p):
        for line in io.open(p, encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


ENV = load_env()
KEY = ENV.get("VOLC_API_KEY", "")
APPID = ENV.get("VOLC_APP_ID", "")

BODY = {
    "user": {"uid": "mealstory"},
    "namespace": "BidirectionalTTS",
    "req_params": {
        "text": "你好，这是一次接口连通性测试。",
        "speaker": "zh_female_vv_uranus_bigtts",
        "audio_params": {"format": "mp3", "sample_rate": 24000},
    },
}

VARIANTS = [
    ("bearer+resource",
     {"Authorization": f"Bearer;{KEY}", "X-Api-Resource-Id": "seed-tts-2.0"}),
    ("bearer+appid",
     {"Authorization": f"Bearer;{KEY}", "X-Api-App-Id": APPID,
      "X-Api-Resource-Id": "seed-tts-2.0"}),
    ("apikey-header",
     {"X-Api-Key": KEY, "X-Api-App-Id": APPID, "X-Api-Resource-Id": "seed-tts-2.0"}),
]

URL = "https://openspeech.bytedance.com/api/v3/tts/unidirectional"

for name, headers in VARIANTS:
    h = {"Content-Type": "application/json"}
    h.update(headers)
    req = urllib.request.Request(URL, data=json.dumps(BODY).encode(), headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            print(f"[{name}] HTTP {r.status} bytes={len(raw)}")
            # 流式 NDJSON，取第一个 data 段看有没有音频
            txt = raw.decode("utf-8", "replace")
            for line in txt.splitlines():
                if not line.strip():
                    continue
                obj = json.loads(line)
                if "data" in obj and obj["data"]:
                    audio = base64.b64decode(obj["data"])
                    out = os.path.join(ROOT, ".artifacts", "voice-cloud", f"probe-{name}.mp3")
                    os.makedirs(os.path.dirname(out), exist_ok=True)
                    io.open(out, "wb").write(audio)
                    print(f"   音频 {len(audio)} 字节 → {out}")
                    break
            else:
                print("   " + txt[:400])
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        print(f"[{name}] HTTP {e.code} {body[:300]}")
    except Exception as e:  # noqa: BLE001
        print(f"[{name}] ERR {e}")
