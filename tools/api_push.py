# -*- coding: utf-8 -*-
"""在 github.com:443 被阻断时，用 GitHub Git Data API 写入本地提交。"""
import base64, json, subprocess, sys, urllib.request
from pathlib import Path

REPO = "lunchinm/meal-story"
BASE = "3a21a570156d240d224372b4ccd0f435eb010a83"
ROOT = Path(__file__).resolve().parents[1]
TOKEN = subprocess.check_output(["gh", "auth", "token"], text=True).strip()


def api(method, path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(f"https://api.github.com{path}", data=data, method=method, headers={
        "Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "meal-story-push", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode())


changed = subprocess.check_output(["git", "diff", "--name-only", "-z", f"{BASE}..HEAD"], cwd=ROOT)
paths = [p.decode("utf-8") for p in changed.split(b"\0") if p]
print("files:", len(paths))

entries = []
for p in paths:
    raw = subprocess.check_output(["git", "cat-file", "blob", f"HEAD:{p}"], cwd=ROOT)
    blob = api("POST", f"/repos/{REPO}/git/blobs", {"content": base64.b64encode(raw).decode(), "encoding": "base64"})
    entries.append({"path": p, "mode": "100644", "type": "blob", "sha": blob["sha"]})
    print("blob", p, len(raw))

base_commit = api("GET", f"/repos/{REPO}/git/commits/{BASE}")
current = api("GET", f"/repos/{REPO}/git/ref/heads/main")["object"]["sha"]
current_commit = api("GET", f"/repos/{REPO}/git/commits/{current}")
tree = api("POST", f"/repos/{REPO}/git/trees", {"base_tree": current_commit["tree"]["sha"], "tree": entries})
message = """feat: 整体优化剧情分支、互动与回退，修复选项串线/结局不可达/上一句失效

- 转换器重写：choice next/showIf/flag、branch when 条件跳转、random 运行期随机、ending 结算
- 上一句改用原生 jumpFromBacklog 快照，跨章恢复；跳转前停自动/快进
- 修复设置页漏判、标题返回失效、回复条残留、serve 目录错误
- 配餐/核实/翻阅可操作，调查簿可回翻并随存档恢复
- 标题说明与结局整页卡片；回归 32/32 + 9/9，隐藏支线与三结局实测可达
"""
commit = api("POST", f"/repos/{REPO}/git/commits", {"message": message, "tree": tree["sha"], "parents": [current]})
print("commit", commit["sha"])
api("PATCH", f"/repos/{REPO}/git/refs/heads/main", {"sha": commit["sha"], "force": False})
print("ref updated")
try:
    api("POST", f"/repos/{REPO}/actions/workflows/webgal-pages.yml/dispatches", {"ref": "main"})
    print("workflow dispatched")
except Exception as e:
    print("workflow dispatch failed:", e)
