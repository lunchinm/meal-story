# -*- coding: utf-8 -*-
"""把 API 创建的提交对象在本机重建，令本地 main 与远程一致（不依赖 git fetch）。"""
import json, subprocess, urllib.request, datetime
from pathlib import Path

REPO = "lunchinm/meal-story"
ROOT = Path(__file__).resolve().parents[1]
TOKEN = subprocess.check_output(["gh", "auth", "token"], text=True).strip()


def api(path):
    req = urllib.request.Request(f"https://api.github.com{path}", headers={
        "Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "meal-story-reconcile"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def ts(date):
    return int(datetime.datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc).timestamp())


tip = api(f"/repos/{REPO}/git/ref/heads/main")["object"]["sha"]
chain = []
cur = tip
while True:
    if subprocess.run(["git", "cat-file", "-e", cur], cwd=ROOT).returncode == 0:
        break
    data = api(f"/repos/{REPO}/git/commits/{cur}")
    chain.append(data)
    cur = data["parents"][0]["sha"]

for data in reversed(chain):
    a, c = data["author"], data["committer"]
    msg = data["message"]
    raw = (f"tree {data['tree']['sha']}\n"
           + "".join(f"parent {p['sha']}\n" for p in data["parents"])
           + f"author {a['name']} <{a['email']}> {ts(a['date'])} +0000\n"
           + f"committer {c['name']} <{c['email']}> {ts(c['date'])} +0000\n\n"
           + msg)
    if not raw.endswith("\n"):
        raw += "\n"
    sha = subprocess.run(["git", "hash-object", "-t", "commit", "-w", "--stdin"], cwd=ROOT,
                         input=raw.encode("utf-8"), capture_output=True, check=True).stdout.decode().strip()
    print("built", sha, "expected", data["sha"], "OK" if sha == data["sha"] else "MISMATCH")

subprocess.run(["git", "update-ref", "refs/heads/main", tip], cwd=ROOT, check=True)
print("local main ->", tip)
