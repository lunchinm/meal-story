# -*- coding: utf-8 -*-
"""把本地 5 个提交压成一个与远程树一致的提交，并让两端指向同一 SHA。"""
import json, os, subprocess, urllib.request
from pathlib import Path

REPO = "lunchinm/meal-story"
BASE = "3a21a570156d240d224372b4ccd0f435eb010a83"
ROOT = Path(__file__).resolve().parents[1]
TOKEN = subprocess.check_output(["gh", "auth", "token"], text=True).strip()
DATE = "2026-11-19T07:20:00Z"
NAME, EMAIL = "lunchinm", "2431877412@qq.com"
MESSAGE = """feat: 整体优化剧情分支、互动与回退，修复选项串线/结局不可达/上一句失效

- 转换器重写：choice next/showIf/flag、branch when 条件跳转、random 运行期随机、ending 结算
- 上一句改用原生 jumpFromBacklog 快照，跨章恢复；跳转前停自动/快进
- 修复设置页漏判、标题返回失效、回复条残留、serve 目录错误
- 配餐/核实/翻阅可操作，调查簿可回翻并随存档恢复
- 标题说明与结局整页卡片；回归 32/32 + 9/9，隐藏支线与三结局实测可达
"""


def api(method, path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(f"https://api.github.com{path}", data=data, method=method, headers={
        "Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "meal-story-squash", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        body = r.read().decode()
        return json.loads(body) if body else {}


tree = subprocess.check_output(["git", "rev-parse", "HEAD^{tree}"], cwd=ROOT, text=True).strip()
msgfile = ROOT / ".git" / "SQUASH_MSG"
msgfile.write_text(MESSAGE, encoding="utf-8")
env = dict(os.environ, GIT_AUTHOR_DATE="2026-11-19T07:20:00+0000", GIT_COMMITTER_DATE="2026-11-19T07:20:00+0000",
           GIT_AUTHOR_NAME=NAME, GIT_AUTHOR_EMAIL=EMAIL, GIT_COMMITTER_NAME=NAME, GIT_COMMITTER_EMAIL=EMAIL)
local = subprocess.check_output(["git", "commit-tree", tree, "-p", BASE, "-F", str(msgfile)], cwd=ROOT, env=env, text=True).strip()
print("local commit", local)

remote = api("POST", f"/repos/{REPO}/git/commits", {
    "message": MESSAGE, "tree": tree, "parents": [BASE],
    "author": {"name": NAME, "email": EMAIL, "date": DATE},
    "committer": {"name": NAME, "email": EMAIL, "date": DATE},
})
print("remote commit", remote["sha"], "match" if remote["sha"] == local else "MISMATCH")
if remote["sha"] == local:
    api("PATCH", f"/repos/{REPO}/git/refs/heads/main", {"sha": local, "force": True})
    subprocess.run(["git", "update-ref", "refs/heads/main", local], cwd=ROOT, check=True)
    subprocess.run(["git", "reset", "--hard", local], cwd=ROOT, check=True, capture_output=True)
    print("synced")
