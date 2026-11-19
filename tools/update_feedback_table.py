# -*- coding: utf-8 -*-
"""按当前 WebGAL 版内容重建《今天吃什么》审核反馈表。"""
import io
import json
import re
import tempfile
from copy import copy
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.drawing.image import Image as XLImage
from openpyxl.utils import get_column_letter
from PIL import Image as PILImage

ROOT = Path(r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story")
XLSX = Path(r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\文档\今天吃什么_审核反馈表.xlsx")
VERSION = "20261119ab"

wb = load_workbook(XLSX, data_only=False)
cover, audio, res, bug, sug = wb.worksheets[:5]


def styles_of(ws, row=2, cols=8):
    return {c: copy(ws.cell(row=row, column=c)._style) for c in range(1, cols + 1)}


def clear_rows(ws):
    if ws.max_row > 1:
        ws.delete_rows(2, ws.max_row - 1)
    ws._images = []


def write_row(ws, r, values, styles):
    for c, v in enumerate(values, 1):
        cell = ws.cell(row=r, column=c, value=v)
        if c in styles:
            cell._style = copy(styles[c])
    ws.row_dimensions[r].height = 30


# ---------- 填写说明 ----------
cover["A1"] = "《今天吃什么？——校园膳食调查簿》审核反馈表"
cover["A2"] = f"版本 {VERSION} · 2026-11-19"
cover["A3"], cover["B3"] = "用途", "用于收集对本作品剧情、配音、素材与交互的审核意见；可直接在对应表填写。"
cover["A4"], cover["B4"] = "适用范围", "音频表（逐句台词）、资源表（当前构建实际引用素材）、缺陷记录、优化建议。"
cover["A5"], cover["B5"] = "填写方式", "白色/浅绿色单元格为可填写区；表头深绿色为说明信息，不要改动。"
cover["A6"], cover["B6"] = "音频表", "740 句台词逐句列出；群聊按设计不配音，文本台词标记已配/未配。"
cover["A7"], cover["B7"] = "资源表", "仅列出当前构建实际引用的背景/立绘/道具/图片消息，附缩略图与使用章节。"
cover["A8"], cover["B8"] = "缺陷表", "记录复现路径、严重程度与当前状态；已修复项留档，避免重复排查。"
cover["A9"], cover["B9"] = "当前交付", "四章 + 三结局可玩；主回归 32/32、功能回归 9/9 通过。"
cover["A10"], cover["B10"] = "线上地址", "https://lunchinm.github.io/meal-story/?v=20261119ab"

# ---------- 音频 ----------
aud_styles = styles_of(audio, 2, 8)
clear_rows(audio)
voice_dir = ROOT / "assets" / "voice"
voice_ids = {p.stem for p in voice_dir.glob("*.mp3")}
rows = []
for a in (1, 2, 3, 4):
    for n in json.loads((ROOT / "content" / f"act{a}.json").read_text(encoding="utf-8")):
        if n.get("type") != "say" or not n.get("text"):
            continue
        is_chat = n.get("channel") == "chat"
        if is_chat:
            status, why = "群聊不配音", "群聊消息，按设计不使用配音"
        elif n["id"] in voice_ids:
            status, why = "已配音", ""
        else:
            status, why = "未配音", "文本场景台词，当前音频缺失"
        rows.append([len(rows) + 1, f"第{a}章", n["id"], n.get("speaker") or "旁白", n.get("text", ""), status, why, ""])
for i, row in enumerate(rows, 2):
    write_row(audio, i, row, aud_styles)
audio_count = len(rows)
audio.auto_filter.ref = f"A1:H{len(rows)+1}"

# ---------- 资源 ----------
res_styles = styles_of(res, 2, 8)
clear_rows(res)

acts_by_file = {}
for a in (1, 2, 3, 4):
    txt = (ROOT / "webgal-game" / "scene" / f"act{a}.txt").read_text(encoding="utf-8")
    for m in re.finditer(r"change(?:Bg|Figure):([\w.-]+\.webp)", txt):
        acts_by_file.setdefault(m.group(1), set()).add(a)

chat_files = set(re.findall(r'"chat_[\w.-]+\.webp"', (ROOT / "webgal-game" / "theme-inject.js").read_text(encoding="utf-8")))
chat_files = {x.strip('"') for x in chat_files}

buckets = [("背景", "bg"), ("立绘", "ch"), ("道具 / UI", "props")]
used = []
for kind, sub in buckets:
    for f in sorted((ROOT / "assets" / sub).glob("*.webp")):
        if f.name in acts_by_file:
            real_kind = "道具 / UI" if f.name.startswith("ui_") else kind
            used.append((real_kind, sub, f))
for f in sorted((ROOT / "assets" / "bg").glob("chat_*.webp")):
    if f.name in chat_files and (f.name not in acts_by_file):
        used.append(("图片消息", "bg", f))

thumb_dir = Path(tempfile.mkdtemp(prefix="meal-thumbs-"))
SPECS = {
    "背景": "1920×1080 / webp",
    "立绘": "900px 高 / 透明 webp",
    "道具 / UI": "透明 webp / 建议 800px",
    "图片消息": "544×384 / webp",
}
rows = []
for idx, (kind, sub, f) in enumerate(used, 1):
    acts = sorted(acts_by_file.get(f.name, []))
    if kind == "图片消息":
        where = "群聊图片消息"
    elif not acts:
        where = "全篇通用"
    elif kind == "立绘":
        where = "第" + "/".join(map(str, acts)) + "章 角色立绘"
    elif kind == "背景":
        where = "第" + "/".join(map(str, acts)) + "章 场景背景"
    else:
        where = "互动面板 / 道具图"
    size_kb = max(1, round(f.stat().st_size / 1024))
    notes = f"{size_kb} KB"
    if f.name in {"ui_poster.webp", "ui_tray.webp", "ui_product_front.webp", "ui_product_back.webp"}:
        notes += "；占位待替换"
    rows.append([idx, kind, f.name, SPECS.get(kind, ""), "", where, "", notes])

for i, row in enumerate(rows, 2):
    write_row(res, i, row, res_styles)
    res.row_dimensions[i].height = 84

for i, (kind, sub, f) in enumerate(used, 2):
    try:
        im = PILImage.open(f).convert("RGBA")
        im.thumbnail((150, 78))
        canvas = PILImage.new("RGB", (150, 78), (252, 249, 240))
        canvas.paste(im, ((150 - im.width) // 2, (78 - im.height) // 2), im if im.mode == "RGBA" else None)
        tp = thumb_dir / f"{i}.png"
        canvas.save(tp)
        pic = XLImage(str(tp))
        pic.width, pic.height = 150, 78
        res.add_image(pic, f"E{i}")
    except Exception:
        pass
res.auto_filter.ref = f"A1:H{len(rows)+1}"

# ---------- 缺陷 ----------
bug_styles = styles_of(bug, 2, 7)
clear_rows(bug)
bugs = [
    ["BUG-001", "选项 / 分支", "第二章回访、第四章发布与修订", "严重",
     "选项 next 未编译，选“先发布”仍进入试行，选“不改”仍记录完成修订，三结局不可达", "每个选项跳转到真实目标，flag 写入引擎变量", "已修复"],
    ["BUG-002", "系统 / 上一句", "纸面右上角 ← 上一句", "严重",
     "回退只移动语句指针，不恢复舞台与变量，跨章失效", "改用原生回想快照 jumpFromBacklog 恢复", "已修复"],
    ["BUG-003", "标题 / 启动", "打开首页、点击开始游戏", "严重",
     "PRESS 页/加载页闪现；高分辨率下原生标题被误判为面板，只剩返回/标题", "预载隐藏原生层；排除标题页；直接调用引擎开始", "已修复"],
    ["BUG-004", "发布 / 缓存", "更新后再次打开线上页", "严重",
     "WebGAL 自带 Service Worker 缓存旧入口，刷新仍是旧版", "构建时强制注销 SW 并清理缓存", "已修复"],
    ["BUG-005", "环境 / 扩展", "Edge 装了沉浸式翻译等扩展", "一般",
     "翻译扩展注入样式，把自绘层撑到异常高度，只剩原生文本框", "关闭该站自动翻译或用无痕窗口", "已定位（环境）"],
    ["BUG-006", "音频覆盖", "第二至四章文本台词", "一般",
     "579 句文本台词中 132 句缺配音，构建时自动跳过 vocal", "补齐对应节点 mp3", "待补"],
    ["BUG-007", "素材", "核实 / 配餐 / 瓶身 / 结局", "一般",
     "四类正式美术仍为纸质自绘或文字占位", "按资源表规格补图并替换", "待补"],
    ["BUG-008", "跳关", "act2 全部节点", "轻微",
     "第二章无 seg，只能按整章跳转，无法按段核对", "补 seg 后重跑转换与导出", "待处理"],
]
for i, row in enumerate(bugs, 2):
    write_row(bug, i, row, bug_styles)

# ---------- 建议 ----------
sug_styles = styles_of(sug, 2, 7)
clear_rows(sug)
sugs = [
    ["SUG-001", "配音补齐", "第二至四章", "132 句文本台词尚未配音", "按音频表“未配音（待补）”批量生成并绑定", "高", ""],
    ["SUG-002", "正式素材", "核实 / 配餐 / 瓶身 / 结局", "四类占位影响成品感", "优先补宣传海报与四格餐盘，其次瓶身与结局卡", "高", ""],
    ["SUG-003", "章节分段", "act2", "跳关颗粒度粗", "按记录与汇合点补 seg，重跑 jump.json", "中", ""],
    ["SUG-004", "结尾流程", "第四章末段", "发布/试行与前面叙事有重复感", "按前段选择跳过已完成的试行步骤", "中", ""],
    ["SUG-005", "移动端", "全篇", "小屏字号与触控区域偏小", "增加横屏提示与字号档位", "低", ""],
]
for i, row in enumerate(sugs, 2):
    write_row(sug, i, row, sug_styles)

# 统一列宽与表头
for ws in (audio, res, bug, sug):
    ws.freeze_panes = "A2"
    ws.sheet_view.showGridLines = False
audio.column_dimensions["E"].width = 60
audio.column_dimensions["F"].width = 16
audio.column_dimensions["G"].width = 42
res.column_dimensions["D"].width = 24
res.column_dimensions["E"].width = 20
res.column_dimensions["F"].width = 30
res.column_dimensions["G"].width = 24
res.column_dimensions["H"].width = 26
bug.column_dimensions["G"].width = 16

wb.save(XLSX)
print("saved", XLSX)
print("audio", audio_count, "resources", res.max_row - 1, "bugs", bug.max_row - 1, "sugs", sug.max_row - 1)
