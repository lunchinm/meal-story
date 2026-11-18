# -*- coding: utf-8 -*-
"""按剧本导出「逐句清单」给运行时用——不再靠背景图/猜测判断界面。

剧本里每句 say 都有明确字段：
  channel: chat（群聊，无配音） / stage（文本框，有配音） / 空（= stage）
  speaker: 角色名，或「旁白」
  card:    k1/k2/k3 —— 知识卡台词
  seg:     段落序号
  scene:   场景（决定背景）

导出成 LINEMETA["speaker|text"] = {c: 0/1(是否聊天), k: 卡片级, s: 段落}
"""
import io
import json

ROOT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story"
TP = ROOT + r"\webgal-game\theme-inject.js"

meta = {}
chat_count = stage_count = card_count = 0
for a in (1, 2, 3, 4):
    for n in json.load(io.open(f"{ROOT}/content/act{a}.json", encoding="utf-8")):
        if n["type"] != "say":
            continue
        text = (n.get("text") or "").strip()
        if not text:
            continue
        speaker = (n.get("speaker") or "").strip()
        channel = n.get("channel") or "stage"
        is_chat = 1 if channel == "chat" else 0
        if is_chat:
            chat_count += 1
        else:
            stage_count += 1
        card = n.get("card")
        if card:
            card_count += 1
        key = speaker + "|" + text
        meta[key] = {"c": is_chat, "k": card or "", "s": n.get("seg") or ""}

s = io.open(TP, encoding="utf-8").read()
START, END = "/* LINEMETA_START */", "/* LINEMETA_END */"
block = (START + "\n  var LINE_META = " + json.dumps(meta, ensure_ascii=False) + ";\n  " + END)

if START in s:
    i = s.index(START)
    j = s.index(END) + len(END)
    s = s[:i] + block + s[j:]
else:
    s = s.replace("  var MENU_LABELS", block + "\n\n  var MENU_LABELS", 1)

io.open(TP, "w", encoding="utf-8").write(s)
print(f"逐句清单：聊天 {chat_count} 句 / 文本框 {stage_count} 句 / 知识卡 {card_count} 句，共 {len(meta)} 条键")
