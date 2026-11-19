# -*- coding: utf-8 -*-
"""用页面缩放（CDP setPageScaleFactor）与键盘缩放，试点击音色卡片。"""
import os

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
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

    for label, setup in [
        ("ctrl- 两次", "keys"),
        ("ctrl- 四次", "keys4"),
        ("CDP scale 0.8", "cdp08"),
        ("CDP scale 0.67", "cdp067"),
    ]:
        ctx = b.new_context(locale="zh-CN", viewport={"width": 1600, "height": 1000},
                            storage_state=STATE if os.path.exists(STATE) else None)
        page = ctx.new_page()
        page.goto(URL, wait_until="domcontentloaded", timeout=90000)
        try:
            page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=45000)
        except Exception:  # noqa: BLE001
            pass
        page.wait_for_timeout(3500)
        page.add_style_tag(content=KILL)

        if setup == "keys":
            page.keyboard.press("Control+-"); page.wait_for_timeout(300)
            page.keyboard.press("Control+-"); page.wait_for_timeout(800)
        elif setup == "keys4":
            for _ in range(4):
                page.keyboard.press("Control+-"); page.wait_for_timeout(250)
        elif setup == "cdp08":
            cdp = ctx.new_cdp_session(page)
            cdp.send("Emulation.setPageScaleFactor", {"pageScaleFactor": 0.8})
            page.wait_for_timeout(800)
        elif setup == "cdp067":
            cdp = ctx.new_cdp_session(page)
            cdp.send("Emulation.setPageScaleFactor", {"pageScaleFactor": 0.67})
            page.wait_for_timeout(800)

        box = page.evaluate("""() => { const c = document.querySelector('.card');
          if (!c) return null; const r = c.getBoundingClientRect();
          return {x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2),
                  w: Math.round(r.width), h: Math.round(r.height)}; }""")
        if not box:
            print(f"{label}: 没有卡片")
            ctx.close(); continue
        page.mouse.click(box["x"], box["y"])
        page.wait_for_timeout(3000)
        hit = has_panel(page)
        print(f"{label}: 卡片({box['x']},{box['y']}) → 面板 {hit}")
        if hit:
            page.screenshot(path=os.path.join(HERE, f"zoom-ok.png"))
            ctx.close(); break
        ctx.close()
    b.close()
