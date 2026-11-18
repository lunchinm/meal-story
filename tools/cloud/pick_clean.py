# -*- coding: utf-8 -*-
"""清掉盖在卡片上的透明层，再点音色 → 预付费音色 → 目标音色。"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
TARGET = os.environ.get("TARGET", "米粒")

CLEAR = r"""
() => {
  let n = 0;
  document.querySelectorAll('div').forEach(el => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const txt = (el.innerText || '').trim();
    if (r.width > 700 && r.height > 500 && !txt &&
        (cs.position === 'fixed' || cs.position === 'absolute')) {
      el.style.pointerEvents = 'none';
      n += 1;
    }
  });
  return n;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=60000)
    page.wait_for_timeout(8000)

    print("清掉的透明层:", page.evaluate(CLEAR))
    page.wait_for_timeout(500)
    top = page.evaluate("""() => {
      const el = document.elementFromPoint(1288, 507);
      return el ? {tag: el.tagName, cls: (el.className||'').toString().slice(0,40),
                   txt: (el.innerText||'').trim().slice(0,20)} : null;
    }""")
    print("现在 (1288,507) 上是:", top)

    page.mouse.click(1288, 507)
    page.wait_for_timeout(3000)
    page.screenshot(path=os.path.join(HERE, "n1.png"))
    t = page.evaluate("() => document.body.innerText || ''")
    marks = [m for m in ["预付费音色", "后付费音色", "小何 2.0", "温暖阿虎", TARGET] if m in t]
    print("点击后面板命中:", marks)
    if not marks:
        print("仍未打开")
        b.close()
        sys.exit(1)

    for label in ["预付费音色", "预付音色", "我的音色"]:
        loc = page.get_by_text(label, exact=True).first
        if loc.count():
            loc.click(force=True)
            print("已切分类:", label)
            page.wait_for_timeout(2500)
            break
    page.screenshot(path=os.path.join(HERE, "n2.png"))

    pick = page.get_by_text(TARGET, exact=True).first
    print(f"「{TARGET}」条目:", pick.count())
    if pick.count():
        pick.click(force=True)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(HERE, "n3.png"))
        txt = page.evaluate("() => document.body.innerText || ''")
        print("当前音色含目标:", TARGET in txt)
        if TARGET in txt:
            ctx.storage_state(path=STATE)
            print("已把当前状态写回 state.json")
    b.close()
