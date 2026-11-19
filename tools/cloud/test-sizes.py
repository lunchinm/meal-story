# -*- coding: utf-8 -*-
"""不同视口尺寸下点击音色卡片，看哪组布局能打开面板。"""
import os

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")

SIZES = [(1280, 800), (1440, 900), (1600, 1000), (1920, 1080)]
KILL = """
#navbar, #navbar *, [id^="garfish_app_for_navbar"], [id^="garfish_app_for_navbar"] * {
  pointer-events: none !important;
}
"""
MARKS = ["预付费音色", "后付费音色", "小何 2.0", "温暖阿虎", "温柔妈妈"]


def has_panel(page):
    t = page.evaluate("() => document.body.innerText || ''")
    return [m for m in MARKS if m in t]


with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    for w, h in SIZES:
        ctx = b.new_context(locale="zh-CN", viewport={"width": w, "height": h},
                            storage_state=STATE if os.path.exists(STATE) else None)
        page = ctx.new_page()
        page.goto(URL, wait_until="domcontentloaded", timeout=90000)
        try:
            page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=45000)
        except Exception:  # noqa: BLE001
            pass
        page.wait_for_timeout(4000)
        page.add_style_tag(content=KILL)
        box = page.evaluate("""() => { const c = document.querySelector('.card');
          if (!c) return null; const r = c.getBoundingClientRect();
          return {x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2),
                  w: Math.round(r.width), h: Math.round(r.height)}; }""")
        if not box:
            print(f"{w}x{h}: 没有卡片")
            ctx.close()
            continue
        page.mouse.click(box["x"], box["y"])
        page.wait_for_timeout(3000)
        hit = has_panel(page)
        print(f"{w}x{h}: 卡片({box['x']},{box['y']}) {box['w']}x{box['h']} → 面板 {hit}")
        if hit:
            page.screenshot(path=os.path.join(HERE, f"ok-{w}.png"))
            ctx.close()
            break
        ctx.close()
    b.close()
