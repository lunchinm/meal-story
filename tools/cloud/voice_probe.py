# -*- coding: utf-8 -*-
"""云端侦察脚本：打开豆包语音体验页，截图 + 摸清可操作元素。

用法:
    python3 voice_probe.py            # 只截图和结构
    python3 voice_probe.py --text "文本" --voice "音色名"
"""
import argparse
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
SHOT = os.path.join(HERE, "probe.png")
REQ_LOG = os.path.join(HERE, "requests.jsonl")


def dump_interactive(page):
    """把所有看得见的输入框、按钮、下拉列出来，便于定位。"""
    js = """
    () => {
      const out = [];
      const q = (sel, kind) => document.querySelectorAll(sel).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const txt = (el.innerText || el.value || el.getAttribute('placeholder') || '').trim().slice(0, 40);
        out.push({kind, tag: el.tagName.toLowerCase(), text: txt,
                  cls: (el.className || '').toString().slice(0, 60),
                  x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height)});
      });
      q('button', 'button');
      q('input', 'input');
      q('textarea', 'textarea');
      q('[role=combobox]', 'combobox');
      q('[class*=select]', 'selectish');
      return out;
    }
    """
    return page.evaluate(js)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", default="")
    ap.add_argument("--voice", default="")
    ap.add_argument("--wait", type=int, default=60, help="等登录的最长秒数")
    args = ap.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx_kwargs = dict(locale="zh-CN", viewport={"width": 1600, "height": 1000},
                          user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                      "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"))
        if os.path.exists(STATE):
            ctx_kwargs["storage_state"] = STATE
        ctx = browser.new_context(**ctx_kwargs)
        page = ctx.new_page()

        seen = []
        page.on("response", lambda r: seen.append({
            "url": r.url, "status": r.status,
            "type": r.headers.get("content-type", ""),
        }))
        page.goto(URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(4000)
        page.screenshot(path=SHOT, full_page=False)
        print("当前地址:", page.url)
        print("标题:", page.title())

        logged_in = "login" not in page.url.lower() and "passport" not in page.url.lower()
        print("看起来已登录:", logged_in)

        if not logged_in:
            print(f"等待扫码登录，最长 {args.wait} 秒（截图见 {SHOT}）")
            t0 = time.time()
            while time.time() - t0 < args.wait:
                page.wait_for_timeout(3000)
                if "login" not in page.url.lower() and "passport" not in page.url.lower():
                    logged_in = True
                    break
            page.wait_for_timeout(3000)
            page.screenshot(path=SHOT, full_page=False)
            print("登录后地址:", page.url)
            if logged_in:
                ctx.storage_state(path=STATE)
                print("登录态已保存:", STATE)

        if logged_in:
            items = dump_interactive(page)
            print(f"\n可操作元素 {len(items)} 个（前 40）:")
            for it in items[:40]:
                print(f"  {it['kind']:<9} {it['tag']:<8} ({it['x']},{it['y']}) {it['w']}x{it['h']}  {it['text']}")
            json.dump(items, open(os.path.join(HERE, "elements.json"), "w"), ensure_ascii=False, indent=1)

        json.dump(seen, open(REQ_LOG, "w"), ensure_ascii=False, indent=1)
        audio = [r for r in seen if "audio" in r["type"] or "tts" in r["url"]]
        print(f"\n网络请求 {len(seen)} 条，其中疑音频/TTS {len(audio)} 条")
        for r in audio[:10]:
            print("  ", r["status"], r["type"][:30], r["url"][:110])

        browser.close()


if __name__ == "__main__":
    main()
