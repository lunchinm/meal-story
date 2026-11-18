# -*- coding: utf-8 -*-
"""诊断音色选择器：点击后监控 DOM 新增节点，找出弹层在哪。"""
import json
import os

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")

MONITOR = r"""
() => {
  window.__added = [];
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1) {
          const t = (n.innerText || '').trim();
          window.__added.push({tag: n.tagName, cls: (n.className||'').toString().slice(0,60),
                               len: t.length, txt: t.slice(0, 120)});
        }
      }
    }
  });
  obs.observe(document.body, {childList: true, subtree: true});
  return 'watching';
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.goto(URL, wait_until="networkidle", timeout=90000)
    page.wait_for_timeout(3000)
    page.mouse.click(1450, 620)
    page.wait_for_timeout(600)
    # 关掉可能的遮罩
    page.add_style_tag(content="#navbar{pointer-events:none !important}")
    page.evaluate(MONITOR)

    def probe(desc, action):
        page.evaluate("() => { window.__added = []; }")
        try:
            action()
        except Exception as e:  # noqa: BLE001
            print(f"{desc} 动作异常: {str(e)[:80]}")
        page.wait_for_timeout(1800)
        added = page.evaluate("() => window.__added")
        big = [a for a in added if a["len"] > 8]
        print(f"\n--- {desc} --- 新增节点 {len(added)}，其中有文字的 {len(big)}")
        for a in big[:6]:
            print(f"   {a['tag']} .{a['cls'][:40]} len={a['len']} :: {a['txt'][:90]}")
        return big

    # 1) 点击卡片容器
    probe("点击卡片(1288,507)", lambda: page.mouse.click(1288, 507))
    page.screenshot(path=os.path.join(HERE, "d1.png"))

    # 2) 悬停卡片
    probe("悬停卡片", lambda: page.mouse.move(1288, 507))

    # 3) 点右侧切换图标
    probe("点切换图标(1445,510)", lambda: page.mouse.click(1445, 510))
    page.screenshot(path=os.path.join(HERE, "d3.png"))

    # 4) 键盘：聚焦卡片后按 Enter
    def kb():
        page.mouse.click(1288, 507)
        page.wait_for_timeout(400)
        page.keyboard.press("Enter")
    probe("点击后回车", kb)

    # 5) 全页搜索"米粒"
    found = page.evaluate(
        "() => { const hits=[]; const w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);"
        "let n; while(n=w.nextNode()){ const t=(n.textContent||'').trim();"
        "if(t && (t.includes('米粒')||t.includes('我的音色')||t.includes('复刻音色'))){"
        "const el=n.parentElement; const r=el.getBoundingClientRect();"
        "hits.push({t: t.slice(0,20), tag: el.tagName, x: Math.round(r.x), y: Math.round(r.y)});}} return hits; }")
    print("\n页面中出现关键词:", json.dumps(found[:10], ensure_ascii=False))
    b.close()
