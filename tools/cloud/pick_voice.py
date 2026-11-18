# -*- coding: utf-8 -*-
"""按路径选音色：点音色卡片 → 预付费音色 → 米粒。"""
import os

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
TARGET = os.environ.get("TARGET", "米粒")

OPEN_MARKS = ["小何 2.0", "温暖阿虎", "温柔妈妈", "解说小明", "预付费音色"]


def opened(page):
    t = page.evaluate("() => document.body.innerText || ''")
    return [m for m in OPEN_MARKS if m in t]


with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle", timeout=90000)
    page.wait_for_timeout(4000)
    page.mouse.click(1450, 620)
    page.wait_for_timeout(500)
    page.add_style_tag(content="#navbar{pointer-events:none !important}")

    page.mouse.move(1250, 505)
    page.wait_for_timeout(300)
    page.mouse.click(1288, 507)
    page.wait_for_timeout(2600)
    print("打开后命中:", opened(page))
    page.screenshot(path=os.path.join(HERE, "f1-open.png"))

    # 点「预付费音色」
    for label in ["预付费音色", "预付音色", "我的音色"]:
        loc = page.get_by_text(label, exact=True).first
        if loc.count():
            print("找到分类:", label)
            loc.click(force=True)
            page.wait_for_timeout(2500)
            page.screenshot(path=os.path.join(HERE, "f2-prepaid.png"))
            break

    # 点目标音色
    pick = page.get_by_text(TARGET, exact=True).first
    print(f"「{TARGET}」条目数:", pick.count())
    if pick.count():
        pick.click(force=True)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(HERE, "f3-picked.png"))

    txt = page.evaluate("() => document.body.innerText || ''")
    print("选完后页面含目标音色:", TARGET in txt)
    for n in ["米粒", "许知夏", "苏桃", "周简", "陆燃", "罗师傅", "Vivi 2.0"]:
        if n in txt:
            print("   页面出现:", n)
    b.close()
