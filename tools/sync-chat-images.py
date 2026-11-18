# -*- coding: utf-8 -*-
"""把「某句台词 → 聊天图片」的映射写进 theme-inject.js 的标记块里，避免运行时多一次请求。"""
import io
import json
import os

ROOT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story"
TP = os.path.join(ROOT, "webgal-game", "theme-inject.js")

PROP_FILE = {
    "poster": "chat_poster.webp",
    "menu": "chat_menu.webp",
    "tray": "chat_tray.webp",
    "note": "chat_note.webp",
    "product_front": "chat_product_front.webp",
    "product_back": "chat_product_back.webp",
    "nutrition": "chat_nutrition.webp",
}

mapping = {}
for a in (1, 2, 3, 4):
    path = os.path.join(ROOT, "content", f"act{a}.json")
    for node in json.load(io.open(path, encoding="utf-8")):
        prop = node.get("prop")
        text = (node.get("text") or "").strip()
        if prop and text:
            img = PROP_FILE.get(prop)
            if img:
                mapping[text] = img

s = io.open(TP, encoding="utf-8").read()

START = "/* CHAT_IMAGES_START */"
END = "/* CHAT_IMAGES_END */"
block = START + "\n  var CHAT_IMAGES = " + json.dumps(mapping, ensure_ascii=False, indent=2) + ";\n  " + END

if START in s:
    i = s.index(START)
    j = s.index(END) + len(END)
    s = s[:i] + block + s[j:]
else:
    s = s.replace("  var MENU_LABELS", block + "\n\n  var MENU_LABELS", 1)

io.open(TP, "w", encoding="utf-8").write(s)
print("写入映射条数:", len(mapping))
