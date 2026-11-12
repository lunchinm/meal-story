"""调用本机 ComfyUI(127.0.0.1:8188) 批量出图。

用法:
  python tools/gen.py tools/jobs/bg.json          # 跑一份任务表
  python tools/gen.py tools/jobs/bg.json --only bg_canteen

任务表格式(JSON 数组):
  {"id": "bg_canteen", "out": "assets/bg/bg_canteen.png",
   "prompt": "...", "negative": "...", "w": 1344, "h": 768,
   "steps": 28, "cfg": 5.5, "seed": 12345, "ckpt": "Illustrious-XL-v1.0.safetensors",
   "hires": false, "prefix": "meal"}
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

HOST = "http://127.0.0.1:8188"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_NEG = (
    "lowres, worst quality, bad anatomy, bad hands, extra fingers, watermark, text, "
    "signature, jpeg artifacts, photorealistic, 3d render, blurry, deformed"
)


def build_workflow(job: dict) -> dict:
    ckpt = job.get("ckpt", "Illustrious-XL-v1.0.safetensors")
    w = int(job.get("w", 1024))
    h = int(job.get("h", 1024))
    steps = int(job.get("steps", 26))
    cfg = float(job.get("cfg", 6.0))
    seed = int(job.get("seed", 12345))
    prompt = job["prompt"]
    neg = job.get("negative", DEFAULT_NEG)

    wf: dict[str, dict] = {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["4", 1]}},
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
            },
        },
    }

    decode: list = ["3", 0]
    if job.get("hires"):
        wf["10"] = {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}}
        wf["11"] = {
            "class_type": "ImageScaleBy",
            "inputs": {"upscale_method": "lanczos", "scale_by": float(job.get("hires_scale", 1.5)), "image": ["10", 0]},
        }
        wf["12"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["11", 0], "vae": ["4", 2]}}
        wf["13"] = {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed + 1,
                "steps": max(12, steps // 2),
                "cfg": max(4.5, cfg - 0.5),
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "denoise": float(job.get("hires_denoise", 0.35)),
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["12", 0],
            },
        }
        wf["14"] = {"class_type": "VAEDecode", "inputs": {"samples": ["13", 0], "vae": ["4", 2]}}
        decode = ["14", 0]
    else:
        wf["8"] = {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}}
        decode = ["8", 0]

    wf["9"] = {"class_type": "SaveImage", "inputs": {"filename_prefix": job.get("prefix", "meal"), "images": decode}}
    return wf


def queue(wf: dict) -> str:
    body = json.dumps({"prompt": wf, "client_id": str(uuid.uuid4())}).encode()
    req = urllib.request.Request(f"{HOST}/prompt", data=body, headers={"content-type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())["prompt_id"]


def wait_for(pid: str, timeout: float = 600.0) -> dict:
    started = time.time()
    while time.time() - started < timeout:
        time.sleep(1.5)
        try:
            hist = json.loads(urllib.request.urlopen(f"{HOST}/history/{pid}", timeout=15).read())
        except Exception:
            continue
        if pid in hist:
            return hist[pid]
    raise TimeoutError(f"prompt {pid} timeout")


def download(item: dict, dest: str) -> None:
    query = urllib.parse.urlencode(
        {"filename": item["filename"], "subfolder": item.get("subfolder", ""), "type": item.get("type", "output")}
    )
    data = urllib.request.urlopen(f"{HOST}/view?{query}", timeout=120).read()
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, "wb") as handle:
        handle.write(data)


def run_job(job: dict) -> str:
    wf = build_workflow(job)
    started = time.time()
    pid = queue(wf)
    record = wait_for(pid)
    images = [img for node in record.get("outputs", {}).values() for img in node.get("images", [])]
    if not images:
        raise RuntimeError(f"{job['id']}: 没有返回图片")
    dest = os.path.join(ROOT, job["out"])
    download(images[0], dest)
    size = os.path.getsize(dest)
    print(f"[ok] {job['id']:<22} {time.time() - started:6.1f}s {size // 1024:5d}KB -> {job['out']}")
    return dest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("jobs")
    parser.add_argument("--only", default=None, help="只跑 id 含该子串的任务")
    parser.add_argument("--force", action="store_true", help="已存在也重跑")
    args = parser.parse_args()

    with open(args.jobs, "r", encoding="utf-8") as handle:
        jobs = json.load(handle)

    for job in jobs:
        if args.only and args.only not in job["id"]:
            continue
        dest = os.path.join(ROOT, job["out"])
        if os.path.exists(dest) and not args.force:
            print(f"[skip] {job['id']} 已存在")
            continue
        try:
            run_job(job)
        except Exception as exc:  # 单张失败不打断整批
            print(f"[fail] {job['id']}: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
