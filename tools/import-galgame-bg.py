# -*- coding: utf-8 -*-
"""把 galgame 素材换成游戏背景：统一裁成 1920×1080 webp，按语义命名。
   原来只有食堂/教室/便利店三张通用图，现在补上宿舍、社团活动室、便利店外景、银杏道、手账、留白。
"""
import os
from PIL import Image

G = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\galgame\galgame"
OUT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story\assets\bg"

MAP = {
    "校园食堂午间小景.png": "bg_canteen.webp",
    "校园食堂窗边暖夜.png": "bg_canteen_night.webp",
    "阳光下的校园食堂.png": "bg_canteen_sunny.webp",
    "蓝红校园便利店-2.png": "bg_store.webp",
    "校园便利店午后.png": "bg_store_afternoon.webp",
    "秋日校园便利店外景-3.png": "bg_store_outside.webp",
    "蓝夜宿舍里的暖灯书桌-6.png": "bg_dorm.webp",
    "校园社团活动室-4.png": "bg_club.webp",
    "暖阳木桌留白-1.png": "bg_blank.webp",
    "空白校园营养手账.png": "bg_notebook.webp",
    "雨后金色银杏小径-5.png": "bg_path.webp",
}

# 找文件（可能嵌在子目录里）
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
    # 等比裁切（cover）到 16:9
    sw, sh = im.size
    target_ratio = W / H
    if sw / sh > target_ratio:
        new_w = int(sh * target_ratio)
        left = (sw - new_w) // 2
        im = im.crop((left, 0, left + new_w, sh))
    else:
        new_h = int(sw / target_ratio)
        top = (sh - new_h) // 2
        im = im.crop((0, top, sw, top + new_h))
    im = im.resize((W, H), Image.LANCZOS)
    dst = os.path.join(OUT, out_name)
    im.save(dst, "WEBP", quality=84, method=5)
    done.append(f"{out_name}  {os.path.getsize(dst)//1024}KB")

print("已生成：")
print("\n".join(done))
if missing:
    print("缺图：", missing)
