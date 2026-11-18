# -*- coding: utf-8 -*-
"""点音色卡片右侧的切换图标，打开音色选择器。"""
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
    page.wait_for_timeout(600)

    for (x, y) in [(1280, 510), (1445, 510)]:
        page.mouse.click(x, y)
        page.wait_for_timeout(2000)
        # 看有没有弹层出现
        has = page.evaluate(
            "() => [...document.querySelectorAll('*')]"
            ".filter(e => { const s = getComputedStyle(e); return (s.position==='fixed'||s.position==='absolute'); })"
            ".map(e => (e.innerText||'').trim())"
            ".filter(t => t && t.length > 20 && t.length < 4000).length")
        print(f"点 ({x},{y}) 后弹层数(粗略)={has}")
        page.screenshot(path=os.path.join(HERE, f"panel-{x}.png"))
        if has:
            names = page.evaluate(
                "() => [...document.querySelectorAll('*')].map(e => (e.innerText||'').trim())"
                ".filter(t => t && t.length < 12).filter((v,i,a)=>a.indexOf(v)===i).slice(0,80)")
            hits = [n for n in names if any(k in n for k in ("我的", "复刻", "标签", "青年", "通用", "角色"))]
            print("   疑似分类:", hits[:12])
            break
    b.close()
