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

# 配音清单：assets/voice/<节点id>.mp3
VOICE_DIR = os.path.join(MS, "assets", "voice")
VOICE_IDS = set()
if os.path.isdir(VOICE_DIR):
    VOICE_IDS = {os.path.splitext(f)[0] for f in os.listdir(VOICE_DIR) if f.endswith(".mp3")}
# 场景 → 背景图（全部来自 galgame 素材，按章节换氛围）
PROP_FIG = {
    "poster": "ui_poster.webp",
    "menu": "ui_menu.webp",
    "tray": "ui_tray.webp",
    "note": "ui_note.webp",
    "product_front": "ui_product_front.webp",
    "product_back": "ui_product_back.webp",
    "nutrition": "ui_nutrition.webp",
}

SCENE_BG = {
    "class": "bg_club.webp",
    "canteen": "bg_canteen_sun.webp",
    "store": "bg_store_afternoon.webp",
    "chat": "bg_dorm_night.webp",
}

SCENE_BG_BY_ACT = {
    1: {"chat": "bg_dorm_night.webp", "canteen": "bg_canteen_sun.webp",
        "store": "bg_store_afternoon.webp", "class": "bg_club.webp"},
    2: {"chat": "bg_desk_warm.webp", "canteen": "bg_canteen_night.webp",
        "store": "bg_store_sun.webp", "class": "bg_club.webp"},
    3: {"chat": "bg_dorm_night.webp", "canteen": "bg_canteen_noon.webp",
        "store": "bg_store_blue.webp", "class": "bg_club.webp"},
    4: {"chat": "bg_desk_warm.webp", "canteen": "bg_canteen_sun.webp",
        "store": "bg_store_outside.webp", "class": "bg_club.webp"},
}

# 章节封面 / 结局插画也来自 galgame
IMAGE_BG = {
    "ch_banner_1": "bg_canteen_sun.webp",
    "ch_banner_2": "bg_canteen_night.webp",
    "ch_banner_3": "bg_store_blue.webp",
    "ch_banner_4": "bg_gingko.webp",
    "poster_meal": "bg_notebook.webp",
    "ending_normal": "bg_canteen_sun.webp",
    "ending_advanced": "bg_gingko.webp",
    "ending_hidden": "bg_notebook.webp",
}

# 结局背景（兜底也用 galgame 素材）
ENDBG = {
    "ending_normal": "bg_canteen_sun.webp",
    "ending_advanced": "bg_gingko.webp",
    "ending_hidden": "bg_notebook.webp",
}


def esc(text: str) -> str:
    """WebGAL 用英文冒号、分号、竖线做语法，正文里的要按官方规则转义。"""
    return (text.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(":", "\\:")
                .replace("|", "\\|")
                .replace(",", "\\,"))


def say_line(speaker: str | None, text: str, voice_id: str | None = None) -> str:
    body = esc(text)
    vocal = ""
    if voice_id and voice_id in VOICE_IDS:
        if os.path.exists(os.path.join(VOICE_DIR, voice_id + ".mp3")):
            vocal = f" -vocal={voice_id}.mp3"
    return f"{speaker or ''}:{body}{vocal};"


def convert_act(act: int) -> list[str]:
    data = json.load(io.open(os.path.join(MS, "content", f"act{act}.json"), encoding="utf-8"))
    lines: list[str] = []
    last_scene = None
    last_speaker = None
    last_actor = None
    label_seq = 0

    for node in data:
        kind = node["type"]

        if kind == "chapter":
            lines.append(f"; ==== {node.get('title', '')} ====")
            # 第一句必须是 say：否则 changeBg / changeFigure 会卡住整个脚本
            lines.append(f":{esc(node.get('title', '') or '第一章')};")
            lines.append("bgm:bgm_loop.mp3 -volume=45;")
            if node.get("image"):
                lines.append(f"changeBg:{IMAGE_BG.get(node['image'], 'bg_canteen_sun.webp')} -next -duration=350;")
            continue

        if kind == "say":
            prop = node.get("prop")
            if prop and prop in PROP_FIG:
                lines.append("changeFigure:none -center -next;")
                lines.append(
                    f'changeFigure:{PROP_FIG[prop]} -center '
                    f'-transform={{"scale":{{"x":0.5,"y":0.5}},"position":{{"x":0,"y":-60}}}} -next;'
                )

            scene = node.get("scene")
            if scene and scene != last_scene:
                table = SCENE_BG_BY_ACT.get(act, {})
                bg = table.get(scene) or SCENE_BG.get(scene, "bg_class.webp")
                lines.append(f"changeBg:{bg} -next -duration=350;")
                last_scene = scene
            if node.get("actor"):
                actor = node["actor"]
                if actor != last_actor:
                    # 换人：先清场，避免立绘叠在一起
                    lines.append("changeFigure:none -center -next -duration=350;")
                    last_actor = actor
                lines.append(
                    f"changeFigure:ch_{actor}_{node.get('expr', 'normal')}.webp -center "
                    f'-transform={{"scale":{{"x":0.62,"y":0.62}},"position":{{"x":0,"y":150}}}} -next;'
                )
            speaker = node.get("speaker")
            text = node.get("text", "")
            if node.get("prop"):
                lines.append(f"; 道具：{node['prop']}")
            voice = None if node.get("channel") == "chat" else node.get("id")  # 群聊不配音
            lines.append(say_line(None if speaker in (None, "旁白") else speaker, text, voice))
            last_speaker = speaker
            continue

        if kind == "choice":
            options = node.get("options", [])
            if not options:
                continue
            if len(options) == 1:
                # 只有一个选项时 WebGAL 的选项面板不出，直接当一句自白播
                only = options[0]
                reply = only.get("reply")
                if reply:
                    seq = reply if isinstance(reply, list) else [reply]
                    for entry in seq:
                        if isinstance(entry, str):
                            lines.append(say_line(None, entry))
                        else:
                            lines.append(say_line(entry.get("speaker"), entry.get("text", "")))
                lines.append(say_line(None, only.get("text", "")))
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
            lines.append(f"changeBg:{bg} -next -duration=350;")
            lines.append("changeFigure:none -center -next -duration=350;")
            lines.append(f"intro:{esc(node.get('title', '结局'))}|{esc(' '.join(node.get('body', [])))};")
            lines.append("end;")
            continue

        if kind == "record":
            lines.append(f"; 记录：{node.get('label', '')}")
            continue

        if kind == "plate":
            lines.append("changeFigure:none -center -next -duration=350;")
            lines.append('changeFigure:ui_tray.webp -center -transform={"scale":{"x":0.74,"y":0.74},"position":{"x":0,"y":-30}} -next;')
            tip = node.get("tip", "")
            text = node.get("text", "")
            if tip:
                lines.append(say_line(None, tip))
            if text:
                lines.append(say_line(node.get("speaker"), text))
            base = f"plate_{node['id']}".replace("-", "_")
            lines.append(
                "choose:"
                "米饭 + 青菜 + 番茄炒蛋（12 元）:" + base + "_a|"
                "两份米饭 + 土豆丝（12 元）:" + base + "_b|"
                "红烧肉 + 米饭（14 元）:" + base + "_c;"
            )
            lines.append(f"label:{base}_a;")
            lines.append(say_line(None, "主食、蔬菜、蛋白都齐了，也没超预算。"))
            lines.append(f"jumpLabel:{base}_end;")
            lines.append(f"label:{base}_b;")
            lines.append(say_line(None, "两份主食叠在一起，蛋白和蔬菜都缺。"))
            lines.append(f"jumpLabel:{base}_end;")
            lines.append(f"label:{base}_c;")
            lines.append(say_line(None, "超了预算，蔬菜还是没有。"))
            lines.append(f"label:{base}_end;")
            lines.append("changeFigure:none -center -next -duration=350;")
            continue

        if kind == "compare":
            lines.append("changeFigure:none -center -next -duration=350;")
            lines.append('changeFigure:ui_product_front.webp -center -transform={"scale":{"x":0.72,"y":0.72},"position":{"x":0,"y":-20}} -next;')
            prompt = node.get("prompt", "")
            if prompt:
                lines.append(say_line(None, prompt))
            for offer in node.get("offers", []):
                lines.append(f"; 货架：{offer.get('name', '')}")
                for row in offer.get("back", []):
                    lines.append(say_line(None, row))
            base = f"cmp_{node['id']}".replace("-", "_")
            worse = node.get("worse", "")
            names = [o.get("name", "") for o in node.get("offers", [])] or ["左边", "右边"]
            opts = "|".join(f"{n} 更甜:{base}_{i}" for i, n in enumerate(names))
            lines.append(f"choose:{opts};")
            for i, offer in enumerate(node.get("offers", [])):
                lines.append(f"label:{base}_{i};")
                if offer.get("id") == worse:
                    lines.append(say_line(None, offer.get("note", "")))
                else:
                    lines.append(say_line(None, "这瓶糖少一些，但主要还是喝水。"))
                lines.append(f"jumpLabel:{base}_end;")
            lines.append(f"label:{base}_end;")
            lines.append("changeFigure:none -center -next -duration=350;")
            continue

        if kind == "explore":
            lines.append("changeFigure:none -center -next -duration=350;")
            lines.append('changeFigure:ui_note.webp -center -transform={"scale":{"x":0.66,"y":0.66},"position":{"x":0,"y":-10}} -next;')
            lines.append("changeFigure:none -center -next -duration=350;")
            lines.append('changeFigure:ui_poster.webp -center -transform={"scale":{"x":0.62,"y":0.62},"position":{"x":0,"y":0}} -next;')
            title = node.get("title", "")
            if title:
                lines.append(say_line(None, title))
            base = f"exp_{node['id']}".replace("-", "_")
            items = node.get("items", [])
            for idx, item in enumerate(items):
                lines.append(f"label:{base}_{idx};")
                for ln in item.get("lines", []):
                    lines.append(say_line(ln.get("speaker"), ln.get("text", "")))
                lines.append(f"jumpLabel:{base}_out;")
            lines.append(f"label:{base}_menu;")
            opts = "|".join(f"{it.get('label', '')}:{base}_{i}" for i, it in enumerate(items))
            opts += "|先看到这里:" + base + "_out"
            lines.append(f"choose:{opts};")
            lines.append(f"label:{base}_out;")
            lines.append("changeFigure:none -center -next -duration=350;")
            continue

        if kind == "notebook":
            title = node.get("title", "")
            if title:
                lines.append(say_line(None, title))
            for entry in node.get("entries", []):
                lines.append(say_line(None, entry.get("label", "")))
                lines.append(say_line(None, entry.get("text", "")))
                src = entry.get("source", "")
                if src:
                    lines.append(say_line(None, f"（出处：{src}）"))
            continue

        if kind == "random":
            pool = node.get("pool", [])
            if pool:
                base = f"rnd_{node['id']}".replace("-", "_")
                opts = "|".join(f"遇到第 {i + 1} 种情况:{base}_{i}" for i, _ in enumerate(pool))
                lines.append(f"choose:{opts};")
                for i, item in enumerate(pool):
                    lines.append(f"label:{base}_{i};")
                    lines.append(f"jumpLabel:{item.get('next', '').replace('-', '_')};")
            continue

        if kind == "branch":
            continue

        # plate / evidence / compare / explore / notebook / random 暂略
        lines.append(f"; 互动节点（待迁移）：{node['id']} [{kind}]")

    return lines


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    for act in (1, 2, 3, 4):
        body = convert_act(act)
        if act < 4:
            body.append(f"changeScene:act{act + 1}.txt;")
        else:
            body.append("end;")
        io.open(os.path.join(OUT, f"act{act}.txt"), "w", encoding="utf-8").write("\n".join(body) + "\n")
        print(f"act{act}.txt: {len(body)} 行")

    # 注意：WebGAL 的第一条语句必须是 say，否则 changeScene 会卡死
    start = [
        "; 《今天吃什么？》WebGAL 版（自动生成，勿手改）",
        ":今天吃什么？——校园膳食调查簿;",
        "changeBg:bg_gingko.webp -next -duration=350;",
        "changeScene:act1.txt;",
    ]
    io.open(os.path.join(OUT, "start.txt"), "w", encoding="utf-8").write("\n".join(start) + "\n")
    print("start.txt: 3 行（开场白 + 跳第一章）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
