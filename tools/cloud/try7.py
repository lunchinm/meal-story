# -*- coding: utf-8 -*-
"""定位音色卡片容器并打开选择器，连续截图抓弹层。"""
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

    cands = page.evaluate(r"""
    () => {
      const out = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 120 || r.height < 30 || r.height > 120) return;
        if (r.x < 1080 || r.x > 1500) return;                 // 只关心右侧配置区
        const t = (el.innerText || '').trim();
        const cs = getComputedStyle(el);
        if (!t) return;
        out.push({txt: t.slice(0, 20), tag: el.tagName.toLowerCase(),
                  cls: (el.className || '').toString().slice(0, 70),
                  x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
                  cur: cs.cursor});
      });
      return out;
    }
    """)
    seen = set()
    print("右侧候选容器:")
    for c in cands:
        k = (c["txt"], c["x"], c["y"])
        if k in seen:
            continue
        seen.add(k)
        print(f"  '{c['txt']}' {c['tag']} ({c['x']},{c['y']}) {c['w']}x{c['h']} cur={c['cur']} cls={c['cls'][:50]}")

    # 点最像卡片的那一个（含 Vivi 文本、宽 > 300）
    target = next((c for c in cands if "Vivi" in c["txt"] and c["w"] > 300), None)
    if target:
        cx, cy = target["x"] + target["w"] // 2, target["y"] + target["h"] // 2
        print(f"\n点击卡片中心 ({cx},{cy})")
        page.mouse.click(cx, cy)
        for i, ms in enumerate([500, 1500, 3000]):
            page.wait_for_timeout(ms if i == 0 else ms - [500, 1500, 3000][i - 1])
            page.screenshot(path=os.path.join(HERE, f"panel-{i}.png"))
        names = page.evaluate(
            "() => [...document.querySelectorAll('*')].map(e => (e.innerText||'').trim())"
            ".filter(t => t && t.length <= 8).filter((v,i,a)=>a.indexOf(v)===i).slice(0,120)")
        print("页面短文本:", " / ".join(names[:70]))
    b.close()
