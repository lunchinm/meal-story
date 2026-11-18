# -*- coding: utf-8 -*-
"""打开音色面板，列出分类 tab 与全部条目，找到复刻音色。"""
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
    page.wait_for_timeout(600)
    page.add_style_tag(content="#navbar{pointer-events:none !important}")

    page.mouse.click(1288, 507)
    page.wait_for_timeout(2500)
    page.screenshot(path=os.path.join(HERE, "v-panel.png"))

    info = page.evaluate(r"""
    () => {
      const out = {panel: null, tabs: [], items: [], search: []};
      // 面板：包含"小何"或"音色"字样、面积大的浮层
      let best = null, bestArea = 0;
      document.querySelectorAll('div').forEach(el => {
        const r = el.getBoundingClientRect();
        const t = el.innerText || '';
        if (r.width < 300 || r.height < 200) return;
        if (!/音色|声音|场景/.test(t)) return;
        const area = r.width * r.height;
        if (area > bestArea) { bestArea = area; best = {x: Math.round(r.x), y: Math.round(r.y),
          w: Math.round(r.width), h: Math.round(r.height), cls: (el.className||'').toString().slice(0,60)}; }
      });
      out.panel = best;
      // tab：面板顶部、文字短、可点
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 20 || r.width > 200 || r.height < 16 || r.height > 60) return;
        const t = (el.innerText || '').trim();
        if (!t || t.length > 8) return;
        if (r.y < 200 || r.y > 400) return;
        out.tabs.push({t, x: Math.round(r.x), y: Math.round(r.y)});
      });
      // 输入框（搜索音色）
      document.querySelectorAll('input').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 50) return;
        out.search.push({ph: el.getAttribute('placeholder')||'', x: Math.round(r.x), y: Math.round(r.y)});
      });
      // 条目
      document.querySelectorAll('div[class*="rounded-xl"]').forEach(el => {
        const t = (el.innerText || '').trim().split('\n')[0];
        if (!t) return;
        const r = el.getBoundingClientRect();
        if (r.width < 150) return;
        out.items.push({t: t.slice(0, 16), x: Math.round(r.x), y: Math.round(r.y)});
      });
      return out;
    }
    """)
    print("面板位置:", info["panel"])
    print("\n顶部 tab 候选:")
    for t in info["tabs"][:20]:
        print(f"   '{t['t']}' ({t['x']},{t['y']})")
    print("\n搜索框:", info["search"][:5])
    print(f"\n音色条目 {len(info['items'])} 个（前 20）:")
    for i in info["items"][:20]:
        print(f"   '{i['t']}' ({i['x']},{i['y']})")
    has = [i["t"] for i in info["items"] if any(k in i["t"] for k in ("米粒", "许知夏", "苏桃", "周简", "陆燃", "罗师傅"))]
    print("\n面板中的复刻音色:", has)
    b.close()
