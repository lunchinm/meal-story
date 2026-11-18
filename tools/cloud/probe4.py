# -*- coding: utf-8 -*-
"""看清整页底部：关弹层→输入文本→整页截图→列出 aria-label/title/按钮。"""
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
    page.keyboard.press("Escape")
    page.wait_for_timeout(800)
    page.add_style_tag(content="#navbar{pointer-events:none !important}")

    page.evaluate("() => document.querySelector('.ProseMirror').focus()")
    page.wait_for_timeout(300)
    page.keyboard.type("菜基本一样，就是西兰花没有照片里站得那么整齐。", delay=10)
    page.wait_for_timeout(1500)

    page.screenshot(path=os.path.join(HERE, "full.png"), full_page=True)
    print("整页截图:", os.path.join(HERE, "full.png"))

    info = page.evaluate(r"""
    () => {
      const out = {labels: [], svgs: [], tails: []};
      document.querySelectorAll('[aria-label],[title],[data-testid]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        out.labels.push({a: el.getAttribute('aria-label')||'', t: el.getAttribute('title')||'',
                         d: el.getAttribute('data-testid')||'', tag: el.tagName.toLowerCase(),
                         cls: (el.className||'').toString().slice(0,50),
                         x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)});
      });
      document.querySelectorAll('svg').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8 || r.width > 200) return;
        out.svgs.push({x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
                       pcls: (el.parentElement && el.parentElement.className || '').toString().slice(0,50)});
      });
      document.querySelectorAll('button,[role=button]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 4) return;
        out.tails.push({txt: (el.innerText||'').trim().slice(0,14), tag: el.tagName.toLowerCase(),
                        cls: (el.className||'').toString().slice(0,50),
                        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)});
      });
      return out;
    }
    """)
    print("\naria/title 元素:", len(info["labels"]))
    for x in info["labels"][:25]:
        print(f"   a='{x['a']}' t='{x['t']}' d='{x['d']}' {x['tag']} ({x['x']},{x['y']}) {x['w']}x{x['h']}")
    print("\n小图标(疑似按钮):", len(info["svgs"]))
    for x in info["svgs"][-12:]:
        print(f"   ({x['x']},{x['y']}) {x['w']}x{x['h']}  parent={x['pcls']}")
    print("\nbutton 元素:", len(info["tails"]))
    for x in info["tails"][:20]:
        print(f"   '{x['txt']}' {x['tag']} ({x['x']},{x['y']}) {x['w']}x{x['h']} {x['cls']}")
    b.close()
