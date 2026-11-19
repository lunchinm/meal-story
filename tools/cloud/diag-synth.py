# -*- coding: utf-8 -*-
"""单句合成诊断：切音色 → 输入 → 找按钮 → 点击 → 抓 20 秒网络。"""
import json
import os
import time

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
KILL = """
#navbar, #navbar *, [id^="garfish_app_for_navbar"], [id^="garfish_app_for_navbar"] * {
  pointer-events: none !important;
}
"""
TEXT = "菜基本一样，就是西兰花没有照片里站得那么整齐。"

resp_log = []

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1600, "height": 1000},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.on("response", lambda r: resp_log.append((r.status, r.headers.get("content-type", "")[:30], r.url[:90])))
    page.goto(URL, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=60000)
    page.wait_for_timeout(4000)
    page.add_style_tag(content=KILL)

    # 切音色
    box = page.evaluate("""() => { const c = document.querySelector('.card'); const r = c.getBoundingClientRect();
      return {r: Math.round(r.right), cy: Math.round((r.top + r.bottom) / 2)}; }""")
    page.mouse.click(box["r"] - 40, box["cy"])
    page.wait_for_timeout(2200)
    tab = page.get_by_text("预付费音色", exact=True).first
    if tab.count():
        tab.click(force=True); page.wait_for_timeout(1500)
    row = page.get_by_text("米粒", exact=True).first
    if row.count():
        row.click(force=True); page.wait_for_timeout(1000)
        page.get_by_text("确定", exact=True).first.click(force=True)
        page.wait_for_timeout(2200)
    cur = page.evaluate("""() => { const c=document.querySelector('.card'); return c?c.innerText.trim().split('\\n')[0]:''; }""")
    print("当前音色:", cur)

    # 输入
    page.evaluate("() => document.querySelector('.ProseMirror').focus()")
    page.keyboard.press("Control+a")
    page.keyboard.press("Delete")
    page.keyboard.type(TEXT, delay=6)
    page.wait_for_timeout(600)
    typed = page.evaluate("() => { const e=document.querySelector('.ProseMirror'); return e?e.innerText.trim():''; }")
    print("编辑器内容:", repr(typed[:40]))

    # 按钮
    btn = page.get_by_text("合成试听", exact=True)
    n = btn.count()
    print("「合成试听」exact 命中:", n)
    if n:
        for i in range(min(n, 3)):
            bb = btn.nth(i).bounding_box()
            print(f"  #{i} box={bb}")
    btn2 = page.get_by_text("合成试听", exact=False)
    print("「合成试听」模糊命中:", btn2.count())

    page.screenshot(path=os.path.join(HERE, "d-before.png"))
    resp_log.clear()
    try:
        btn.first.click(force=True, timeout=10000)
        print("已点击")
    except Exception as e:  # noqa: BLE001
        print("点击失败:", str(e)[:100])

    page.wait_for_timeout(20000)
    page.screenshot(path=os.path.join(HERE, "d-after.png"))
    audio = [r for r in resp_log if "audio" in r[1]]
    print("20 秒内响应", len(resp_log), "条，音频", len(audio), "条")
    for r in audio[:5]:
        print("   ", r)
    for r in [x for x in resp_log if "tts" in x[2].lower()][:5]:
        print("   tts:", r)
    b.close()
