# -*- coding: utf-8 -*-
"""在云端虚拟屏 :99 上开浏览器窗口，停在语音合成页。
用 DISPLAY=:99 运行，配合 noVNC 远程点击。
"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
ROLES = ["米粒", "许知夏", "苏桃", "周简", "陆燃", "罗师傅"]
WANT = int(os.environ.get("WINDOWS", "1"))

with sync_playwright() as p:
    b = p.chromium.launch(headless=False, args=[
        "--no-sandbox", "--disable-dev-shm-usage", "--window-size=1400,860",
        "--window-position=20,20", "--disable-blink-features=AutomationControlled",
    ])
    ctx0 = b.new_context(storage_state=STATE if os.path.exists(STATE) else None,
                         locale="zh-CN", viewport={"width": 1340, "height": 800})
    ctx0.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
    page = ctx0.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=90000)
    try:
        page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=60000)
    except Exception:  # noqa: BLE001
        pass
    page.evaluate("""(r) => {
      const d = document.createElement('div');
      d.textContent = '云端窗口 · 请配音色：' + r;
      d.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;height:32px;'
        + 'background:#111;color:#fff;font:15px/32px system-ui;text-align:center;pointer-events:none';
      document.body.appendChild(d);
    }""", ROLES[0])
    print("窗口已开，停在:", page.url, flush=True)
    print("保持打开，按 Ctrl+C 结束", flush=True)
    while True:
        time.sleep(60)

