"""自动挑选干净的立绘。

问题：模型偶尔会在角色周围画色块（粉条、蓝块），抠图时会被当成角色留下。
做法：同一角色换种子重出几张，抠完后算“主体占整张画布的比例”——
带了色块的图比例会明显偏高；取比例最低且不太小的那张。
"""
from __future__ import annotations

import json
import os
import shutil
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TMP = os.path.join(ROOT, "tools", "out")
sys.path.insert(0, HERE)

import cutout  # noqa: E402
import gen  # noqa: E402

MAX_TRIES = 4
GOOD_RATIO = 0.52      # 到这个数就可以停
MIN_RATIO = 0.30       # 低于这个大概把角色也抠没了，不要


def global_ratio(cut_path: str, size: tuple[int, int]) -> float:
    alpha = np.asarray(Image.open(cut_path).convert("RGBA").getchannel("A"))
    w, h = size
    return float((alpha > 128).sum()) / float(w * h)


def main() -> int:
    os.makedirs(TMP, exist_ok=True)
    jobs = json.load(open(os.path.join(HERE, "jobs", "chars.json"), encoding="utf-8"))
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for job in jobs:
        if only and only not in job["id"]:
            continue
        base_seed = int(job["seed"])
        cut_path = os.path.join(ROOT, job["out"].replace(".png", "_cut.png"))
        best_ratio = 9.9
        best_copy = os.path.join(TMP, f"best_{job['id']}.png")
        for attempt in range(MAX_TRIES):
            job["seed"] = base_seed + attempt * 41
            try:
                gen.run_job(job)
            except Exception as exc:  # noqa: BLE001
                print(f"[fail] {job['id']} seed={job['seed']}: {exc}", flush=True)
                continue
            raw = os.path.join(ROOT, job["out"])
            size = Image.open(raw).size
            cut = cutout.cutout(raw)
            ratio = global_ratio(cut, size)
            print(f"[try] {job['id']} seed={job['seed']} 全局占比 {ratio:.2f}", flush=True)
            if MIN_RATIO <= ratio < best_ratio:
                best_ratio = ratio
                shutil.copyfile(cut, best_copy)
            if MIN_RATIO <= ratio <= GOOD_RATIO:
                break
        if best_ratio < 9.9:
            shutil.copyfile(best_copy, cut_path)
            os.remove(best_copy)
            print(f"[pick] {job['id']} 用占比 {best_ratio:.2f} 那张", flush=True)
        else:
            print(f"[warn] {job['id']} 没有合格结果，保留原图", flush=True)
        job["seed"] = base_seed
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
