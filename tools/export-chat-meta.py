# -*- coding: utf-8 -*-
"""把「哪些台词属于群聊场景」导出进主题脚本（按台词文本判定，比看背景图可靠）。
   同时导出「群聊里玩家自己说的话」，用于右侧绿色气泡。"""
import os
import io
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TP = ROOT + r"\webgal-game\theme-inject.js"

chat = {}
mine = {}
for a in (1, 2, 3, 4):
    nodes = json.load(io.open(f"{ROOT}/content/act{a}.json", encoding="utf-8"))
    scene = None
    for n in nodes:
        if n.get("scene"):
            scene = n["scene"]
        text = (n.get("text") or "").strip()
        if not text:
            continue
        if scene == "chat":
            chat[text] = 1
            if n.get("speaker") == "你":
                mine[text] = 1
        # 单选项里的玩家回复也算聊天内容
        if n["type"] == "choice" and scene == "chat":
            for opt in n.get("options", []):
                rep = opt.get("reply")
                seq = rep if isinstance(rep, list) else ([rep] if rep else [])
                for item in seq:
                    t = item if isinstance(item, str) else (item.get("text") or "")
                    t = t.strip()
                    if t:
                        chat[t] = 1
                        if (not isinstance(item, str)) and item.get("speaker") == "你":
                            mine[t] = 1
                        elif isinstance(item, str):
                            mine[t] = 1
                ot = (opt.get("text") or "").strip()
                if ot:
                    chat[ot] = 1

s = io.open(TP, encoding="utf-8").read()
START, END = "/* CHAT_META_START */", "/* CHAT_META_END */"
block = (START + "\n  var CHAT_TEXTS = " + json.dumps(chat, ensure_ascii=False) + ";\n"
         + "  var MY_TEXTS = " + json.dumps(mine, ensure_ascii=False) + ";\n  " + END)

if START in s:
    i = s.index(START)
    j = s.index(END) + len(END)
    s = s[:i] + block + s[j:]
else:
    s = s.replace("  var MENU_LABELS", block + "\n\n  var MENU_LABELS", 1)

io.open(TP, "w", encoding="utf-8").write(s)
print(f"聊天台词 {len(chat)} 条，其中玩家的话 {len(mine)} 条")