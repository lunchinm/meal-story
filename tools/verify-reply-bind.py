# -*- coding: utf-8 -*-
"""核对 72 条 reply 配音绑定的正确性：

1. 每条 reply 文本在场景脚本里出现几次（多次 = 有歧义）
2. 被绑定的那行是否落在 choose 分支标签之后（真·选项回应）
3. reply 文本是否与普通剧情台词重复（重复 = 可能误绑）
"""
import glob
import io
import json
import os
import re

MS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENE = os.path.join(MS, "webgal-game", "scene")
VOICE = os.path.join(MS, "assets", "voice")

have = {os.path.basename(p)[:-4] for p in glob.glob(os.path.join(VOICE, "*.mp3"))}

# 1) 收集 reply
replies = []
for n in (1, 2, 3, 4):
    for node in json.load(io.open(os.path.join(MS, "content", f"act{n}.json"), encoding="utf-8")):
        if node.get("type") != "choice":
            continue
        for idx, opt in enumerate(node.get("options", [])):
            rep = opt.get("reply")
            if not rep:
                continue
            arr = rep if isinstance(rep, list) else [rep]
            for cur, entry in enumerate(arr, start=1):
                rid = f"{node['id']}-reply-{idx}-{cur}"
                if isinstance(entry, str):
                    continue
                text, spk = (entry.get("text") or "").strip(), (entry.get("speaker") or "").strip()
                ch = entry.get("channel") or "say"
                if not text or not spk:
                    continue
                replies.append({
                    "id": rid, "speaker": spk, "text": text, "channel": ch,
                    "has_audio": rid in have, "choice_node": node["id"],
                })

print(f"reply 总数 {len(replies)}，有音频 {sum(1 for r in replies if r['has_audio'])}")
print(f"其中 channel=chat 的: {sum(1 for r in replies if r['channel'] == 'chat')}")
print(f"其中 channel=say 的 : {sum(1 for r in replies if r['channel'] != 'chat')}")

# 2) 普通剧情台词文本（用于查重）
say_texts = {}
for n in (1, 2, 3, 4):
    for node in json.load(io.open(os.path.join(MS, "content", f"act{n}.json"), encoding="utf-8")):
        if node.get("type") == "say":
            say_texts.setdefault((node.get("speaker", "").strip(), (node.get("text") or "").strip()), []).append(node["id"])

# 3) 场景脚本：统计每个 (角色,文本) 出现次数，并记录所在上下文
occ = {}
for f in sorted(glob.glob(os.path.join(SCENE, "act*.txt"))):
    lines = io.open(f, encoding="utf-8").read().splitlines()
    label = ""
    for i, line in enumerate(lines):
        m = re.match(r"^jumpLabel:(\S+);", line.strip())
        if m:
            label = m.group(1)
        m2 = re.match(r"^([^:：;]+)[:：](.*?)(\s*-vocal=[^;]+)?;\s*$", line)
        if not m2:
            continue
        spk, txt = m2.group(1).strip(), m2.group(2).strip()
        occ.setdefault((spk, txt), []).append({
            "file": os.path.basename(f), "line": i + 1, "label": label,
            "has_vocal": bool(m2.group(3)),
        })

# 4) 逐条核对
amb, missing, in_say, chat = [], [], [], []
for r in replies:
    if not r["has_audio"]:
        continue
    key = (r["speaker"], r["text"])
    spots = occ.get(key, [])
    if not spots:
        missing.append(r)
    elif len(spots) > 1:
        amb.append((r, spots))
    if key in say_texts:
        in_say.append((r, say_texts[key]))
    if r["channel"] == "chat":
        chat.append(r)

print(f"\n场景脚本里找不到的: {len(missing)}")
for r in missing[:5]:
    print(f"   {r['id']} {r['speaker']}: {r['text'][:28]}")
print(f"文本出现多次（有歧义）: {len(amb)}")
for r, spots in amb[:8]:
    where = " / ".join(f"{s['file']}:{s['line']}({s['label']})" + ("[已绑]" if s["has_vocal"] else "") for s in spots)
    print(f"   {r['id']} {r['speaker']}: {r['text'][:22]} → {where}")
print(f"reply 文本与普通剧情台词重复: {len(in_say)}")
for r, ids in in_say[:8]:
    print(f"   {r['id']} 与 say {ids} 同文本: {r['text'][:24]}")
print(f"\nchannel=chat 的 reply（聊天面板内，可能不在场景脚本主线上）: {len(chat)}")
for r in chat[:10]:
    key = (r["speaker"], r["text"])
    print(f"   {r['id']} {r['speaker']}: {r['text'][:24]}  场景中: {len(occ.get(key, []))} 处")
