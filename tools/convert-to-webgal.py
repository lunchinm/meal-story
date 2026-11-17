# -*- coding: utf-8 -*-
"""把 content/act*.json 转成 WebGAL 脚本（game/scene/*.txt）。

第一版覆盖：章节卡、对白、选项（含分支回复）、记录（写成注释）、结局。
分支/记录暂按线性处理，后续再换成 setVar + jumpLabel。
"""
import io
import json
import os
import re

MS = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story"
OUT = os.path.join(MS, "webgal-game", "scene")
SCENE_BG = {
    "class": "bg_class.webp",
    "canteen": "bg_canteen.webp",
    "store": "bg_store.webp",
    "chat": "bg_chat.webp",
}
ENDBG = {
    "ending_normal": "ending_normal.webp",
    "ending_advanced": "ending_advanced.webp",
    "ending_hidden": "ending_hidden.webp",
}


def esc(text: str) -> str:
    """WebGAL 用英文冒号、分号、竖线做语法，正文里的要按官方规则转义。"""
    return (text.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(":", "\\:")
                .replace("|", "\\|")
                .replace(",", "\\,"))


def say_line(speaker: str | None, text: str) -> str:
    body = esc(text)
    return f"{speaker or ''}:{body};"


def convert_act(act: int) -> list[str]:
    data = json.load(io.open(os.path.join(MS, "content", f"act{act}.json"), encoding="utf-8"))
    lines: list[str] = []
    last_scene = None
    last_speaker = None
    label_seq = 0

    for node in data:
        kind = node["type"]

        if kind == "chapter":
            lines.append(f"; ==== {node.get('title', '')} ====")
            # 第一句必须是 say：否则 changeBg / changeFigure 会卡住整个脚本
            lines.append(f":{esc(node.get('title', '') or '第一章')};")
            if node.get("image"):
                lines.append(f"changeBg:{node['image']}.webp;")
            continue

        if kind == "say":
            scene = node.get("scene")
            if scene and scene != last_scene:
                lines.append(f"changeBg:{SCENE_BG.get(scene, 'bg_class.webp')};")
                last_scene = scene
            if node.get("actor"):
                lines.append(f"changeFigure:ch_{node['actor']}_{node.get('expr', 'normal')}.webp -center -id={node['actor']};")
            speaker = node.get("speaker")
            text = node.get("text", "")
            if node.get("prop"):
                lines.append(f"; 道具：{node['prop']}")
            lines.append(say_line(None if speaker in (None, "旁白") else speaker, text))
            last_speaker = speaker
            continue

        if kind == "choice":
            options = node.get("options", [])
            if not options:
                continue
            parts = []
            for index, option in enumerate(options):
                label = f"c{act}_{node['id']}_{index}".replace("-", "_")
                parts.append(f"{esc(option.get('text', '继续'))}:{label}")
            lines.append("choose:" + "|".join(parts) + ";")
            for index, option in enumerate(options):
                label = f"c{act}_{node['id']}_{index}".replace("-", "_")
                lines.append(f"label:{label};")
                reply = option.get("reply")
                if reply:
                    seq = reply if isinstance(reply, list) else [reply]
                    for entry in seq:
                        if isinstance(entry, str):
                            lines.append(say_line(None, entry))
                        else:
                            lines.append(say_line(entry.get("speaker"), entry.get("text", "")))
                lines.append(f"jumpLabel:after_{node['id']}".replace("-", "_") + ";")
            lines.append(f"label:after_{node['id']}".replace("-", "_") + ";")
            continue

        if kind == "ending":
            bg = ENDBG.get(node.get("image", ""), "ending_normal.webp")
            lines.append(f"changeBg:{bg};")
            lines.append("changeFigure:none -center;")
            lines.append(f"intro:{esc(node.get('title', '结局'))}|{esc(' '.join(node.get('body', [])))};")
            lines.append("end;")
            continue

        if kind == "record":
            lines.append(f"; 记录：{node.get('label', '')}")
            continue

        if kind == "branch":
            continue

        # plate / evidence / compare / explore / notebook / random 暂略
        lines.append(f"; 互动节点（待迁移）：{node['id']} [{kind}]")

    return lines


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    acts = {act: convert_act(act) for act in (1, 2, 3, 4)}

    # 分卷（备用，不参与运行）
    for act, body in acts.items():
        io.open(os.path.join(OUT, f"act{act}.txt"), "w", encoding="utf-8").write("\n".join(body) + "\n")

    # 主脚本：四章串成一条，开头必须是 say，否则 WebGAL 不放立绘
    lines = ["; 《今天吃什么？》WebGAL 版（自动生成，勿手改）"]
    for act in (1, 2, 3, 4):
        lines.extend(acts[act])
    lines.append("end;")
    io.open(os.path.join(OUT, "start.txt"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"start.txt: {len(lines)} 行；分卷 " + "、".join(f"act{a}:{len(b)}" for a, b in acts.items()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
