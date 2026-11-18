# -*- coding: utf-8 -*-
"""打开音色面板，找「我的音色」里的复刻音色。"""
import json
import os

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle", timeout=90000)
    page.wait_for_timeout(3000)
    page.mouse.click(1450, 620)
    page.wait_for_timeout(800)

    card = page.get_by_text("Vivi 2.0", exact=False).first
    print("音色卡片存在:", card.count())
    card.click(force=True)
    page.wait_for_timeout(2500)
    page.screenshot(path=os.path.join(HERE, "voice-panel.png"))

    txt = page.evaluate(r"""
    () => [...document.querySelectorAll('*')]
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 4 && r.height > 4; })
      .map(e => (e.innerText || '').trim())
      .filter(t => t && t.length < 14)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 80)
    """)
    print("\n面板短文本:")
    for t in txt:
        print("   ", t)

    # 找「我的音色」tab
    for label in ["我的音色", "复刻音色", "自定义音色"]:
        loc = page.get_by_text(label, exact=False).first
        if loc.count():
            print(f"\n找到入口: {label}")
            loc.click(force=True)
            page.wait_for_timeout(2000)
            page.screenshot(path=os.path.join(HERE, "voice-mine.png"))
            names = page.evaluate(r"""
            () => [...document.querySelectorAll('*')]
              .map(e => (e.innerText || '').trim())
              .filter(t => t && t.length < 10)
              .filter((v, i, a) => a.indexOf(v) === i).slice(0, 60)
            """)
            print("切过去后的文本:", " / ".join(names))
            break
    b.close()
