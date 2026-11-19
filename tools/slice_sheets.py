# -*- coding: utf-8 -*-
"""把「多图合一」的精灵图切分成单图：用 alpha/非背景色投影找空白行与空列，切成网格块。"""
import os
import json
from PIL import Image

SRC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'galgame')
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'props')

SHEETS = [
    "大学视觉小说空白纸张道具精灵图-11.png",
    "清新校园游戏界面精灵图.png",
    "透明九宫格餐盒图.png",
    "校园食堂九宫格餐盘精灵图-12.png",
    "校园饮品零食包装精灵图-10.png",
    "校园饮品与青菜精灵图.png",
    "校园早餐食物图鉴-8.png",
    "中国大学校园道具精灵图-9.png",
    "中式校园餐食16格精灵图-7.png",
]


def find_file(name):
    for root, _, files in os.walk(SRC_DIR):
        if name in files:
            return os.path.join(root, name)
    return None


def runs(flags):
    out, start = [], None
    for i, f in enumerate(flags):
        if f and start is None:
            start = i
        elif not f and start is not None:
            out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(flags)))
    return out


def slice_sheet(path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()

    has_alpha = any(px[x, y][3] < 8 for x in range(0, w, max(1, w // 120)) for y in range(0, h, max(1, h // 120)))

    def busy(x, y):
        r, g, b, a = px[x, y]
        if has_alpha:
            return a > 16
        return not (r > 246 and g > 246 and b > 246)

    def row_busy(y):
        return any(busy(x, y) for x in range(0, w, 2))

    def col_busy(x, y0, y1):
        return any(busy(x, y) for y in range(y0, y1, 2))

    row_flags = [row_busy(y) for y in range(h)]
    row_runs = [r for r in runs(row_flags) if r[1] - r[0] > 16]

    cells = []
    for (y0, y1) in row_runs:
        col_flags = [col_busy(x, y0, y1) for x in range(w)]
        for (x0, x1) in [c for c in runs(col_flags) if c[1] - c[0] > 16]:
            cells.append((x0, y0, x1, y1))
    return im, cells


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    manifest = {}
    for name in SHEETS:
        path = find_file(name)
        if not path:
            print("缺图:", name)
            continue
        im, cells = slice_sheet(path)
        stem = (name.replace("校园", "").replace("精灵图", "").replace(".png", "")
                .replace("图", "").replace("-", "_").strip("_"))
        saved = []
        for idx, box in enumerate(cells):
            crop = im.crop(box)
            if crop.size[0] < 40 or crop.size[1] < 40:
                continue
            out_name = f"{stem}_{idx:02d}.webp"
            crop.save(os.path.join(OUT_DIR, out_name), "WEBP", quality=88, method=5)
            saved.append({"file": out_name, "w": crop.size[0], "h": crop.size[1]})
        manifest[name] = saved
        print(f"{name}: 切出 {len(saved)} 块")

    with open(os.path.join(OUT_DIR, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("清单已写入 manifest.json")


if __name__ == "__main__":
    main()
