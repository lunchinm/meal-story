# -*- coding: utf-8 -*-
"""试配：用本次审定的 7 条新参考样音，在本地 Breeze 上重配一小批台词。

目的：不动云端账号，先验证「新参考样音 + 64kbps 一次编码」到底比现有成品好多少。
选句优先取之前波形体检挑出来的 43 条可疑句，能直接做前后对比。
"""
import glob
import io
import json
import os
import subprocess
import time
import urllib.error
import urllib.request
import wave

MS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FINAL = os.path.join(MS, ".artifacts", "voice-final")
OUT = os.path.join(MS, ".artifacts", "voice-trial")
FFMPEG = 'ffmpeg'
FFPROBE = FFMPEG.replace("ffmpeg.exe", "ffprobe.exe")
API = "http://127.0.0.1:7860/v1/audio/speech/batch"
BATCH = 3
PER_SPK = 3

# 参考样音的台词必须与音频内容一致
T_MILI = "菜基本一样，就是西兰花没有照片里站得那么整齐。我可以一边吃，一边保持怀疑。要是真能承包，我以后就不用每天在窗口前思考人生了。你看！我就说——"
T_XUZHI = "人体免疫功能有很多环节，没有一个简单数字能概括它。图里这个满，目前连怎么算都没说。我们还不知道份量，也不知道你早饭、晚饭吃什么。这一张照片提供的信息有限。"
T_SU = "你们研究得怎么样？我这边有人问能不能跟着买七天。主要是后者，说最近大家都在感冒，想买来预防。这份菜看起来挺上镜。别动，拍一张。"
T_NARR = "目前只有转发截图，效果承诺的来源尚未查明。判断一日饮食，需要结合各餐、食物种类与数量。米粒希望吃饭省时，建议需要结合课表和购买条件。"
T_LUO_F = "这周配的，点起来快一点，窗口也能少堵一会儿。菜是我们的。后面这几句话，我也是第一次见。七天以后，这个窗口轮换菜单，新菜牌都写好了。你们要看菜品和份量，窗口有实物。"
T_LU = "到楼下了。刚才帮人搬了器材，我提前了十五分钟。这次是真的。有鸡肉有鸡蛋，可以。我下午还有课，先过去占位置。"
T_ZHOU = "你的十分钟已经二十分钟了。价格被裁掉了，这张图没有考虑我的感受。先记下来，等会儿问。以后评价套餐，我申请增加一个价格栏。我负责记价格。"

REFS = {
    "米粒": ("01-米粒.wav", T_MILI, "语速偏快，语气轻快"),
    "许知夏": ("02-许知夏.wav", T_XUZHI, "吐字清楚，语气温和"),
    "苏桃": ("03-苏桃.wav", T_SU, "语速中快，语气懒散俏皮"),
    "旁白": ("04-旁白.wav", T_NARR, "语速偏慢，语气平稳"),
    "罗师傅": ("05-罗师傅.wav", T_LUO_F, "语速偏慢，语气和善"),
    "陆燃": ("06-陆燃.wav", T_LU, "语速稍快，语气干脆"),
    "周简": ("07-周简.wav", T_ZHOU, "语速平缓，语气平静"),
}


def load_lines():
    lines = {}
    for f in sorted(glob.glob(os.path.join(MS, "content", "act*.json"))):
        for n in json.load(io.open(f, encoding="utf-8")):
            if n.get("type") != "say":
                continue
            spk = n.get("speaker", "旁白")
            if spk == "你" or n.get("channel") == "chat":
                continue
            lines[n["id"]] = (spk, n.get("text", ""))
    return lines


def pick(lines):
    redo = []
    rp = os.path.join(MS, ".artifacts", "voice-qc", "redo.txt")
    if os.path.exists(rp):
        redo = [x.strip() for x in io.open(rp, encoding="utf-8") if x.strip()]
    chosen = {}
    for i in redo:                       # 先放可疑句
        if i in lines:
            spk = lines[i][0]
            chosen.setdefault(spk, [])
            if len(chosen[spk]) < PER_SPK:
                chosen[spk].append(i)
    for i, (spk, _) in lines.items():    # 不够的用普通句补
        if spk not in REFS:
            continue
        chosen.setdefault(spk, [])
        if len(chosen[spk]) < PER_SPK and i not in chosen[spk]:
            chosen[spk].append(i)
    return {k: v[:PER_SPK] for k, v in chosen.items() if k in REFS}


def post_batch(texts, instr, ref_bytes, ref_text):
    b = "----b"
    parts = []

    def field(n, v):
        parts.append(f"--{b}")
        parts.append(f'Content-Disposition: form-data; name="{n}"')
        parts.append("")
        parts.append(str(v))

    field("texts", json.dumps(texts, ensure_ascii=False))
    field("instruction", instr)
    field("cfg_scale", "1.0")
    field("seed", "42")
    parts.append(f"--{b}")
    parts.append(b'Content-Disposition: form-data; name="ref_audio"; filename="ref.wav"')
    parts.append(b"Content-Type: audio/wav")
    parts.append(b"")
    parts.append(ref_bytes)
    field("ref_text", ref_text)
    parts.append(f"--{b}--")
    parts.append("")
    body = b"\r\n".join(p.encode("utf-8") if isinstance(p, str) else p for p in parts)
    req = urllib.request.Request(API, data=body,
                                 headers={"content-type": f"multipart/form-data; boundary={b}"})
    for a in range(4):
        try:
            with urllib.request.urlopen(req, timeout=900) as resp:
                return resp.read(), [int(x) for x in resp.headers.get("X-Segment-Bytes", "").split(",") if x.strip()]
        except urllib.error.HTTPError as exc:
            if exc.code != 409:
                raise
            time.sleep(15 + a * 15)
    raise RuntimeError("busy")


def save_mp3(pcm, dest):
    tmp = dest.replace(".mp3", ".raw.wav")
    with wave.open(tmp, "wb") as h:
        h.setnchannels(1)
        h.setsampwidth(2)
        h.setframerate(24000)
        h.writeframes(pcm)
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-i", tmp,
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
                    "-codec:a", "libmp3lame", "-b:a", "64k", "-ac", "1", "-ar", "24000", dest],
                   check=True)
    os.remove(tmp)


def dur(p):
    return float(subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip())


os.makedirs(OUT, exist_ok=True)
lines = load_lines()
plan = pick(lines)
rows = []
for spk, ids in plan.items():
    fname, ref_text, instr = REFS[spk]
    ref_path = os.path.join(FINAL, fname)
    if not os.path.exists(ref_path):
        print(f"[skip] {spk} 缺参考样音 {fname}", flush=True)
        continue
    ref = io.open(ref_path, "rb").read()
    for s in range(0, len(ids), BATCH):
        chunk = ids[s:s + BATCH]
        texts = [lines[i][1] for i in chunk]
        t0 = time.time()
        try:
            pcm, segs = post_batch(texts, instr, ref, ref_text)
        except Exception as e:  # noqa: BLE001
            print(f"[fail] {spk} {chunk}: {e}", flush=True)
            continue
        off = 0
        for nid, size in zip(chunk, segs):
            p = os.path.join(OUT, f"{nid}.mp3")
            save_mp3(pcm[off:off + size], p)
            off += size
            chars = len(lines[nid][1])
            rows.append(dict(id=nid, spk=spk, chars=chars, sec=round(dur(p), 2), text=lines[nid][1]))
        print(f"[ok] {spk} {len(chunk)}句 {time.time()-t0:.0f}s", flush=True)

io.open(os.path.join(OUT, "_trial.json"), "w", encoding="utf-8").write(
    json.dumps(rows, ensure_ascii=False, indent=1))
print(f"\n完成 {len(rows)} 条 → {OUT}")
for r in rows:
    cps = r["chars"] / r["sec"] if r["sec"] else 0
    print(f"{r['id']:<9} {r['spk']:<4} {r['chars']:>2}字 {r['sec']:>5.2f}s {cps:>4.1f}字/秒")
