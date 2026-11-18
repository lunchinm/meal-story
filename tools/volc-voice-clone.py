# -*- coding: utf-8 -*-
"""声音复刻（复刻 2.0）：把样音注册成可用音色。

要点（照官方 API 参考）：
  - 只要两个头：X-Api-Key、X-Api-Request-Id（多传 resource id 会报
    "resource ID is mismatched with speaker related resource"）
  - 音频字段是 audio 对象：{"data": base64, "format": "wav"}
  - 复刻 2.0 需要 extra_params.model_type = 5
  - speaker_id 留空让服务端分配 S_ 开头的正式槽位
  - 不要传 custom_speaker_id：那是「后付费音色」，首次合成即收 138 元槽位费
  - 一定要传 text（参考文本），服务端会做 WER 校验，念错会返回 45001109 而不是默默坏掉

用法：
  python tools/volc-voice-clone.py --only 米粒      # 先试一个
  python tools/volc-voice-clone.py                  # 全量注册
"""
import base64
import io
import json
import os
import subprocess
import sys
import uuid
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FINAL = os.path.join(ROOT, ".artifacts", "voice-final")
OUT = os.path.join(ROOT, ".artifacts", "voice-cloud")
FFPROBE = r"C:\Users\MIC lunchinm\Tools\ffmpeg\bin\ffprobe.exe"
API = "https://openspeech.bytedance.com/api/v3/tts/voice_clone"

# 角色 -> (样音文件, 样音对应的台词, 试听台词)
# text 必须与样音内容一致；demo_text 4-300 字
SPEAKERS = [
    ("米粒", "01-米粒.wav",
     "菜基本一样，就是西兰花没有照片里站得那么整齐。我可以一边吃，一边保持怀疑。要是真能承包，我以后就不用每天在窗口前思考人生了。你看！我就说——",
     "先看这个！要是真能承包，我以后就不用每天在窗口前思考人生了。"),
    ("许知夏", "02-许知夏.wav",
     "人体免疫功能有很多环节，没有一个简单数字能概括它。图里这个满，目前连怎么算都没说。我们还不知道份量，也不知道你早饭、晚饭吃什么。这一张照片提供的信息有限。",
     "这个安排挺合理。我们还不知道份量，也不知道你早饭、晚饭吃什么。"),
    ("苏桃", "03-苏桃.wav",
     "你们研究得怎么样？我这边有人问能不能跟着买七天。主要是后者，说最近大家都在感冒，想买来预防。这份菜看起来挺上镜。别动，拍一张。",
     "你们研究得怎么样？我这边有人问能不能跟着买七天。别动，拍一张。"),
    ("旁白", "04-旁白.wav",
     "目前只有转发截图，效果承诺的来源尚未查明。判断一日饮食，需要结合各餐、食物种类与数量。米粒希望吃饭省时，建议需要结合课表和购买条件。",
     "目前只有转发截图，效果承诺的来源尚未查明。"),
    ("罗师傅", "05-罗师傅.wav",
     "这周配的，点起来快一点，窗口也能少堵一会儿。菜是我们的。后面这几句话，我也是第一次见。七天以后，这个窗口轮换菜单，新菜牌都写好了。你们要看菜品和份量，窗口有实物。",
     "这周配的，点起来快一点，窗口也能少堵一会儿。菜是我们的。"),
    ("陆燃", "06-陆燃.wav",
     "到楼下了。刚才帮人搬了器材，我提前了十五分钟。这次是真的。有鸡肉有鸡蛋，可以。我下午还有课，先过去占位置。",
     "到楼下了。有鸡肉有鸡蛋，可以。这次是真的。"),
    ("周简", "07-周简.wav",
     "你的十分钟已经二十分钟了。价格被裁掉了，这张图没有考虑我的感受。先记下来，等会儿问。以后评价套餐，我申请增加一个价格栏。我负责记价格。",
     "你的十分钟已经二十分钟了。价格被裁掉了。"),
]


def load_env():
    env = {}
    for line in io.open(os.path.join(ROOT, ".env"), encoding="utf-8"):
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


ENV = load_env()


def dur(p):
    return float(subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip())


def clone(wav_path, ref_text, demo_text):
    wav = io.open(wav_path, "rb").read()
    body = {
        "speaker_id": "",                      # 留空 → 服务端分配 S_ 正式槽位（免费）
        "audio": {"data": base64.b64encode(wav).decode(), "format": "wav"},
        "language": 0,
        "text": ref_text,                      # 参考文本，服务端做 WER 校验
        "extra_params": {
            "model_type": 5,                   # 复刻 2.0
            "demo_text": demo_text,
            "enable_audio_denoise": False,     # 样音是 TTS 直出，很干净
            "disable_volume_normalization": False,
        },
    }
    headers = {
        "Content-Type": "application/json",
        "X-Api-Key": ENV["VOLC_API_KEY"],
        "X-Api-Request-Id": str(uuid.uuid4()),
    }
    req = urllib.request.Request(API, data=json.dumps(body).encode(), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return r.status, r.headers.get("X-Tt-Logid", ""), json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("X-Tt-Logid", ""), e.read().decode("utf-8", "replace")


def main():
    only = None
    if "--only" in sys.argv:
        only = sys.argv[sys.argv.index("--only") + 1]
    os.makedirs(OUT, exist_ok=True)
    reg_path = os.path.join(OUT, "speakers.json")
    reg = json.load(io.open(reg_path, encoding="utf-8")) if os.path.exists(reg_path) else {}

    STATUS = {0: "NotFound", 1: "Training", 2: "Success", 3: "Failed", 4: "Active"}
    for name, fname, ref_text, demo in SPEAKERS:
        if only and name != only:
            continue
        if name in reg:
            print(f"[skip] {name} 已注册 {reg[name]['speaker_id']}", flush=True)
            continue
        path = os.path.join(FINAL, fname)
        if not os.path.exists(path):
            print(f"[miss] {name} 缺 {fname}", flush=True)
            continue
        code, logid, data = clone(path, ref_text, demo)
        if code != 200 or not isinstance(data, dict):
            print(f"[fail] {name} HTTP {code} logid={logid} {str(data)[:300]}", flush=True)
            continue
        st = data.get("status")
        sid = data.get("speaker_id", "")
        reg[name] = {
            "speaker_id": sid,
            "status": STATUS.get(st, st),
            "left": data.get("available_training_times"),
            "demo_audio": (data.get("speaker_status") or [{}])[0].get("demo_audio", ""),
            "logid": logid,
            "src": fname,
            "sec": round(dur(path), 2),
        }
        io.open(reg_path, "w", encoding="utf-8").write(json.dumps(reg, ensure_ascii=False, indent=1))
        print(f"[ok] {name} speaker_id={sid} status={STATUS.get(st, st)} "
              f"剩余次数={data.get('available_training_times')} 时长={dur(path):.1f}s", flush=True)
        demo_url = reg[name]["demo_audio"]
        if demo_url:
            print(f"     试听: {demo_url}", flush=True)

    print(f"\n注册表 {reg_path}")
    for k, v in reg.items():
        print(f"  {k:<4} {v['speaker_id']:<40} {v['status']:<8} 剩余 {v['left']}")


if __name__ == "__main__":
    raise SystemExit(main())
