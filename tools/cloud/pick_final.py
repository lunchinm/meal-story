# -*- coding: utf-8 -*-
"""等应用渲染完再操作：等到「单人模式」出现，再点音色卡片。"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
TARGET = os.environ.get("TARGET", "米粒")

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=90000)

    # 关键：等应用真正渲染
    try:
        page.wait_for_function(
            "() => (document.body.innerText || '').includes('单人模式')", timeout=60000)
        print("应用已渲染（检测到「单人模式」）")
    except Exception as e:  # noqa: BLE001
        print("等待渲染超时:", str(e)[:80])
    page.wait_for_timeout(2500)
    print("正文字数:", page.evaluate("() => (document.body.innerText || '').length"))
    page.add_style_tag(content="#navbar{pointer-events:none !important}")

    page.mouse.click(1450, 620)
    page.wait_for_timeout(600)
    page.mouse.click(1288, 507)
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(HERE, "k1.png"))

    t = page.evaluate("() => document.body.innerText || ''")
    marks = [m for m in ["预付费音色", "后付费音色", "小何 2.0", "温暖阿虎", TARGET] if m in t]
    print("点击后命中:", marks)
    if not marks:
        print("面板仍未打开")
        b.close()
        sys.exit(1)

    for label in ["预付费音色", "预付音色", "我的音色"]:
        loc = page.get_by_text(label, exact=True).first
        if loc.count():
            print("切分类:", label)
            loc.click(force=True)
            page.wait_for_timeout(2500)
            break
    page.screenshot(path=os.path.join(HERE, "k2.png"))

    pick = page.get_by_text(TARGET, exact=True).first
    print(f"「{TARGET}」条目数:", pick.count())
    if pick.count():
        pick.click(force=True)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(HERE, "k3.png"))
        t2 = page.evaluate("() => document.body.innerText || ''")
        print("选完后当前音色含目标:", TARGET in t2)
    b.close()
