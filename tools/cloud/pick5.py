# -*- coding: utf-8 -*-
"""把 navbar 整棵子树的点击屏蔽掉，再按路径选音色。"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
TARGET = os.environ.get("TARGET", "米粒")

# pointer-events 不继承，必须让孩子也关掉
KILL_NAV = """
#navbar, #navbar * ,
[id^="garfish_app_for_navbar"], [id^="garfish_app_for_navbar"] * {
  pointer-events: none !important;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=60000)
    page.wait_for_timeout(6000)
    page.add_style_tag(content=KILL_NAV)
    page.wait_for_timeout(400)

    top = page.evaluate("""() => {
      const el = document.elementFromPoint(1288, 507);
      return el ? {tag: el.tagName, cls: (el.className||'').toString().slice(0,40),
                   txt: (el.innerText||'').trim().slice(0,20)} : null;
    }""")
    print("(1288,507) 上层现在:", top)

    page.mouse.click(1288, 507)
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(HERE, "x1.png"))
    t = page.evaluate("() => document.body.innerText || ''")
    marks = [m for m in ["预付费音色", "后付费音色", "小何 2.0", "温暖阿虎", TARGET] if m in t]
    print("面板命中:", marks)
    if not marks:
        b.close()
        sys.exit(1)

    for label in ["预付费音色", "预付音色", "我的音色"]:
        loc = page.get_by_text(label, exact=True).first
        if loc.count():
            loc.click(force=True)
            print("切分类:", label)
            page.wait_for_timeout(2500)
            break
    page.screenshot(path=os.path.join(HERE, "x2.png"))

    pick = page.get_by_text(TARGET, exact=True).first
    print(f"「{TARGET}」条目:", pick.count())
    if pick.count():
        pick.click(force=True)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(HERE, "x3.png"))
        if TARGET in page.evaluate("() => document.body.innerText || ''"):
            ctx.storage_state(path=STATE)
            print("音色已切换并写回 state.json")
    b.close()
