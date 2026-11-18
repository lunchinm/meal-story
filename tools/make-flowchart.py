# -*- coding: utf-8 -*-
"""根据剧本结构生成本作流程图（game/flowchart.json）。

结构：start → 第一章 → 第二章 → 第三章 → 第四章 → 三个结局
"""
import io
import json
import os

MS = r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\meal-story"
OUT = os.path.join(MS, "webgal-game", "flowchart.json")

chapters = [
    ("act1", "第一章《套餐的秘密》", "act1.txt", 0),
    ("act2", "第二章《三种晚饭》", "act2.txt", 220),
    ("act3", "第三章《便利店的标签》", "act3.txt", 440),
    ("act4", "第四章《你写的那一版》", "act4.txt", 660),
]

endings = [
    ("e_normal", "结局 · 照着吃", "act4.txt", 0, 880),
    ("e_advanced", "结局 · 会挑着吃", "act4.txt", 220, 880),
    ("e_hidden", "结局 · 把问题问回去", "act4.txt", 440, 880),
]

nodes = [{
    "id": "start",
    "type": "root",
    "position": {"x": 0, "y": 0},
    "data": {"label": "开场 · 食堂二楼", "sceneName": "start.txt", "isRoot": True},
}]
edges = []

for cid, label, scene, y in chapters:
    nodes.append({
        "id": cid,
        "type": "chapter",
        "position": {"x": 0, "y": y + 120},
        "data": {"label": label, "sceneName": scene},
    })

edges.append({"id": "e-start-act1", "source": "start", "target": "act1"})
for i in range(len(chapters) - 1):
    edges.append({
        "id": f"e-{chapters[i][0]}-{chapters[i + 1][0]}",
        "source": chapters[i][0],
        "target": chapters[i + 1][0],
    })

for eid, label, scene, x, y in endings:
    nodes.append({
        "id": eid,
        "type": "event",
        "position": {"x": x, "y": y},
        "data": {"label": label, "sceneName": scene},
    })
    edges.append({"id": f"e-act4-{eid}", "source": "act4", "target": eid})

data = {
    "flowcharts": [{
        "id": "main",
        "name": "今天吃什么？——校园膳食调查簿",
        "type": "main",
        "nodes": nodes,
        "edges": edges,
    }]
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
io.open(OUT, "w", encoding="utf-8").write(json.dumps(data, ensure_ascii=False, indent=2))
print(f"flowchart.json 已生成：{len(nodes)} 个节点 / {len(edges)} 条边")
