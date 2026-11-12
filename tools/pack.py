"""把生成出来的 PNG 收成网页能直接用的 webp，并生成 src/assets.ts 索引。

流程：
  1. 背景：等比裁到 1280×720，转 webp
  2. 立绘/食物卡：先抠掉背景（调用 cutout），再转带透明通道的 webp
  3. 写 src/assets.ts，代码里 import 就是它，不再手写路径
"""
from __future__ import annotations

import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout import cutout  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG_DIR = os.path.join(ROOT, "assets", "bg")
CH_DIR = os.path.join(ROOT, "assets", "ch")
FOOD_DIR = os.path.join(ROOT, "assets", "food")
INDEX = os.path.join(ROOT, "src", "assets.ts")


def cover(img: Image.Image, w: int, h: int) -> Image.Image:
    ratio = max(w / img.width, h / img.height)
    size = (round(img.width * ratio), round(img.height * ratio))
    resized = img.resize(size, Image.LANCZOS)
    left = (resized.width - w) // 2
    top = (resized.height - h) // 2
    return resized.crop((left, top, left + w, top + h))


def to_webp(src: str, dest: str, size: tuple[int, int] | None = None, quality: int = 82) -> str:
    img = Image.open(src)
    if size:
        if img.mode == "RGBA":
            img = img.copy()
            img.thumbnail(size, Image.LANCZOS)
        else:
            img = cover(img.convert("RGB"), size[0], size[1])
    img.save(dest, "WEBP", quality=quality, method=6)
    print(f"[webp] {os.path.basename(dest):<28} {os.path.getsize(dest) // 1024:>4}KB")
    return dest


def collect(directory: str, prefix: str) -> list[str]:
    return sorted(
        n for n in os.listdir(directory)
        if n.startswith(prefix) and n.endswith(".png") and not n.endswith("_cut.png")
    )


def main() -> int:
    bgs: dict[str, str] = {}
    chars: dict[str, str] = {}
    foods: dict[str, str] = {}

    for name in collect(BG_DIR, "bg_"):
        key = name[:-4]
        dest = os.path.join(BG_DIR, f"{key}.webp")
        to_webp(os.path.join(BG_DIR, name), dest, (1280, 720), quality=82)
        bgs[key] = f"../assets/bg/{key}.webp"

    for name in collect(CH_DIR, "ch_"):
        key = name[:-4]
        cut = os.path.join(CH_DIR, f"{key}_cut.png")
        if not os.path.exists(cut):
            cut = cutout(os.path.join(CH_DIR, name))
        dest = os.path.join(CH_DIR, f"{key}.webp")
        to_webp(cut, dest, (420, 640), quality=86)
        chars[key] = f"../assets/ch/{key}.webp"

    for name in collect(FOOD_DIR, "food_"):
        key = name[:-4]
        # 食物卡保留白底：盘子是白的，抠掉反而只剩菜，看起来更奇怪
        dest = os.path.join(FOOD_DIR, f"{key}.webp")
        to_webp(os.path.join(FOOD_DIR, name), dest, (220, 220), quality=86)
        foods[key] = f"../assets/food/{key}.webp"

    lines = [
        "/**",
        " * 素材索引。由 tools/pack.py 生成，不要手改。",
        " */",
    ]
    for name, mapping, prefix in (
        ("backgrounds", bgs, "bg"),
        ("actors", chars, "ch"),
        ("foods", foods, "food"),
    ):
        for key in sorted(mapping):
            var = f"{prefix}_{key.replace('-', '_')}"
            lines.append(f"import {var} from '{mapping[key]}';")
        lines.append("")
        lines.append(f"export const {name}: Record<string, string> = {{")
        for key in sorted(mapping):
            var = f"{prefix}_{key.replace('-', '_')}"
            lines.append(f"  '{key}': {var},")
        lines.append("};")
        lines.append("")
    with open(INDEX, "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))
    print(f"[index] {len(bgs)} 背景 / {len(chars)} 立绘 / {len(foods)} 食物卡")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
