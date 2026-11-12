"""把立绘的白／灰／浅色背景抠成透明 PNG。

做法：
  1. 取画布四周的颜色作为背景色（背景都是接近纯色的）
  2. 从四边向内做漫水，只吃掉与边缘连通、且和背景色接近的像素
  3. 边缘羽化 1px，再按内容裁边

这样角色身上接近白的衣服、盘子里的白瓷不会被误抠，因为漫水到轮廓线就停。
"""
from __future__ import annotations

import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def background_color(arr: np.ndarray) -> np.ndarray:
    h, w, _ = arr.shape
    edge = 3
    samples = np.concatenate(
        [
            arr[:edge, :, :].reshape(-1, 3),
            arr[-edge:, :, :].reshape(-1, 3),
            arr[:, :edge, :].reshape(-1, 3),
            arr[:, -edge:, :].reshape(-1, 3),
        ]
    )
    return np.median(samples, axis=0)


def flood(arr: np.ndarray, near: np.ndarray, step_tol: int = 10, seed_tol: int = 48) -> np.ndarray:
    """从四条边往里漫水。

    两个条件同时满足才吃掉：
      - 与当前像素色差很小（能顺着平坦色块走）
      - 与起点颜色差得不算远（防止顺着渐变吃进角色里）
    """
    h, w, _ = arr.shape
    small_arr = arr[::2, ::2].astype(np.int32)
    small_near = near[::2, ::2]
    sh, sw = small_arr.shape[:2]

    visited = np.zeros((sh, sw), dtype=bool)
    seeds: list[tuple[int, int]] = []
    for x in range(sw):
        seeds.append((0, x))
        seeds.append((sh - 1, x))
    for y in range(sh):
        seeds.append((y, 0))
        seeds.append((y, sw - 1))

    queue: deque[tuple[int, int]] = deque()
    for y, x in seeds:
        if not visited[y, x]:
            visited[y, x] = True
            queue.append((y, x))

    while queue:
        y, x = queue.popleft()
        base = small_arr[y, x]
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if not (0 <= ny < sh and 0 <= nx < sw) or visited[ny, nx]:
                continue
            cand = small_arr[ny, nx]
            step = int(np.abs(cand.astype(np.int32) - base.astype(np.int32)).max())
            diff = cand.astype(np.int32) - base.astype(np.int32)
            strict = int(np.sqrt(float((diff ** 2).sum())))
            if small_near[ny, nx] or (step <= step_tol and strict <= seed_tol):
                visited[ny, nx] = True
                queue.append((ny, nx))

    mask_small = Image.fromarray((visited * 255).astype(np.uint8))
    mask = np.asarray(mask_small.resize((w, h), Image.NEAREST)) > 127
    return mask


def largest_blob(foreground: np.ndarray) -> np.ndarray:
    """只保留最大的连通块（在 1/3 缩略上找，再放大回来）。"""
    h, w = foreground.shape
    small = foreground[::3, ::3]
    sh, sw = small.shape
    seen = np.zeros_like(small, dtype=bool)
    best: list[tuple[int, int]] = []

    for sy in range(sh):
        for sx in range(sw):
            if not small[sy, sx] or seen[sy, sx]:
                continue
            queue: deque[tuple[int, int]] = deque([(sy, sx)])
            seen[sy, sx] = True
            blob: list[tuple[int, int]] = []
            while queue:
                y, x = queue.popleft()
                blob.append((y, x))
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < sh and 0 <= nx < sw and small[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
            if len(blob) > len(best):
                best = blob

    keep = np.zeros_like(small, dtype=bool)
    for y, x in best:
        keep[y, x] = True
    up = Image.fromarray((keep * 255).astype(np.uint8)).resize((w, h), Image.NEAREST)
    return np.asarray(up) > 127


def cutout(path: str, out_path: str | None = None, tol: int = 32, feather: float = 1.0) -> str:
    img = Image.open(path).convert("RGB")
    w, h = img.size
    arr = np.asarray(img).astype(np.int16)
    bg = background_color(arr)

    dist = np.sqrt(((arr - bg) ** 2).sum(axis=2))
    near = dist < tol

    # 漫水两段：先按“接近背景色”铺一遍，再沿着平坦色块往外扩（有的图背景带色块）
    background = flood(arr, near, step_tol=10, seed_tol=48)
    # 前景只留最大连通块：背景里漂着的色块（黄块、灰条）会被一起丢掉
    subject = largest_blob(~background)
    background = ~subject

    alpha = np.where(background, 0, 255).astype(np.uint8)
    out = Image.fromarray(np.dstack([np.asarray(img), alpha]), mode="RGBA")
    if feather > 0:
        out.putalpha(out.getchannel("A").filter(ImageFilter.GaussianBlur(feather)))

    bbox = out.getbbox()
    if bbox:
        left, top, right, bottom = bbox
        pad = 6
        out = out.crop(
            (max(0, left - pad), max(0, top - pad), min(w, right + pad), min(h, bottom + pad))
        )

    dest = out_path or path.replace(".png", "_cut.png")
    out.save(dest)
    print(f"[cut] {os.path.basename(path)} -> {os.path.basename(dest)}  背景 {tuple(int(v) for v in bg)}  主体 {100 * (1 - background.mean()):.0f}%")
    return dest


def main() -> int:
    targets = sys.argv[1:]
    if not targets:
        base = os.path.join(ROOT, "assets", "ch")
        targets = [os.path.join(base, n) for n in sorted(os.listdir(base))
                   if n.endswith(".png") and not n.endswith("_cut.png")]
    for path in targets:
        try:
            cutout(path)
        except Exception as exc:
            print(f"[fail] {path}: {exc}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
