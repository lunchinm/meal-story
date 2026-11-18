# -*- coding: utf-8 -*-
"""选中复刻音色「米粒」并确认。"""
import os

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
    page.goto(URL, wait_until="networkidle", timeout=90000)
    page.wait_for_timeout(3000)
    page.mouse.click(1450, 620)
    page.wait_for_timeout(600)

    page.mouse.click(1280, 510)      # 音色卡片
    page.wait_for_timeout(2000)
    page.screenshot(path=os.path.join(HERE, "p1.png"))

    cat = page.get_by_text("复刻音色", exact=True).first
    print("复刻音色入口:", cat.count())
    if cat.count():
        cat.click(force=True)
        page.wait_for_timeout(2000)
        page.screenshot(path=os.path.join(HERE, "p2.png"))
        names = page.evaluate(
            "() => [...document.querySelectorAll('*')].map(e => (e.innerText||'').trim())"
            ".filter(t => t && t.length <= 6).filter((v,i,a)=>a.indexOf(v)===i).slice(0,120)")
        print("面板内短文本:", " / ".join(names[:60]))

        pick = page.get_by_text(TARGET, exact=True).first
        print(f"音色「{TARGET}」条目数:", pick.count())
        if pick.count():
            pick.click(force=True)
            page.wait_for_timeout(2000)
            page.screenshot(path=os.path.join(HERE, "p3.png"))
            cur = page.evaluate(
                "() => [...document.querySelectorAll('*')].map(e => (e.innerText||'').trim())"
                ".filter(t => t && t.length <= 12).filter((v,i,a)=>a.indexOf(v)===i).slice(0,40)")
            print("选完后页面:", " / ".join(cur[:30]))
    b.close()
