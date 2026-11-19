# -*- coding: utf-8 -*-
"""陆燃候选B 加长版：以用户选定的 9.76s 原样为参考音色，保住同一副嗓子。

教训：纯文字生成时换台词就等于换声音，seed 相同也没用；
      要加长必须先有 ref_audio 锁住音色。
"""
import io
import os
import subprocess
import time
import urllib.error
import urllib.request
import wave

MS = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story"
REF = os.path.join(MS, ".artifacts", "voice-review", "_ref", "陆燃-B-原始.wav")
OUT = os.path.join(MS, ".artifacts", "voice-final", "06-陆燃-加长版.wav")
FFMPEG = r"C:\Users\MIC lunchinm\Tools\ffmpeg\bin\ffmpeg.exe"
FFPROBE = FFMPEG.replace("ffmpeg.exe", "ffprobe.exe")
API = "http://127.0.0.1:7860/v1/audio/speech"

# 参考音色里的真实台词（原始 9.76s 那条生成时用的文本）
REF_TEXT = "到楼下了。刚才帮人搬了器材，我提前了十五分钟。这次是真的。有鸡肉有鸡蛋，可以。我下午还有课，先过去占位置。"
# 加长台词：比原台词多两句，目标 12-15 秒
TEXT = "到楼下了。刚才帮人搬了器材，我提前了十五分钟。这次是真的。有鸡肉有鸡蛋，可以。我下午还有课，先过去占位置。你们慢慢挑，别纠结太久。"
INSTR = "十八岁男生，声音清亮偏高，语速稍快，带少年气"


def post(text, ref_path, ref_text):
    b = "----b"
    parts = []

    def field(n, v):
        parts.append(f"--{b}")
        parts.append(f'Content-Disposition: form-data; name="{n}"')
        parts.append("")
        parts.append(str(v))

    field("text", text)
    field("instruction", INSTR)
    field("cfg_scale", "1.0")
    field("seed", "42")
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


t0 = time.time()
pcm = post(TEXT, REF, REF_TEXT)
tmp = OUT.replace(".wav", ".raw.wav")
with wave.open(tmp, "wb") as h:
    h.setnchannels(1)
    h.setsampwidth(2)
    h.setframerate(24000)
    h.writeframes(pcm)
subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", tmp,
                "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", OUT], check=True)
os.remove(tmp)
d = float(subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", OUT], capture_output=True, text=True).stdout.strip())
print(f"[ok] 06-陆燃-加长版 {d:.1f}s {time.time()-t0:.0f}s")
