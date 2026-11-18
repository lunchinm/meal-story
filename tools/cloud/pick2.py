# -*- coding: utf-8 -*-
"""用 DOM 定位音色卡片并派发点击，轮询等面板出现。"""
import os

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
TARGET = os.environ.get("TARGET", "米粒")

FIND_CARD = r"""
() => {
  const cands = [...document.querySelectorAll('div')].filter(el => {
    const r = el.getBoundingClientRect();
    const t = (el.innerText || '').trim();
    return r.width > 300 && r.width < 420 && r.height > 40 && r.height < 90
           && t.startsWith('Vivi') && r.x > 1000;
  });
  if (!cands.length) return null;
  const el = cands[0];
  const r = el.getBoundingClientRect();
  return {x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
          txt: el.innerText.slice(0, 20), cls: (el.className || '').toString().slice(0, 50)};
}
"""

OPEN_MARKS = ["小何 2.0", "温暖阿虎", "温柔妈妈", "解说小明", "预付费音色", "后付费音色"]


def state(page):
    t = page.evaluate("() => document.body.innerText || ''")
    return [m for m in OPEN_MARKS if m in t]


with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle", timeout=90000)
    page.wait_for_timeout(5000)
    page.mouse.click(1450, 620)   # 验证过不会误触菜单
    page.wait_for_timeout(500)
    page.add_style_tag(content="#navbar{pointer-events:none !important}")

    card = page.evaluate(FIND_CARD)
    print("卡片:", card)

    for i in range(3):
        if card:
            page.mouse.click(card["x"], card["y"])
        else:
            page.evaluate("""() => {
              const el = [...document.querySelectorAll('div')].find(e => {
                const r = e.getBoundingClientRect();
                return (e.innerText||'').trim().startsWith('Vivi') && r.width > 300 && r.x > 1000;
              });
              if (el) el.click();
            }""")
        for _ in range(12):
            page.wait_for_timeout(500)
            if state(page):
                break
        hit = state(page)
        print(f"第{i+1}次点击后命中: {hit}")
        if hit:
            break

    page.screenshot(path=os.path.join(HERE, "g1.png"))
    if not state(page):
        print("面板未打开，结束")
        b.close()
        raise SystemExit(1)

    for label in ["预付费音色", "预付音色", "我的音色", "复刻音色"]:
        loc = page.get_by_text(label, exact=True).first
        if loc.count():
            print("切分类:", label)
            loc.click(force=True)
            page.wait_for_timeout(2500)
            break
    page.screenshot(path=os.path.join(HERE, "g2.png"))

    pick = page.get_by_text(TARGET, exact=True).first
    print(f"「{TARGET}」条目数:", pick.count())
    if pick.count():
        pick.click(force=True)
        page.wait_for_timeout(2500)
        page.screenshot(path=os.path.join(HERE, "g3.png"))
        print("已点击目标音色")
    b.close()

