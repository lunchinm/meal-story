# -*- coding: utf-8 -*-
"""生成声音复刻用的长样音（10-30 秒），放到 .artifacts/voice-review 供人工审核。

两类：
  keep       沿用现有音色 —— 必须带 ref_audio 保住音色特征
  candidate  换音色候选 —— 只用文字描述，生成全新的声音

规矩：单说话人、无杂音、无混响；只做整体响度归一，不做变调。
"""
import io
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
import wave

MS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF_DIR = os.path.join(MS, "assets", "voice", "reference")
OUT = os.path.join(MS, ".artifacts", "voice-review")
FFMPEG = 'ffmpeg'
API = "http://127.0.0.1:7860/v1/audio/speech"

# 现有参考样音当初是用这句生成的，短样音（<=4s）按此对齐 ref_text
LINE = "明天开始，我午饭要加一份青菜。"

# ---- 台词：全部取自剧本原句，保证念得准、也顺便验证多音字 ----
T_MILI = "菜基本一样，就是西兰花没有照片里站得那么整齐。我可以一边吃，一边保持怀疑。要是真能承包，我以后就不用每天在窗口前思考人生了。你看！我就说——"
T_XUZHI = "人体免疫功能有很多环节，没有一个简单数字能概括它。图里这个满，目前连怎么算都没说。我们还不知道份量，也不知道你早饭、晚饭吃什么。这一张照片提供的信息有限。"
T_SU = "你们研究得怎么样？我这边有人问能不能跟着买七天。主要是后者，说最近大家都在感冒，想买来预防。这份菜看起来挺上镜。别动，拍一张。"
T_ZHOU = "你的十分钟已经二十分钟了。价格被裁掉了，这张图没有考虑我的感受。先记下来，等会儿问。以后评价套餐，我申请增加一个价格栏。我负责记价格。"
T_LU = "到楼下了。刚才帮人搬了器材，我提前了十五分钟。这次是真的。有鸡肉有鸡蛋，可以。我下午还有课，先过去占位置。"
T_LUO = "这周配的，点起来快一点，窗口也能少堵一会儿。菜是我们的。后面这几句话，我也是第一次见。七天以后，这个窗口轮换菜单，新菜牌都写好了。图片从哪里来的，我得回去问问。"
T_NARR = "目前只有转发截图，效果承诺的来源尚未查明。判断一日饮食，需要结合各餐、食物种类与数量。米粒希望吃饭省时，建议需要结合课表和购买条件。"
T_LUO_F = "这周配的，点起来快一点，窗口也能少堵一会儿。菜是我们的。后面这几句话，我也是第一次见。七天以后，这个窗口轮换菜单，新菜牌都写好了。你们要看菜品和份量，窗口有实物。"

CLIPS = [
    # --- 保留音色：带 ref，保住现有声线 ---
    dict(name="01-米粒-保留", role="米粒", kind="keep", text=T_MILI, ref="米粒.wav",
         instr="语速偏快，语气轻快", note="少女，132 句"),
    dict(name="02-许知夏-保留", role="许知夏", kind="keep", text=T_XUZHI, ref="许知夏.wav",
         instr="吐字清楚，语气温和", note="女主式角色，109 句"),
    # 苏桃/旁白的旧样音没有配套文本，服务端要求 ref_audio 与 ref_text 成对，只能按人物描述重生成近似音色
    dict(name="03-苏桃-重定", role="苏桃", kind="candidate", text=T_SU, ref=None,
         instr="二十岁上下的女性，声音偏亮，语速中快，语气懒散俏皮，带笑意", note="74 句"),
    dict(name="04-旁白-重定", role="旁白", kind="candidate", text=T_NARR, ref=None,
         instr="成年男性旁白，声音沉稳中性，语速偏慢，语气平稳克制，不带情绪", note="叙述，4 句"),

    # --- 罗师傅：原作男性，现已改为女性，需重新定音色 ---
    dict(name="05-罗师傅-候选A-食堂阿姨", role="罗师傅(女)", kind="candidate", text=T_LUO_F, ref=None,
         instr="五十岁上下的女性，声音偏厚，语速慢，语气和善", note="经典食堂阿姨"),
    dict(name="06-罗师傅-候选B-窗口主管", role="罗师傅(女)", kind="candidate", text=T_LUO_F, ref=None,
         instr="四十多岁的女性，嗓音清亮，语速中快，说话干脆利落", note="干练主管"),
    dict(name="07-罗师傅-候选C-热心大姐", role="罗师傅(女)", kind="candidate", text=T_LUO_F, ref=None,
         instr="五十多岁的女性，声音略带沙哑，语速慢，带笑腔，热心", note="市井热心"),

    # --- 陆燃：男角色换音色候选（现为声音偏低、干脆）---
    dict(name="08-陆燃-候选A-低平干脆", role="陆燃", kind="candidate", text=T_LU, ref=None,
         instr="十八岁男生，声音偏低，语速平稳，说话干脆", note="接近现用音色"),
    dict(name="09-陆燃-候选B-清亮少年", role="陆燃", kind="candidate", text=T_LU, ref=None,
         instr="十八岁男生，声音清亮偏高，语速稍快，带少年气", note="更学生气"),
    dict(name="10-陆燃-候选C-低沉少言", role="陆燃", kind="candidate", text=T_LU, ref=None,
         instr="二十岁男生，声音低沉，语速慢，话少但踏实", note="更沉稳"),

    # --- 周简：男角色换音色候选（现为语速平缓、平静）---
    dict(name="11-周简-候选A-清瘦克制", role="周简", kind="candidate", text=T_ZHOU, ref=None,
         instr="十九岁男生，声音清瘦，语速平缓，语气平静克制", note="接近现用音色"),
    dict(name="12-周简-候选B-务实偏低", role="周简", kind="candidate", text=T_ZHOU, ref=None,
         instr="二十岁男生，声音偏低，语速中快，务实", note="更利落"),
    dict(name="13-周简-候选C-温和一本正经", role="周简", kind="candidate", text=T_ZHOU, ref=None,
         instr="十九岁男生，声音温和偏亮，语速平稳，一本正经", note="书卷气"),
]


def post(text, instr, ref_path=None, ref_text=None, seed=42):
    boundary = "----b"
    parts = []

    def field(name, value):
        parts.append(f"--{boundary}")
        parts.append(f'Content-Disposition: form-data; name="{name}"')
        parts.append("")
        parts.append(str(value))

    field("text", text)
    field("instruction", instr)
    field("cfg_scale", "1.0")
    field("seed", str(seed))
    if ref_path:
        parts.append(f"--{boundary}")
        parts.append(b'Content-Disposition: form-data; name="ref_audio"; filename="ref.wav"')
        parts.append(b"Content-Type: audio/wav")
        parts.append(b"")
        parts.append(io.open(ref_path, "rb").read())
        if ref_text:
            field("ref_text", ref_text)
    parts.append(f"--{boundary}--")
    parts.append("")
    body = b"\r\n".join(p.encode("utf-8") if isinstance(p, str) else p for p in parts)
    req = urllib.request.Request(API, data=body,
                                 headers={"content-type": f"multipart/form-data; boundary={boundary}"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=900) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code != 409:
                raise
            time.sleep(15 + attempt * 15)
    raise RuntimeError("服务持续忙")


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


def duration(path):
    out = subprocess.run([FFMPEG.replace("ffmpeg.exe", "ffprobe.exe"), "-v", "error",
                          "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout.strip()
    return float(out)


def main():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:] or None
    meta = []
    for c in CLIPS:
        if only and not any(o in c["name"] for o in only):
            continue
        dest = os.path.join(OUT, c["name"] + ".wav")
        if os.path.exists(dest):
            d = duration(dest)
            print(f"[skip] {c['name']} {d:.1f}s", flush=True)
            meta.append({**{k: v for k, v in c.items() if k != "ref"}, "sec": round(d, 2)})
            continue
        ref = os.path.join(REF_DIR, c["ref"]) if c["ref"] else None
        ref_text = None
        if ref:
            # 短样音当年由 LINE 生成，>4s 的样音内容不明，宁可不传 ref_text 也不传错
            ref_text = LINE if duration(ref) <= 4.2 else None
        t0 = time.time()
        try:
            pcm = post(c["text"], c["instr"], ref, ref_text)
        except Exception as exc:  # noqa: BLE001
            print(f"[fail] {c['name']}: {exc}", flush=True)
            continue
        save(pcm, dest)
        d = duration(dest)
        flag = "" if 10 <= d <= 30 else ("  ⚠ 偏短" if d < 10 else "  ⚠ 偏长")
        print(f"[ok] {c['name']} {d:.1f}s {time.time()-t0:.0f}s{flag}", flush=True)
        meta.append({**{k: v for k, v in c.items() if k != "ref"}, "sec": round(d, 2)})
    io.open(os.path.join(OUT, "_clips.json"), "w", encoding="utf-8").write(
        json.dumps(meta, ensure_ascii=False, indent=1))
    print("done", len(meta))


if __name__ == "__main__":
    raise SystemExit(main())
