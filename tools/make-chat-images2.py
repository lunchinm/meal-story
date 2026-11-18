# -*- coding: utf-8 -*-
"""生成群聊里可点击的图片消息：把 galgame 素材裁成「聊天图片」尺寸（520×360 纸框照片）。"""
import os
from PIL import Image, ImageDraw

G = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\galgame\galgame"
OUT = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story\assets\bg"

W, H = 520, 360

SRC = {
    "chat_note.webp": "空白校园营养手账.png",
    "chat_product_front.webp": "校园饮品零食包装精灵图-10.png",
    "chat_product_back.webp": "校园饮品与青菜精灵图.png",
    "chat_nutrition.webp": "校园早餐食物图鉴-8.png",
}

index = {}
for root, _, files in os.walk(G):
    for f in files:
        index.setdefault(f, os.path.join(root, f))

done = []
for out_name, src_name in SRC.items():
    src = index.get(src_name)
    if not src:
        print("缺图:", src_name)
        continue
    im = Image.open(src).convert("RGB")
    # cover 裁到 520x360
    sw, sh = im.size
    target = W / H
    if sw / sh > target:
        nw = int(sh * target)
        im = im.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    else:
        nh = int(sw / target)
        im = im.crop((0, (sh - nh) // 2, sw, (sh - nh) // 2 + nh))
    im = im.resize((W, H), Image.LANCZOS)

    # 纸框：白边 + 圆角
    card = Image.new("RGBA", (W + 24, H + 24), (252, 249, 240, 255))
    card.paste(im, (12, 12))
    mask = Image.new("L", card.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, card.size[0] - 1, card.size[1] - 1], radius=14, fill=255)
    card.putalpha(mask)

    dst = os.path.join(OUT, out_name)
    card.save(dst, "WEBP", quality=86, method=5)
    done.append(f"{out_name} {os.path.getsize(dst)//1024}KB")

print("聊天图片已生成：")
print("\n".join(done))
