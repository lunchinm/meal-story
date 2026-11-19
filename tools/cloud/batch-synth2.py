# -*- coding: utf-8 -*-
"""续跑版：页面跑久了会卡死，改成每 N 句重建页面，卡了也能自愈。

改动：
  - 每 RESTART_EVERY 句重建 page（音色会重置，之后重切）
  - 连续失败 3 次就重建页面并重切音色
  - 已存在的 mp3 直接跳过（断点续跑）
"""
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
PLAN = os.path.join(HERE, "tts-plan.json")
OUT = os.path.join(HERE, "out")
LOG = os.path.join(HERE, "batch2.log")

KILL = """
#navbar, #navbar *, [id^="garfish_app_for_navbar"], [id^="garfish_app_for_navbar"] * {
  pointer-events: none !important;
}
"""
ROLES = ["米粒", "许知夏", "苏桃", "周简", "陆燃", "罗师傅"]
RESTART_EVERY = 40


def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def card_text(page):
    try:
        return page.evaluate("""() => { const c = document.querySelector('.card');
          return c ? (c.innerText||'').trim().split('\\n')[0] : ''; }""")
    except Exception:  # noqa: BLE001
        return ""


def new_page(ctx):
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=90000)
    try:
        page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=60000)
    except Exception:  # noqa: BLE001
        pass
    page.wait_for_timeout(3500)
    page.add_style_tag(content=KILL)
    return page


def set_voice(page, role):
    if card_text(page) == role:
        return True
    for _ in range(3):
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
            page.wait_for_timeout(1400)
        row = page.get_by_text(role, exact=True).first
        if row.count():
            row.click(force=True)
            page.wait_for_timeout(1000)
            ok = page.get_by_text("确定", exact=True).first
            if ok.count():
                ok.click(force=True)
                page.wait_for_timeout(2200)
        if card_text(page) == role:
            return True
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
        timeout=60000,
    ) as info:
        page.get_by_text("合成试听", exact=True).first.click(force=True, timeout=15000)
    return info.value.body()


def main():
    os.makedirs(OUT, exist_ok=True)
    plan = json.load(open(PLAN, encoding="utf-8"))
    by_role = {}
    for t in plan["tasks"]:
        by_role.setdefault(t["role"], []).append(t)

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = b.new_context(locale="zh-CN", viewport={"width": 1600, "height": 1000},
                            storage_state=STATE if os.path.exists(STATE) else None)
        page = new_page(ctx)

        done_total = skipped = failed = 0
        for role in ROLES:
            tasks = by_role.get(role, [])
            pending = [t for t in tasks
                       if not (os.path.exists(os.path.join(OUT, f"{t['id']}.mp3"))
                               and os.path.getsize(os.path.join(OUT, f"{t['id']}.mp3")) > 2000)]
            skipped += len(tasks) - len(pending)
            if not pending:
                continue
            if not set_voice(page, role):
                log(f"跳过 {role}：音色切不过去")
                continue
            log(f"【{role}】待跑 {len(pending)} 句（已跳过 {len(tasks) - len(pending)}）")

            since_restart = 0
            streak_fail = 0
            for t in pending:
                dest = os.path.join(OUT, f"{t['id']}.mp3")
                if os.path.exists(dest) and os.path.getsize(dest) > 2000:
                    continue
                if since_restart >= RESTART_EVERY:
                    log(f"  重建页面（已跑 {since_restart} 句）")
                    page.close()
                    page = new_page(ctx)
                    since_restart = 0
                    if not set_voice(page, role):
                        log("  重建后切音色失败")
                        break

                buf = None
                try:
                    buf = synth_one(page, t["text"])
                except Exception as e:  # noqa: BLE001
                    streak_fail += 1
                    log(f"  {t['id']} 失败({streak_fail})：{str(e)[:60]}")
                    if streak_fail >= 3:
                        log("  连续失败，重建页面")
                        page.close()
                        page = new_page(ctx)
                        since_restart = 0
                        streak_fail = 0
                        if not set_voice(page, role):
                            log("  重建后切音色失败")
                            break
                    continue

                if buf and len(buf) > 1500:
                    with open(dest, "wb") as f:
                        f.write(buf)
                    done_total += 1
                    since_restart += 1
                    streak_fail = 0
                    if done_total % 10 == 0:
                        log(f"  本轮新增 {done_total}")
                else:
                    failed += 1
            log(f"【{role}】结束")

        total_files = len([x for x in os.listdir(OUT) if x.endswith(".mp3")])
        log(f"完成：新增 {done_total}，跳过 {skipped}，失败 {failed}，现有 {total_files} 个文件")
        b.close()


if __name__ == "__main__":
    sys.exit(main())
