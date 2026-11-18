# -*- coding: utf-8 -*-
"""把切好的单图分配到剧本里的 7 类道具：
   - assets/ch/ui_<prop>.webp   → 互动段落里当立绘展示
   - assets/bg/chat_<prop>.webp → 群聊里当图片消息（带纸框照片效果）
"""
import os
from PIL import Image, ImageDraw

PR = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story\assets\props"
CH = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story\assets\ch"
BG = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story\assets\bg"

PICK = {
    "poster": "大学视觉小说空白纸张道具_11_07.webp",
    "menu": "大学视觉小说空白纸张道具_11_04.webp",
    "tray": "中式餐食16格_7_00.webp",
    "note": "大学视觉小说空白纸张道具_11_11.webp",
    "product_front": "饮品零食包装_10_02.webp",
    "product_back": "饮品零食包装_10_03.webp",
    "nutrition": "大学视觉小说空白纸张道具_11_00.webp",
}

FIGURE_H = 820
CHAT_W, CHAT_H = 520, 360

for prop, src_name in PICK.items():
    src = os.path.join(PR, src_name)
    if not os.path.exists(src):
        print("缺图:", src_name)
        continue
    im = Image.open(src).convert("RGBA")

    # 立绘用：等比高度 820
    fig = im.copy()
    ratio = FIGURE_H / fig.size[1]
    fig = fig.resize((max(1, int(fig.size[0] * ratio)), FIGURE_H), Image.LANCZOS)
    fig.save(os.path.join(CH, f"ui_{prop}.webp"), "WEBP", quality=88, method=5)

    # 群聊用：cover 到 520x360 + 纸边圆角
    photo = im.copy()
    sw, sh = photo.size
    target = CHAT_W / CHAT_H
    if sw / sh > target:
        nw = int(sh * target)
        photo = photo.crop(((sw - nw) // 2, 0, (sw - nw) // 2 + nw, sh))
    else:
        nh = int(sw / target)
        photo = photo.crop((0, (sh - nh) // 2, sw, (sh - nh) // 2 + nh))
    photo = photo.resize((CHAT_W, CHAT_H), Image.LANCZOS)

    card = Image.new("RGBA", (CHAT_W + 24, CHAT_H + 24), (252, 249, 240, 255))
    card.paste(photo, (12, 12), photo)
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, card.size[0] - 1, card.size[1] - 1], radius=14, fill=255)
    card.putalpha(mask)
    card.save(os.path.join(BG, f"chat_{prop}.webp"), "WEBP", quality=86, method=5)

    print(f"{prop}: 立绘 {fig.size[0]}x{fig.size[1]} / 聊天图 {card.size[0]}x{card.size[1]}")

print("道具分配完成")
