# -*- coding: utf-8 -*-
"""云端全自动批量合成：六个角色串行，每个角色先切音色再跑该角色全部台词。

已验证的关键点：
  - 音色卡片右侧（right-40）才是切换入口，卡片中央是死区
  - 面板路径：预付费音色 → 目标音色 → 确定
  - 合成的音频以 audio/mpeg 响应返回，直接落盘
"""
import json
import os
import subprocess
import sys
import time

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
PLAN = os.path.join(HERE, "tts-plan.json")
OUT = os.path.join(HERE, "out")
LOG = os.path.join(HERE, "batch.log")

KILL = """
#navbar, #navbar *, [id^="garfish_app_for_navbar"], [id^="garfish_app_for_navbar"] * {
  pointer-events: none !important;
}
"""
ROLES = ["米粒", "许知夏", "苏桃", "周简", "陆燃", "罗师傅"]
LIMIT = int(os.environ.get("LIMIT", "0"))  # 0 = 不限，用于小规模验证


def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def card_text(page):
    return page.evaluate("""() => { const c = document.querySelector('.card');
      return c ? (c.innerText||'').trim().split('\\n')[0] : ''; }""")


def set_voice(page, role):
    """切到指定复刻音色，成功返回 True。"""
    for attempt in range(3):
        cur = card_text(page)
        if cur == role:
            return True
        box = page.evaluate("""() => { const c = document.querySelector('.card');
          if (!c) return null; const r = c.getBoundingClientRect();
          return {r: Math.round(r.right), cy: Math.round((r.top + r.bottom) / 2)}; }""")
        if not box:
            page.wait_for_timeout(2000)
            continue
        page.mouse.click(box["r"] - 40, box["cy"])
        page.wait_for_timeout(2200)

        tab = page.get_by_text("预付费音色", exact=True).first
        if tab.count():
            tab.click(force=True)
            page.wait_for_timeout(1500)

        row = page.get_by_text(role, exact=True).first
        if row.count():
            row.click(force=True)
            page.wait_for_timeout(1200)
            ok = page.get_by_text("确定", exact=True).first
            if ok.count():
                ok.click(force=True)
                page.wait_for_timeout(2200)
        if card_text(page) == role:
            return True
        log(f"  切音色重试 {attempt + 1}：当前还是 {card_text(page)}")
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)
    return False


def synth_one(page, text):
    page.evaluate("() => document.querySelector('.ProseMirror').focus()")
    page.keyboard.press("Control+a")
    page.keyboard.press("Delete")
    page.keyboard.type(text, delay=6)
    page.wait_for_timeout(250)
    with page.expect_response(
        lambda r: "audio" in (r.headers.get("content-type") or "") and r.status in (200, 206),
        timeout=90000,
    ) as info:
        page.get_by_text("合成试听", exact=True).first.click(force=True)
    return info.value.body()


def main():
    os.makedirs(OUT, exist_ok=True)
    plan = json.load(open(PLAN, encoding="utf-8"))
    by_role = {}
    for t in plan["tasks"]:
        by_role.setdefault(t["role"], []).append(t)
    total_all = sum(len(v) for v in by_role.values())
    log(f"开工：{total_all} 句，{len(by_role)} 个角色")

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = b.new_context(locale="zh-CN", viewport={"width": 1600, "height": 1000},
                            storage_state=STATE if os.path.exists(STATE) else None)
        page = ctx.new_page()
        page.goto(URL, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=60000)
        page.wait_for_timeout(4000)
        page.add_style_tag(content=KILL)

        grand_ok = grand_fail = 0
        for role in ROLES:
            tasks = by_role.get(role, [])
            if not tasks:
                continue
            if not set_voice(page, role):
                log(f"跳过 {role}：音色切不过去（当前 {card_text(page)}）")
                continue
            log(f"【{role}】开始 {len(tasks)} 句，音色={card_text(page)}")
            ok = fail = 0
            for i, t in enumerate(tasks):
                if LIMIT and ok + fail >= LIMIT:
                    break
                dest = os.path.join(OUT, f"{t['id']}.mp3")
                if os.path.exists(dest) and os.path.getsize(dest) > 2000:
                    ok += 1
                    continue
                buf = None
                for attempt in range(2):
                    try:
                        buf = synth_one(page, t["text"])
                        if buf and len(buf) > 1500:
                            break
                    except Exception as e:  # noqa: BLE001
                        log(f"  {t['id']} 第{attempt + 1}次失败：{str(e)[:70]}")
                        page.wait_for_timeout(1500)
                if buf and len(buf) > 1500:
                    with open(dest, "wb") as f:
                        f.write(buf)
                    ok += 1
                else:
                    fail += 1
                if (i + 1) % 10 == 0:
                    log(f"  {role} {i + 1}/{len(tasks)} 成功{ok} 失败{fail}")
            grand_ok += ok
            grand_fail += fail
            log(f"【{role}】完成 成功{ok} 失败{fail}")

        log(f"全部结束：成功 {grand_ok}，失败 {grand_fail}")
        b.close()
        return 0 if grand_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

