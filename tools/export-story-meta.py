# -*- coding: utf-8 -*-
"""把 story-meta.json（记录表/分支表）嵌进主题脚本。"""
import io
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TP = ROOT + r"\webgal-game\theme-inject.js"
META = ROOT + r"\webgal-game\story-meta.json"

data = json.load(io.open(META, encoding="utf-8")) if os.path.exists(META) else {"rec": {}, "branch": {}}

s = io.open(TP, encoding="utf-8").read()
START, END = "/* STORYMETA_START */", "/* STORYMETA_END */"
block = (START + "\n  var REC_MAP = " + json.dumps(data.get("rec", {}), ensure_ascii=False)
         + ";\n  var CHOICE_FLAGS = " + json.dumps(data.get("choiceFlags", []), ensure_ascii=False)
         + ";\n  var BRANCH_MAP = " + json.dumps(data.get("branch", {}), ensure_ascii=False)
         + ";\n  " + END)

if START in s:
    i = s.index(START)
    j = s.index(END) + len(END)
    s = s[:i] + block + s[j:]
else:
    s = s.replace("  var MENU_LABELS", block + "\n\n  var MENU_LABELS", 1)

io.open(TP, "w", encoding="utf-8").write(s)
print("记录", len(data.get("rec", {})), "条；分支", len(data.get("branch", {})), "条")
