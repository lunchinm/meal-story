# -*- coding: utf-8 -*-
"""带重试地打开音色面板，并定位「我的音色/复刻音色」分类。"""
import json
import os
import time

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")

PANEL_OPEN = r"""
() => {
  const t = document.body.innerText || '';
  // 面板打开时会出现官方音色名
  const marks = ['小何 2.0', '温暖阿虎', '温柔妈妈', '解说小明', '我的音色', '复刻音色'];
  const hit = marks.filter(m => t.includes(m));
  return {open: hit.length > 0, hits: hit};
}
"""


def open_panel(page, tries=5):
    for i in range(tries):
        page.mouse.move(1250, 505)
        page.wait_for_timeout(400)
        page.mouse.click(1288, 507)
        page.wait_for_timeout(2600)
        st = page.evaluate(PANEL_OPEN)
        print(f"第{i+1}次点击 → 面板打开={st['open']} 命中={st['hits']}")
        if st["open"]:
            return True
    return False


with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle", timeout=90000)
    page.wait_for_timeout(4000)
    page.mouse.click(1450, 620)
    page.wait_for_timeout(600)
    page.add_style_tag(content="#navbar{pointer-events:none !important}")
    page.screenshot(path=os.path.join(HERE, "r0.png"))

    ok = open_panel(page)
    page.screenshot(path=os.path.join(HERE, "r1.png"))
    if not ok:
        print("面板始终没打开")
        b.close()
        raise SystemExit(1)

    # 面板里的分类 tab 与搜索框
    meta = page.evaluate(r"""
    () => {
      const out = {tabs: [], inputs: [], names: []};
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        const t = (el.innerText || '').trim();
        if (r.width > 20 && r.width < 220 && r.height > 14 && r.height < 64 && t && t.length <= 8) {
          if (r.y > 150 && r.y < 420 && r.x > 700) out.tabs.push({t, x: Math.round(r.x), y: Math.round(r.y)});
        }
      });
      document.querySelectorAll('input').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width > 80 && r.y > 150) out.inputs.push({ph: el.getAttribute('placeholder') || '',
          x: Math.round(r.x), y: Math.round(r.y)});
      });
      ['米粒','许知夏','苏桃','周简','陆燃','罗师傅'].forEach(n => {
        if ((document.body.innerText || '').includes(n)) out.names.push(n);
      });
      return out;
    }
    """)
    print("\n面板 tab:", [f"{t['t']}({t['x']},{t['y']})" for t in meta["tabs"][:15]])
    print("搜索框:", meta["inputs"][:5])
    print("面板中已出现的角色名:", meta["names"])
    json.dump(meta, open(os.path.join(HERE, "picker-meta.json"), "w"), ensure_ascii=False, indent=1)
    b.close()
