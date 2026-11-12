"""同一个角色的三张表情用同一个种子重出，保证衣服发型不走样。

之前是每张表情各自挑最干净的种子，结果同一个人三张穿的衣服都不一样。
现在：一组的 seed 共用，抠图占比不合格就整组换种子重来。

用法：python tools/sprite_locked.py [--only mili]
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
GOOD_RATIO = 0.60


def ratio_of(cut_path: str, size: tuple[int, int]) -> float:
    alpha = np.asarray(Image.open(cut_path).convert("RGBA").getchannel("A"))
    w, h = size
    return float((alpha > 128).sum()) / float(w * h)


def main() -> int:
    os.makedirs(TMP, exist_ok=True)
    jobs = json.load(open(os.path.join(HERE, "jobs", "chars.json"), encoding="utf-8"))
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None

    groups: dict[str, list[dict]] = {}
    for job in jobs:
        key = job["id"].rsplit("_", 1)[0]
        groups.setdefault(key, []).append(job)

    for key, group in groups.items():
        if only and only not in key:
            continue
        base_seed = int(group[0]["seed"])
        best_ratio = 9.9
        best_files: list[tuple[str, str]] = []
        for attempt in range(MAX_TRIES):
            seed = base_seed + attempt * 53
            cuts: list[tuple[str, str]] = []
            worst = 0.0
            ok = True
            for job in group:
                job["seed"] = seed
                try:
                    gen.run_job(job)
                except Exception as exc:  # noqa: BLE001
                    print(f"[fail] {job['id']}: {exc}", flush=True)
                    ok = False
                    break
                raw = os.path.join(ROOT, job["out"])
                size = Image.open(raw).size
                cut = cutout.cutout(raw)
                r = ratio_of(cut, size)
                worst = max(worst, r)
                cuts.append((cut, os.path.join(TMP, os.path.basename(cut))))
                # 先把候选挪到临时目录，挑完再放回，免得被下一轮覆盖
                shutil.copyfile(cut, cuts[-1][1])
            if not ok:
                continue
            print(f"[try] {key} seed={seed} 最差占比 {worst:.2f}", flush=True)
            if worst < best_ratio:
                best_ratio = worst
                if best_files:
                    for _, tmp in best_files:
                        if os.path.exists(tmp):
                            os.remove(tmp)
                best_files = cuts
            else:
                for _, tmp in cuts:
                    if os.path.exists(tmp):
                        os.remove(tmp)
            if worst <= GOOD_RATIO:
                break
        if best_files:
            for cut, tmp in best_files:
                shutil.copyfile(tmp, cut)
                os.remove(tmp)
            print(f"[pick] {key} 用 {best_ratio:.2f} 那一组", flush=True)
        for job in group:
            job["seed"] = base_seed
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
