# -*- coding: utf-8 -*-
"""在 Xvfb 虚拟显示下用有头模式点击音色卡片。
用 xvfb-run -a 运行。
"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
TARGET = os.environ.get("TARGET", "米粒")

KILL_NAV = """
#navbar, #navbar *, [id^="garfish_app_for_navbar"], [id^="garfish_app_for_navbar"] * {
  pointer-events: none !important;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=False, args=["--no-sandbox", "--disable-dev-shm-usage",
                                                "--disable-blink-features=AutomationControlled"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1440, "height": 900},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=60000)
    page.wait_for_timeout(6000)
    page.add_style_tag(content=KILL_NAV)
    page.wait_for_timeout(400)

    box = page.evaluate("""() => { const c = document.querySelector('.card');
      if (!c) return null; const r = c.getBoundingClientRect();
      return {x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)}; }""")
    print("卡片中心:", box)
    if not box:
        b.close(); sys.exit(1)

    page.mouse.click(box["x"], box["y"])
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(HERE, "h1.png"))
    t = page.evaluate("() => document.body.innerText || ''")
    marks = [m for m in ["预付费音色", "后付费音色", "小何 2.0", "温暖阿虎"] if m in t]
    print("面板命中:", marks)
    if not marks:
        print("有头模式也没打开")
        b.close(); sys.exit(1)

    for label in ["预付费音色", "预付音色"]:
        loc = page.get_by_text(label, exact=True).first
        if loc.count():
            loc.click(force=True)
            print("切分类:", label)
            page.wait_for_timeout(2500)
            break
    page.screenshot(path=os.path.join(HERE, "h2.png"))

    pick = page.get_by_text(TARGET, exact=True).first
    print(f"「{TARGET}」条目:", pick.count())
    if pick.count():
        pick.click(force=True)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(HERE, "h3.png"))
        card = page.evaluate("() => { const c=document.querySelector('.card'); return c?c.innerText.trim().slice(0,20):''; }")
        print("选后卡片:", repr(card))
    b.close()
