# -*- coding: utf-8 -*-
"""把三张精灵图做成「道具有图」的立绘式素材：配餐用九宫格餐盘、对比用饮品包装、调查簿用手账。"""
import os
from PIL import Image

G = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\galgame\galgame"
OUT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story\assets\ch"

MAP = {
    "校园食堂九宫格餐盘精灵图-12.png": ("ui_tray.webp", 900),
    "校园饮品零食包装精灵图-10.png": ("ui_drinks.webp", 900),
    "空白校园营养手账.png": ("ui_notebook.webp", 760),
    "大学视觉小说空白纸张道具精灵图-11.png": ("ui_paper.webp", 820),
}

index = {}
for root, _, files in os.walk(G):
    for f in files:
        index.setdefault(f, os.path.join(root, f))

done = []
for name, (out_name, target_h) in MAP.items():
    src = index.get(name)
    if not src:
        print("缺图:", name)
        continue
    im = Image.open(src).convert("RGBA")
    ratio = target_h / im.size[1]
    im = im.resize((int(im.size[0] * ratio), target_h), Image.LANCZOS)
    dst = os.path.join(OUT, out_name)
    im.save(dst, "WEBP", quality=86, method=5)
    done.append(f"{out_name} {im.size[0]}x{im.size[1]}")

print("道具图已生成：")
print("\n".join(done))
