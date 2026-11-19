# -*- coding: utf-8 -*-
"""按剧本导出「逐句清单」给运行时用——按节点 id 索引（文本键保留兜底）。

剧本字段：
  channel: chat（群聊，无配音） / stage（文本框，有配音） / 空（= stage）
  speaker / card(k1..k3) / seg / scene

导出两块：
  LINE_BY_ID[id]        = {c, k, s, sp, snd}
  LINE_META["sp|text"]  = {c, k, s}          ← 兼容旧逻辑（文本兜底）
"""
import io
import json

ROOT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story"
TP = ROOT + r"\webgal-game\theme-inject.js"

by_id = {}
by_text = {}

for a in (1, 2, 3, 4):
    nodes = json.load(io.open(f"{ROOT}/content/act{a}.json", encoding="utf-8"))
    scene = None
    for n in nodes:
        if n.get("scene"):
            scene = n["scene"]
        if n["type"] == "say":
            text = (n.get("text") or "").strip()
            if not text:
                continue
            sp = (n.get("speaker") or "").strip()
            is_chat = 1 if n.get("channel") == "chat" else 0
            by_id[n["id"]] = {"c": is_chat, "k": n.get("card") or "", "s": n.get("seg") or "", "sp": sp}
            by_text[sp + "|" + text] = {"c": is_chat, "k": n.get("card") or "", "s": n.get("seg") or ""}
        elif n["type"] == "choice":
            is_chat = 1 if scene == "chat" else 0
            opts = n.get("options") or []
            if len(opts) == 1:
                by_id[n["id"] + "-pick"] = {"c": is_chat, "k": "", "s": "", "sp": "你", "snd": 1}
            else:
                for i in range(len(opts)):
                    by_id[f'{n["id"]}-c{i}'] = {"c": is_chat, "k": "", "s": "", "sp": "你", "snd": 0}

s = io.open(TP, encoding="utf-8").read()

def put(start_tag, end_tag, payload):
    global s
    block = start_tag + "\n  " + payload + "\n  " + end_tag
    if start_tag in s:
        i = s.index(start_tag)
        j = s.index(end_tag) + len(end_tag)
        s = s[:i] + block + s[j:]
    else:
        s = s.replace("  var MENU_LABELS", block + "\n\n  var MENU_LABELS", 1)

put("/* LINEID_START */", "/* LINEID_END */",
    "var LINE_BY_ID = " + json.dumps(by_id, ensure_ascii=False) + ";")
put("/* LINEMETA_START */", "/* LINEMETA_END */",
    "var LINE_META = " + json.dumps(by_text, ensure_ascii=False) + ";")

io.open(TP, "w", encoding="utf-8").write(s)
print(f"按 id：{len(by_id)} 条；按文本兜底：{len(by_text)} 条")
