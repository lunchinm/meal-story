# -*- coding: utf-8 -*-
"""把切好的素材拼成一张联系表（带文件名），方便挑选用哪张。"""
import os
import json
from PIL import Image, ImageDraw

PR = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story\assets\props"
OUT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\文档\out\props-contact.png"

files = sorted(f for f in os.listdir(PR) if f.endswith(".webp"))
cols, cell, pad = 8, 160, 8
rows = (len(files) + cols - 1) // cols
W = cols * (cell + pad) + pad
H = rows * (cell + 22) + pad

sheet = Image.new("RGB", (W, H), (250, 248, 242))
d = ImageDraw.Draw(sheet)

for i, name in enumerate(files):
    im = Image.open(os.path.join(PR, name)).convert("RGBA")
    im.thumbnail((cell, cell))
    bg = Image.new("RGB", (cell, cell), (255, 255, 255))
    bg.paste(im, ((cell - im.size[0]) // 2, (cell - im.size[1]) // 2), im)
    x = pad + (i % cols) * (cell + pad)
    y = pad + (i // cols) * (cell + 22)
    sheet.paste(bg, (x, y))
    d.text((x, y + cell + 2), name[:22], fill=(60, 60, 60))

sheet.save(OUT, "PNG")
print("联系表:", OUT, sheet.size, "共", len(files), "张")
