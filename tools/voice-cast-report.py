# -*- coding: utf-8 -*-
"""配音角色统计表：剧本口径 vs 游戏实际 content 口径，逐角色对账。

剧本口径来自「今天吃什么_审核反馈表.xlsx」的「音频」表（v4.0，逐句标注已配音/未配音并写明原因）。
游戏口径来自 meal-story/content/act*.json（type=say 的节点）。
两边的节点编号逐一比对，找出多出来的、少掉的。
"""
import glob
import io
import json
import os
from collections import Counter, defaultdict

import openpyxl

MS = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story"
XLSX = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\文档\今天吃什么_审核反馈表.xlsx"
OUT_MD = os.path.join(MS, "docs", "配音角色统计-2026-11-18.md")

# ---------- 剧本口径 ----------
wb = openpyxl.load_workbook(XLSX, data_only=True)
ws = wb["音频"]
rows = list(ws.iter_rows(values_only=True))
head = [str(c) if c else "" for c in rows[0]]
idx = {name: i for i, name in enumerate(head)}
COL = dict(
    ch=idx.get("所属章节", 1), nid=idx.get("节点编号", 2), role=idx.get("角色", 3),
    text=idx.get("台词文本", 4), state=idx.get("配音状态", 5), why=idx.get("未配音说明", 6),
)

script = []          # (nid, role, text, 是否需配音, 原因)
for r in rows[1:]:
    if not r or not r[COL["nid"]]:
        continue
    nid = str(r[COL["nid"]]).strip()
    role = str(r[COL["role"]] or "").strip()
    text = str(r[COL["text"]] or "").strip()
    state = str(r[COL["state"]] or "").strip()
    why = str(r[COL["why"]] or "").strip()
    need = state.startswith("已配音")
    script.append((nid, role, text, need, why))

# ---------- 游戏口径 ----------
game = {}
for f in sorted(glob.glob(os.path.join(MS, "content", "act*.json"))):
    for n in json.load(io.open(f, encoding="utf-8")):
        if n.get("type") != "say":
            continue
        role = n.get("speaker", "旁白")
        chat = n.get("channel") == "chat"
        need = not (role == "你" or chat)
        game[n["id"]] = dict(role=role, text=n.get("text", ""), need=need, chat=chat)


def reason_of(r):
    """把剧本里冗长的说明归成几类。"""
    if not r:
        return "无"
    if "群聊" in r:
        return "群聊气泡"
    if "心声" in r:
        return "玩家心声"
    return "其他"


# ---------- 分角色统计 ----------
S = defaultdict(lambda: Counter())
for nid, role, text, need, why in script:
    c = S[role]
    c["剧本总数"] += 1
    if need:
        c["剧本需配"] += 1
    else:
        c[f"剧本不配·{reason_of(why)}"] += 1

G = defaultdict(lambda: Counter())
for nid, m in game.items():
    c = G[m["role"]]
    c["实际总数"] += 1
    if m["need"]:
        c["实际需配"] += 1
    else:
        c["实际不配·群聊气泡" if m["chat"] else "实际不配·玩家心声"] += 1

# ---------- 逐编号对账 ----------
sn, gn = set(x[0] for x in script), set(game)
only_script = sorted(sn - gn)
only_game = sorted(gn - sn)
dup = [k for k, v in Counter(x[0] for x in script).items() if v > 1]

# 需配音口径的差异
script_need = {x[0] for x in script if x[3]}
game_need = {k for k, v in game.items() if v["need"]}
need_only_script = sorted(script_need - game_need)
need_only_game = sorted(game_need - script_need)


def main():
    lines = []
    W = lines.append
    W("# 配音角色统计（2026-11-18）\n")
    W("剧本口径：`今天吃什么_审核反馈表.xlsx` → 「音频」表（v4.0 逐句标注）")
    W("游戏口径：`meal-story/content/act*.json` 中 type=say 的节点\n")

    W("## 一、分角色对账\n")
    W("| 角色 | 剧本总数 | 剧本需配 | 剧本不配 | 实际总数 | 实际需配 | 差额 |")
    W("|---|---:|---:|---:|---:|---:|---:|")
    all_roles = sorted(set(S) | set(G), key=lambda r: -(S[r]["剧本总数"] + G[r]["实际总数"]))
    tot = Counter()
    for r in all_roles:
        s, g = S[r], G[r]
        diff = g["实际需配"] - s["剧本需配"]
        mark = f"{diff:+d}" if diff else "0"
        W(f"| {r} | {s['剧本总数']} | {s['剧本需配']} | {s['剧本总数']-s['剧本需配']} "
          f"| {g['实际总数']} | {g['实际需配']} | {mark} |")
        for k, v in s.items():
            tot["剧本·" + k] += v
        for k, v in g.items():
            tot["实际·" + k] += v
    W(f"\n**合计**：剧本 {tot['剧本·剧本总数']} 句（需配 {tot['剧本·剧本需配']}）；"
      f"实际 {tot['实际·实际总数']} 句（需配 {tot['实际·实际需配']}）\n")

    W("## 二、不配音的构成\n")
    W("| 类别 | 剧本 | 实际 |")
    W("|---|---:|---:|")
    cats = sorted({k.rsplit("·", 1)[-1] for k in tot if "不配" in k})
    for c in cats:
        W(f"| {c} | {tot.get('剧本·剧本不配·'+c, 0)} | {tot.get('实际·实际不配·'+c, 0)} |")

    W("\n## 三、编号对账\n")
    W(f"- 剧本有、游戏里没有：**{len(only_script)}** 条"
      + (f" → {', '.join(only_script[:20])}" if only_script else ""))
    W(f"- 游戏里有、剧本里没有：**{len(only_game)}** 条"
      + (f" → {', '.join(only_game[:20])}" if only_game else ""))
    W(f"- 剧本里重复编号：**{len(dup)}** 条" + (f" → {', '.join(dup[:10])}" if dup else ""))
    W(f"- 需配音判定不一致（剧本需配、游戏不需）：**{len(need_only_script)}** 条"
      + (f" → {', '.join(need_only_script[:20])}" if need_only_script else ""))
    W(f"- 需配音判定不一致（游戏需配、剧本不需）：**{len(need_only_game)}** 条"
      + (f" → {', '.join(need_only_game[:20])}" if need_only_game else ""))

    W("\n## 四、按章节分布（需配音）\n")
    by_act_s, by_act_g = Counter(), Counter()
    for nid, role, text, need, why in script:
        if need:
            by_act_s[nid.split("-")[0]] += 1
    for nid, m in game.items():
        if m["need"]:
            by_act_g[nid.split("-")[0]] += 1
    W("| 章节 | 剧本需配 | 实际需配 |")
    W("|---|---:|---:|")
    for a in sorted(set(by_act_s) | set(by_act_g)):
        W(f"| {a} | {by_act_s[a]} | {by_act_g[a]} |")

    md = "\n".join(lines) + "\n"
    os.makedirs(os.path.dirname(OUT_MD), exist_ok=True)
    io.open(OUT_MD, "w", encoding="utf-8").write(md)
    print(md)
    print(f"\n已写入 {OUT_MD}")


if __name__ == "__main__":
    main()
