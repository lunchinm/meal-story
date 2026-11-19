# -*- coding: utf-8 -*-
"""生成完整的配音清单：say 节点 + choice 回复（reply），并和现有 mp3 对账。

reply 的 id 规则来自 src/engine/runner.ts：
    id = `${node.id}-reply-${index}-${cursor}`，cursor 先自增再生成，所以从 1 开始。
    处于群聊上下文时 reply 不配音（channel=chat）。
旁白已决定不配。
"""
import glob
import io
import json
import os
import subprocess
from collections import Counter

MS = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story"
ART = os.path.join(MS, ".artifacts", "voice-cleanup")
FFPROBE = r"C:\Users\MIC lunchinm\Tools\ffmpeg\bin\ffprobe.exe"
NO_VOICE = {"你", "旁白"}


def dur(p):
    return float(subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                                 "-of", "csv=p=0", p], capture_output=True, text=True).stdout.strip())


nodes = {}
for f in sorted(glob.glob(os.path.join(MS, "content", "act*.json"))):
    for n in json.load(io.open(f, encoding="utf-8")):
        nodes[n["id"]] = n

items = []      # (id, role, text, source)
for nid, n in nodes.items():
    if n.get("type") != "say":
        continue
    role = n.get("speaker", "旁白")
    if role in NO_VOICE or n.get("channel") == "chat":
        continue
    items.append((nid, role, n.get("text", ""), "say"))

# ---- reply 台词 ----
reply_items = []
for nid, n in nodes.items():
    if n.get("type") != "choice":
        continue
    for idx, opt in enumerate(n.get("options", [])):
        rep = opt.get("reply")
        if not rep:
            continue
        arr = rep if isinstance(rep, list) else [rep]
        for cur, entry in enumerate(arr, start=1):
            text = entry if isinstance(entry, str) else entry.get("text", "")
            spk = None if isinstance(entry, str) else entry.get("speaker")
            reply_items.append((f"{nid}-reply-{idx}-{cur}", spk or "?", text, "reply"))

files = {os.path.basename(p)[:-4]: p for p in glob.glob(os.path.join(MS, "assets", "voice", "*.mp3"))}
reply_ids = {r[0] for r in reply_items}
have_reply = sorted(reply_ids & set(files))
missing_reply_file = sorted(reply_ids - set(files))
ghost_reply = sorted(set(files) - set(nodes) - reply_ids)

print(f"say 需配 {len(items)} 句")
print(f"choice 里可生成的 reply 共 {len(reply_items)} 条")
print(f"   其中现有 mp3 覆盖 {len(have_reply)} 条")
print(f"   有 reply 文本但没有 mp3 的 {len(missing_reply_file)} 条 → {missing_reply_file[:10]}")
print(f"   有 mp3 但既不是 say 也不是 reply 的 {len(ghost_reply)} 条 → {ghost_reply[:10]}")

# ---- 完整清单 = say + 已配音的 reply ----
full = list(items) + [r for r in reply_items if r[0] in have_reply]

# 校验：文本长度 vs 现有音频时长，语速离谱的说明文本取错位了
suspect = []
for nid, role, text, src in full:
    if nid not in files:
        continue
    chars = len([c for c in text if c.strip()])
    if chars == 0:
        continue
    sec = dur(files[nid])
    if sec <= 0.2:
        continue
    cps = chars / sec
    if cps < 2.5 or cps > 9.5:
        suspect.append((nid, role, src, chars, round(sec, 2), round(cps, 1), text[:26]))

print(f"\n完整清单 {len(full)} 句；语速异常 {len(suspect)} 条（文本可能和编号对不上）")
for s in suspect[:12]:
    print("  ", s)

by_role = Counter(r[1] for r in full)
by_src = Counter(r[3] for r in full)
print("\n按角色:", dict(by_role.most_common()))
print("按来源:", dict(by_src))

os.makedirs(ART, exist_ok=True)
io.open(os.path.join(ART, "voice-full.json"), "w", encoding="utf-8").write(json.dumps(
    [{"id": i, "role": r, "text": t, "src": s} for i, r, t, s in full], ensure_ascii=False, indent=1))
print("\n已写入", os.path.join(ART, "voice-full.json"))
