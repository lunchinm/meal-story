# -*- coding: utf-8 -*-
"""用 galgame 的六人全身立绘替换原立绘：同一张图铺到 normal/happy/worried 三个表情位。"""
import os
import shutil
from PIL import Image

G = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\galgame\galgame\角色立绘_剧情版_六人\角色立绘_剧情版"
OUT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story\assets\ch"

NAME_MAP = {
    "陆燃": "luran",
    "罗师傅": "luomaster",
    "米粒": "mili",
    "苏桃": "sutao",
    "许知夏": "zhixia",
    "周简": "zhoujian",
}

EXPRS = ("normal", "happy", "worried")
H = 900

done = []
for cn, en in NAME_MAP.items():
    src = os.path.join(G, cn + ".png")
    if not os.path.exists(src):
        print("缺图:", cn)
        continue
    im = Image.open(src).convert("RGBA")
    ratio = H / im.size[1]
    im = im.resize((int(im.size[0] * ratio), H), Image.LANCZOS)
    for expr in EXPRS:
        dst = os.path.join(OUT, f"ch_{en}_{expr}.webp")
        im.save(dst, "WEBP", quality=86, method=5)
    done.append(f"{cn} → ch_{en}_*.webp  {im.size[0]}x{im.size[1]}")

print("已替换：")
print("\n".join(done))
