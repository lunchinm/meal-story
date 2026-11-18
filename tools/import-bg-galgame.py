# -*- coding: utf-8 -*-
"""全部背景改用 galgame 素材（含宿舍），旧的素材不再引用。
   统一 1920x1080 webp，命名按用途。"""
import os
from PIL import Image

G = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\galgame"
OUT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story\assets\bg"

MAP = {
    "蓝夜宿舍里的暖灯书桌-6.png": "bg_dorm_night.webp",
    "暖阳木桌留白-1.png": "bg_desk_warm.webp",
    "阳光下的校园食堂.png": "bg_canteen_sun.webp",
    "校园食堂午间小景.png": "bg_canteen_noon.webp",
    "校园食堂窗边暖夜.png": "bg_canteen_night.webp",
    "校园便利店午后.png": "bg_store_afternoon.webp",
    "阳光校园便利店.png": "bg_store_sun.webp",
    "蓝红校园便利店-2.png": "bg_store_blue.webp",
    "秋日校园便利店外景-3.png": "bg_store_outside.webp",
    "校园社团活动室-4.png": "bg_club.webp",
    "雨后金色银杏小径-5.png": "bg_gingko.webp",
    "空白校园营养手账.png": "bg_notebook.webp",
}

index = {}
for root, _, files in os.walk(G):
    for f in files:
        index.setdefault(f, os.path.join(root, f))

W, H = 1920, 1080
done, missing = [], []
for src_name, out_name in MAP.items():
    src = index.get(src_name)
    if not src:
        missing.append(src_name)
        continue
    im = Image.open(src).convert("RGB")
    sw, sh = im.size
    target = W / H
    if sw / sh > target:
        nw = int(sh * target)
        im = im.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    else:
        nh = int(sw / target)
        im = im.crop((0, (sh - nh) // 2, sw, (sh - nh) // 2 + nh))
    im = im.resize((W, H), Image.LANCZOS)
    dst = os.path.join(OUT, out_name)
    im.save(dst, "WEBP", quality=84, method=5)
    done.append(f"{out_name} {os.path.getsize(dst)//1024}KB")

print("背景已生成（全部来自 galgame）：")
print("\n".join(done))
if missing:
    print("缺图:", missing)
