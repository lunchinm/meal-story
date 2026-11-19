# -*- coding: utf-8 -*-
"""按审核结果补做两条：苏桃（用原声线重生成）、陆燃候选B（加长到 10 秒以上）。"""
import io
import os
import subprocess
import time
import urllib.error
import urllib.request
import wave

MS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF_DIR = os.path.join(MS, "assets", "voice", "reference")
OUT = os.path.join(MS, ".artifacts", "voice-review")
FFMPEG = 'ffmpeg'
FFPROBE = FFMPEG.replace("ffmpeg.exe", "ffprobe.exe")
API = "http://127.0.0.1:7860/v1/audio/speech"

# 苏桃旧样音的真实台词（用户提供），有了它才能合法带 ref 复刻原声线
SU_REF_TEXT = "所以整瓶20克糖，够我一天的量了？那我拍的那张图，怕是也得改。"
T_SU = "你们研究得怎么样？我这边有人问能不能跟着买七天。主要是后者，说最近大家都在感冒，想买来预防。这份菜看起来挺上镜。别动，拍一张。"
T_LU = "到楼下了。刚才帮人搬了器材，我提前了十五分钟。这次是真的。有鸡肉有鸡蛋，可以。我下午还有课，先过去占位置。你们慢慢挑，别纠结太久。"

JOBS = [
    dict(name="03-苏桃-原声线", text=T_SU, instr="语速中快，语气懒散俏皮",
         ref="苏桃.wav", ref_text=SU_REF_TEXT),
    dict(name="09-陆燃-候选B-清亮少年", text=T_LU, instr="十八岁男生，声音清亮偏高，语速稍快，带少年气",
         ref=None, ref_text=None),
]


def post(text, instr, ref_path=None, ref_text=None, seed=42):
    b = "----b"
    parts = []

    def field(n, v):
        parts.append(f"--{b}")
        parts.append(f'Content-Disposition: form-data; name="{n}"')
        parts.append("")
        parts.append(str(v))

    field("text", text)
    field("instruction", instr)
    field("cfg_scale", "1.0")
    field("seed", str(seed))
    if ref_path:
        parts.append(f"--{b}")
        parts.append(b'Content-Disposition: form-data; name="ref_audio"; filename="ref.wav"')
        parts.append(b"Content-Type: audio/wav")
        parts.append(b"")
        parts.append(io.open(ref_path, "rb").read())
        field("ref_text", ref_text)
    parts.append(f"--{b}--")
    parts.append("")
    body = b"\r\n".join(p.encode("utf-8") if isinstance(p, str) else p for p in parts)
    req = urllib.request.Request(API, data=body,
                                 headers={"content-type": f"multipart/form-data; boundary={b}"})
    for a in range(4):
        try:
            with urllib.request.urlopen(req, timeout=900) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code != 409:
                raise
            time.sleep(15 + a * 15)
    raise RuntimeError("busy")


def save(pcm, dest):
    tmp = dest.replace(".wav", ".raw.wav")
    with wave.open(tmp, "wb") as h:
        h.setnchannels(1)
        h.setsampwidth(2)
        h.setframerate(24000)
        h.writeframes(pcm)
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", tmp,
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", dest], check=True)
    os.remove(tmp)


def dur(p):
    return float(subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip())


for j in JOBS:
    dest = os.path.join(OUT, j["name"] + ".wav")
    t0 = time.time()
    ref = os.path.join(REF_DIR, j["ref"]) if j["ref"] else None
    try:
        pcm = post(j["text"], j["instr"], ref, j["ref_text"])
    except Exception as e:  # noqa: BLE001
        print(f"[fail] {j['name']}: {e}", flush=True)
        continue
    save(pcm, dest)
    d = dur(dest)
    ok = "✔" if 10 <= d <= 30 else "⚠"
    print(f"[ok] {j['name']} {d:.1f}s {time.time()-t0:.0f}s {ok}", flush=True)
