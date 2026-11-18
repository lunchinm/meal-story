# -*- coding: utf-8 -*-
"""本地重建引擎后一键还原：游戏资源 + index.html 补丁 + 主题脚本。
用法：python tools/sync-dist.py [版本号]"""
import io
import os
import shutil
import sys

ROOT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story"
DIST = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\WebGAL-src\packages\webgal\dist"
VER = sys.argv[1] if len(sys.argv) > 1 else "20261118j"

GAME = os.path.join(DIST, "game")
for sub, src in (
    ("background", os.path.join(ROOT, "assets", "bg")),
    ("figure", os.path.join(ROOT, "assets", "ch")),
    ("vocal", os.path.join(ROOT, "assets", "voice")),
    ("bgm", os.path.join(ROOT, "assets", "sfx")),
    ("scene", os.path.join(ROOT, "webgal-game", "scene")),
):
    dst = os.path.join(GAME, sub)
    os.makedirs(dst, exist_ok=True)
    for f in os.listdir(src):
        if f.endswith((".webp", ".mp3", ".txt")):
            shutil.copy2(os.path.join(src, f), os.path.join(dst, f))

for f, dst in (("config.txt", "config.txt"), ("flowchart.json", "flowchart.json")):
    src = os.path.join(ROOT, "webgal-game", f)
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(GAME, dst))

shutil.copy2(os.path.join(ROOT, "webgal-game", "theme-inject.js"), os.path.join(DIST, "theme-inject.js"))

idx = os.path.join(DIST, "index.html")
s = io.open(idx, encoding="utf-8").read()
s = s.replace("loadIifePlugin('lib/live2d.min.js')", "Promise.resolve(null)")
s = s.replace("loadIifePlugin('lib/live2dcubismcore.min.js')", "Promise.resolve(null)")
if "theme-inject.js" not in s:
    s = s.replace("</body>", f'  <script src="theme-inject.js?v={VER}"></script>\n</body>')
else:
    import re
    s = re.sub(r'theme-inject\.js(\?v=[\w]+)?', f'theme-inject.js?v={VER}', s)
io.open(idx, "w", encoding="utf-8").write(s)

bg = len([f for f in os.listdir(os.path.join(GAME, "background")) if f.endswith(".webp")])
fg = len([f for f in os.listdir(os.path.join(GAME, "figure")) if f.endswith(".webp")])
vo = len([f for f in os.listdir(os.path.join(GAME, "vocal")) if f.endswith(".mp3")])
print(f"同步完成：背景 {bg} 张 / 立绘 {fg} 张 / 配音 {vo} 条 / index 版本 {VER}")
