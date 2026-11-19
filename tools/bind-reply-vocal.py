# -*- coding: utf-8 -*-
"""给 WebGAL 场景脚本补绑选项回应（reply）的配音。

场景里的台词行格式： `角色:台词;`，配音用行内 `-vocal=节点号.mp3` 绑定。
reply 的 id 形如 a1-15-reply-0-2，音频文件名就是它。
匹配按 (角色, 台词文本)，同一文本多处出现共用一个音频即可。

用法:
    python tools/bind-reply-vocal.py --dry     # 只看能匹配多少
    python tools/bind-reply-vocal.py           # 实际写入
"""
import glob
import io
import json
import os
import re
import sys

MS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENE = os.path.join(MS, "webgal-game", "scene")
VOICE = os.path.join(MS, "assets", "voice")
DRY = "--dry" in sys.argv

have = {os.path.basename(p)[:-4] for p in glob.glob(os.path.join(VOICE, "*.mp3"))}

# 1) 收集 reply 台词：(角色, 文本) -> [id...]
pool = {}
for n in (1, 2, 3, 4):
    p = os.path.join(MS, "content", f"act{n}.json")
    for node in json.load(io.open(p, encoding="utf-8")):
        if node.get("type") != "choice":
            continue
        for idx, opt in enumerate(node.get("options", [])):
            rep = opt.get("reply")
            if not rep:
                continue
            arr = rep if isinstance(rep, list) else [rep]
            for cur, entry in enumerate(arr, start=1):
                rid = f"{node['id']}-reply-{idx}-{cur}"
                if rid not in have:
                    continue
                text = entry if isinstance(entry, str) else entry.get("text", "")
                spk = None if isinstance(entry, str) else entry.get("speaker")
                if not spk:
                    continue
                key = (spk.strip(), text.strip())
                pool.setdefault(key, []).append(rid)

print(f"可绑的 reply 台词组合: {len(pool)}，节点总数 {sum(len(v) for v in pool.values())}")

# 2) 逐文件给未绑定的台词行补上
total_added = 0
for f in sorted(glob.glob(os.path.join(SCENE, "act*.txt"))):
    lines = io.open(f, encoding="utf-8").read().splitlines()
    out, added = [], 0
    for line in lines:
        m = re.match(r"^([^:：;]+)[:：](.*?)(\s*-vocal=[^;]+)?;\s*$", line)
        if m and "-vocal=" not in line:
            spk, text = m.group(1).strip(), m.group(2).strip()
            ids = pool.get((spk, text))
            if ids:
                line = line.rstrip()
                assert line.endswith(";")
                line = line[:-1] + f" -vocal={ids[0]}.mp3;"
                added += 1
        out.append(line)
    name = os.path.basename(f)
    print(f"{name}: 新增 {added} 处")
    total_added += added
    if not DRY and added:
        io.open(f, "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")

print(f"\n合计新增 {total_added} 处" + ("（dry run，未写入）" if DRY else "（已写入）"))
for f in sorted(glob.glob(os.path.join(SCENE, "act*.txt"))):
    c = len(re.findall(r"-vocal=", io.open(f, encoding="utf-8").read()))
    print(f"  {os.path.basename(f)}: 现有 -vocal {c} 处")
