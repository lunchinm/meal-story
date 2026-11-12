"""给 assets/voice 生成清单：哪个节点、谁说、多长。

顺手当素材核对表用：内容是哪个、配音有没有缺。
"""
from __future__ import annotations

import json
import os
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = os.path.join(ROOT, "assets", "voice")


def duration(wav_or_mp3: str) -> float:
    """只有 wav 能直接读；mp3 用 ffprobe 太麻烦，这里用文件大小估算（96kbps）。"""
    size = os.path.getsize(wav_or_mp3)
    return round(size * 8 / 96000, 2)


def main() -> int:
    nodes = []
    for n in (1, 2, 3, 4):
        nodes.extend(json.load(open(os.path.join(ROOT, "content", f"act{n}.json"), encoding="utf-8")))

    rows = []
    missing = []
    for node in nodes:
        if node.get("type") != "say":
            continue
        path = os.path.join(VOICE, f"{node['id']}.mp3")
        speaker = node.get("speaker") or "旁白"
        if not os.path.exists(path):
            missing.append(node["id"])
            continue
        rows.append(
            {
                "id": node["id"],
                "speaker": speaker,
                "file": f"{node['id']}.mp3",
                "seconds": duration(path),
            }
        )

    manifest = {"count": len(rows), "missing": missing, "items": rows}
    with open(os.path.join(VOICE, "manifest.json"), "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
    print(f"[manifest] {len(rows)} 条已配，缺 {len(missing)} 条")
    if missing:
        print("缺:", ", ".join(missing))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
