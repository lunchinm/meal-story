# -*- coding: utf-8 -*-
"""更细的页面侦察：把输入区、可点击元素、以及所有带关键字的节点都列出来。
用法: ~/tts-venv/bin/python probe2.py [--type "要输入的文字"]
"""
import argparse
import json
import os

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
SHOT = os.path.join(HERE, "probe2.png")

JS = r"""
() => {
  const out = {editors: [], clickables: [], keywords: []};
  const vis = (r) => r.width > 4 && r.height > 4;
  document.querySelectorAll('textarea,input,[contenteditable="true"],[role="textbox"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (!vis(r)) return;
    out.editors.push({tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().slice(0,80),
      ph: el.getAttribute('placeholder')||'', x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height)});
  });
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (!vis(r) || r.width > 900 || r.height > 400) return;
    const cs = getComputedStyle(el);
    const txt = (el.innerText||'').trim();
    if (cs.cursor === 'pointer' && txt && txt.length < 24) {
      out.clickables.push({txt, cls: (el.className||'').toString().slice(0,60),
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)});
    }
  });
  const KW = ['生成','合成','试听','播放','下载','音色','我的音色','单人模式','音调','语速'];
  document.querySelectorAll('*').forEach(el => {
    const txt = (el.innerText||'').trim();
    if (!txt || txt.length > 16) return;
    if (KW.some(k => txt.includes(k))) {
      const r = el.getBoundingClientRect();
      if (!vis(r)) return;
      out.keywords.push({txt, tag: el.tagName.toLowerCase(),
        cls: (el.className||'').toString().slice(0,60),
        x: Math.round(r.x), y: Math.round(r.y)});
    }
  });
  return out;
}
"""


def uniq(items, key):
    seen, res = set(), []
    for it in items:
        k = key(it)
        if k in seen:
            continue
        seen.add(k)
        res.append(it)
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--type", default="")
    args = ap.parse_args()

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx_kwargs = dict(locale="zh-CN", viewport={"width": 1500, "height": 950})
        if os.path.exists(STATE):
            ctx_kwargs["storage_state"] = STATE
        ctx = b.new_context(**ctx_kwargs)
        page = ctx.new_page()
        page.goto(URL, wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(4000)

        info = page.evaluate(JS)
        print("输入区:")
        for e in uniq(info["editors"], lambda x: (x["x"], x["y"])):
            print("  ", e)
        print(f"\n可点击元素 {len(info['clickables'])} 个（去重前）:")
        for c in uniq(info["clickables"], lambda x: x["txt"])[:35]:
            print(f"   '{c['txt']}'  ({c['x']},{c['y']}) {c['w']}x{c['h']}")
        print(f"\n关键字节点 {len(info['keywords'])} 个:")
        for k in uniq(info["keywords"], lambda x: x["txt"])[:30]:
            print(f"   '{k['txt']}' {k['tag']} ({k['x']},{k['y']})")

        if args.type:
            done = False
            for sel in ["[contenteditable='true']", "textarea", "input[type='text']"]:
                loc = page.locator(sel).first
                if loc.count():
                    loc.click()
                    page.wait_for_timeout(300)
                    page.keyboard.type(args.type, delay=10)
                    page.wait_for_timeout(1500)
                    print(f"\n已用 {sel} 输入文本")
                    done = True
                    break
            if not done:
                print("\n没找到输入区")
            page.screenshot(path=SHOT)
            print("截图:", SHOT)

        json.dump(info, open(os.path.join(HERE, "probe2.json"), "w"), ensure_ascii=False, indent=1)
        b.close()


if __name__ == "__main__":
    main()
