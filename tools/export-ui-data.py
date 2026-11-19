# -*- coding: utf-8 -*-
"""把剧本里的互动节点（配餐/对比/探索/圈选/调查簿/结局）导出成 UI 数据，
   运行时按当前台词命中，弹出对应的纸面面板（题目 / 提示 / 图示 / 条目）。

剧本字段一律照搬，不做改写：
  plate      : speaker, text, tip, budget, slots, cards, check, hint
  compare    : prompt, hint, offers[{name, front, back}], worse
  explore    : title, items[{label, summary}]
  evidence   : prompt, hint, posterText[], regions[], claims[]
  notebook   : title, entries[{label, text}]
  ending     : title, body[], action, unlocks[], cards[]
"""
import os
import io
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TP = ROOT + r"\\webgal-game\\theme-inject.js"

ui = {}
for a in (1, 2, 3, 4):
    for n in json.load(io.open(f"{ROOT}/content/act{a}.json", encoding="utf-8")):
        t = n["type"]
        if t not in ("plate", "compare", "explore", "evidence", "notebook", "ending"):
            continue
        entry = {"kind": t, "id": n["id"]}
        if t == "plate":
            key = (n.get("text") or "").strip()
            entry.update({
                "title": "配一份午饭",
                "prompt": n.get("text", ""),
                "hint": n.get("tip", ""),
                "budget": n.get("budget"),
                "slots": n.get("slots"),
                "cards": n.get("cards", []),
            })
        elif t == "compare":
            key = (n.get("prompt") or "").strip()
            entry.update({
                "title": "瓶身对比",
                "prompt": n.get("prompt", ""),
                "hint": n.get("hint", ""),
                "offers": n.get("offers", []),
            })
        elif t == "explore":
            key = (n.get("title") or "").strip()
            entry.update({
                "title": n.get("title", ""),
                "prompt": "点一个看看",
                "hint": "",
                "items": [{"label": i.get("label", ""), "summary": i.get("summary", "")} for i in n.get("items", [])],
            })
        elif t == "evidence":
            key = (n.get("prompt") or "").strip()
            entry.update({
                "title": "圈出需要核实的说法",
                "prompt": n.get("prompt", ""),
                "hint": n.get("hint", ""),
                "posterText": n.get("posterText", []),
                "need": n.get("need"),
            })
        elif t == "notebook":
            key = (n.get("title") or "").strip()
            entry.update({
                "title": n.get("title", ""),
                "prompt": "这次核实了什么",
                "hint": "",
                "entries": [{"label": e.get("label", ""), "text": e.get("text", "")} for e in n.get("entries", [])],
            })
        else:  # ending
            key = (n.get("title") or "").strip()
            entry.update({
                "title": n.get("title", ""),
                "prompt": "",
                "hint": "",
                "body": n.get("body", []),
                "action": n.get("action", ""),
                "unlocks": n.get("unlocks", []),
            })
        if key:
            ui[key] = entry

s = io.open(TP, encoding="utf-8").read()
START, END = "/* UIDATA_START */", "/* UIDATA_END */"
block = (START + "\n  var UI_DATA = " + json.dumps(ui, ensure_ascii=False) + ";\n  " + END)

if START in s:
    i = s.index(START)
    j = s.index(END) + len(END)
    s = s[:i] + block + s[j:]
else:
    s = s.replace("  var MENU_LABELS", block + "\n\n  var MENU_LABELS", 1)

io.open(TP, "w", encoding="utf-8").write(s)
print("互动节点：", {k: v["kind"] for k, v in ui.items()})