# -*- coding: utf-8 -*-
"""完整选音色：点卡片右侧切换图标 → 预付费音色 → 目标音色 → 确认生效。"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
TARGET = os.environ.get("TARGET", "米粒")
KILL = """
#navbar, #navbar *, [id^="garfish_app_for_navbar"], [id^="garfish_app_for_navbar"] * {
  pointer-events: none !important;
}
"""


def card_text(page):
    return page.evaluate("""() => { const c = document.querySelector('.card');
      return c ? (c.innerText||'').trim().split('\\n')[0] : ''; }""")


with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1600, "height": 1000},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=45000)
    page.wait_for_timeout(4000)
    page.add_style_tag(content=KILL)

    box = page.evaluate("""() => { const c = document.querySelector('.card'); const r = c.getBoundingClientRect();
      return {r: Math.round(r.right), cy: Math.round((r.top + r.bottom) / 2)}; }""")
    page.mouse.click(box["r"] - 40, box["cy"])
    page.wait_for_timeout(2500)
    page.screenshot(path=os.path.join(HERE, "s1-panel.png"))

    loc = page.get_by_text("预付费音色", exact=True).first
    print("预付费音色条目:", loc.count())
    if loc.count():
        loc.click(force=True)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(HERE, "s2-prepaid.png"))

    pick = page.get_by_text(TARGET, exact=True).first
    print(f"「{TARGET}」条目:", pick.count())
    if not pick.count():
        print("没找到目标音色")
        b.close()
        sys.exit(1)
    pick.click(force=True)
    page.wait_for_timeout(1500)
    ok = page.get_by_text('确定', exact=True).first
    if ok.count():
        ok.click(force=True)
        print('点了确定')
    page.wait_for_timeout(2500)
    page.screenshot(path=os.path.join(HERE, "s3-picked.png"))
    got = card_text(page)
    print("选后卡片音色:", repr(got))
    print("是否生效:", got == TARGET)
    b.close()


