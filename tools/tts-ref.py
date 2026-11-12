"""用“已定稿的角色样音”当参考，锁定每个角色的音色。

为什么这样做：只给文本 + 描述，模型每句的音色会飘（同一角色忽高忽低）。
拿这个角色已经定稿的一句当 ref_audio（零样本克隆），音色就固定住了。
参考音频本身也是模型合成的，不含任何真人录音。

产物：assets/voice/<节点id>.mp3（覆盖）
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.request
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "voice")
REF_DIR = os.path.join(ROOT, "tools", "voice-refs")
FFMPEG = r"C:\Users\MIC lunchinm\Tools\ffmpeg\bin\ffmpeg.exe"
API = "http://127.0.0.1:7860/v1/audio/speech"
CFG = 1.0
SEED = 42

# 角色 → 拿哪一句当参考（必须是这个角色已经定稿的句子）
REFS = {
    "旁白": "a2-05",
    "米粒": "a1-08",
    "周简": "a2-01",
    "许知夏": "a1-06",
    "苏桃": "a3-03",
}
HINTS = {
    "旁白": "语速偏慢，语气平稳",
    "米粒": "语速偏快，语气轻快",
    "周简": "语速平缓，语气平静",
    "许知夏": "吐字清楚，语气温和",
    "苏桃": "语速中快，语气懒散俏皮",
}


def load_nodes() -> list[dict]:
    nodes = []
    for n in (1, 2, 3, 4):
        nodes.extend(json.load(open(os.path.join(ROOT, "content", f"act{n}.json"), encoding="utf-8")))
    return nodes


def to_wav24(src: str, dest: str) -> None:
    subprocess.run(
        [FFMPEG, "-y", "-loglevel", "error", "-i", src, "-ar", "24000", "-ac", "1", dest],
        check=True,
    )


def synth_multipart(text: str, ref_bytes: bytes | None, ref_name: str, ref_text: str, hint: str) -> bytes:
    boundary = "----ref"
    parts: list[bytes] = []

    def field(name: str, value: str) -> None:
        parts.append(f"--{boundary}".encode())
        parts.append(f'Content-Disposition: form-data; name="{name}"'.encode())
        parts.append(b"")
        parts.append(value.encode("utf-8"))

    field("text", text)
    field("instruction", hint)
    field("cfg_scale", str(CFG))
    field("seed", str(SEED))
    if ref_bytes is not None:
        parts.append(f"--{boundary}".encode())
        parts.append(
            f'Content-Disposition: form-data; name="ref_audio"; filename="{ref_name}"'.encode()
        )
        parts.append(b"Content-Type: audio/wav")
        parts.append(b"")
        parts.append(ref_bytes)
        field("ref_text", ref_text)
    parts.append(f"--{boundary}--".encode())
    parts.append(b"")
    body = b"\r\n".join(parts)
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
    os.makedirs(REF_DIR, exist_ok=True)
    nodes = load_nodes()
    by_id = {n["id"]: n for n in nodes}

    refs: dict[str, tuple[bytes, str, str]] = {}
    for speaker, node_id in REFS.items():
        src = os.path.join(OUT, f"{node_id}.mp3")
        if not os.path.exists(src):
            print(f"[skip] {speaker}: 缺参考句 {node_id}")
            continue
        wav = os.path.join(REF_DIR, f"{speaker}.wav")
        to_wav24(src, wav)
        text = by_id[node_id]["text"]
        with open(wav, "rb") as handle:
            refs[speaker] = (handle.read(), f"{speaker}.wav", text)
        print(f"[ref] {speaker} ← {node_id}「{text[:12]}…」")

    started = time.time()
    made = failed = 0
    for node in nodes:
        if node.get("type") != "say":
            continue
        speaker = node.get("speaker") or "旁白"
        if speaker not in refs:
            continue
        ref_bytes, ref_name, ref_text = refs[speaker]
        dest = os.path.join(OUT, f"{node['id']}.mp3")
        try:
            t0 = time.time()
            pcm = synth_multipart(node["text"], ref_bytes, ref_name, ref_text, HINTS.get(speaker, ""))
            pcm_to_mp3(pcm, dest)
            made += 1
            print(f"[tts] {node['id']:<6} {speaker:<4} {time.time() - t0:5.1f}s", flush=True)
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"[fail] {node['id']}: {exc}", flush=True)

    print(f"完成 {made} 条（失败 {failed}），用时 {(time.time() - started) / 60:.1f} 分钟")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
