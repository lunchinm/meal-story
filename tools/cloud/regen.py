# -*- coding: utf-8 -*-
"""针对性重配：按 id 列表重生成指定句子，可覆盖朗读文本。

输入 json 格式：
{
  "a3-55": {"role": "苏桃", "text": "背面倒是分得很清楚。"},
  "a3-56": {"role": "许知夏", "text": "（原文）"}
}

跑法：~/tts-venv/bin/python regen.py regen.json
输出：regen-out/{id}.mp3
"""
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
OUT = os.path.join(HERE, "regen-out")
LOG = os.path.join(HERE, "regen.log")

KILL = """
#navbar, #navbar *, [id^="garfish_app_for_navbar"], [id^="garfish_app_for_navbar"] * {
  pointer-events: none !important;
}
"""


def log(m):
    line = f"[{time.strftime('%H:%M:%S')}] {m}"
    print(line, flush=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def card_text(page):
    try:
        return page.evaluate("""() => { const c = document.querySelector('.card');
          return c ? (c.innerText||'').trim().split('\\n')[0] : ''; }""")
    except Exception:  # noqa: BLE001
        return ""


def set_voice(page, role):
    if card_text(page) == role:
        return True
    for _ in range(3):
        box = page.evaluate("""() => { const c = document.querySelector('.card');
          if (!c) return null; const r = c.getBoundingClientRect();
          return {r: Math.round(r.right), cy: Math.round((r.top + r.bottom) / 2)}; }""")
        if not box:
            page.wait_for_timeout(2000)
            continue
        page.mouse.click(box["r"] - 40, box["cy"])
        page.wait_for_timeout(2200)
        tab = page.get_by_text("预付费音色", exact=True).first
        if tab.count():
            tab.click(force=True)
            page.wait_for_timeout(1400)
        row = page.get_by_text(role, exact=True).first
        if row.count():
            row.click(force=True)
            page.wait_for_timeout(1000)
            ok = page.get_by_text("确定", exact=True).first
            if ok.count():
                ok.click(force=True)
                page.wait_for_timeout(2200)
        if card_text(page) == role:
            return True
        page.keyboard.press("Escape")
        page.wait_for_timeout(800)
    return False


def synth(page, text):
    page.evaluate("() => document.querySelector('.ProseMirror').focus()")
    page.keyboard.press("Control+a")
    page.keyboard.press("Delete")
    page.keyboard.type(text, delay=6)
    page.wait_for_timeout(300)
    with page.expect_response(
        lambda r: "audio" in (r.headers.get("content-type") or "") and r.status in (200, 206),
        timeout=60000,
    ) as info:
        page.get_by_text("合成试听", exact=True).first.click(force=True, timeout=15000)
    return info.value.body()


def main():
    cfg_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "regen.json")
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    os.makedirs(OUT, exist_ok=True)
    log(f"待重配 {len(cfg)} 条")

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = b.new_context(locale="zh-CN", viewport={"width": 1600, "height": 1000},
                            storage_state=STATE if os.path.exists(STATE) else None)
        page = ctx.new_page()
        page.goto(URL, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_function("() => (document.body.innerText||'').includes('单人模式')", timeout=60000)
        page.wait_for_timeout(4000)
        page.add_style_tag(content=KILL)

        ok = 0
        for nid, item in cfg.items():
            role = item["role"]
            text = item["text"]
            if not set_voice(page, role):
                log(f"{nid}: 音色切到 {role} 失败，跳过")
                continue
            try:
                buf = synth(page, text)
            except Exception as e:  # noqa: BLE001
                log(f"{nid}: 合成失败 {str(e)[:70]}")
                continue
            if buf and len(buf) > 1500:
                with open(os.path.join(OUT, f"{nid}.mp3"), "wb") as f:
                    f.write(buf)
                ok += 1
                log(f"{nid} 完成（{role}，{len(text)}字，{len(buf)}字节）")
            else:
                log(f"{nid}: 返回数据太小")

        log(f"结束：成功 {ok}/{len(cfg)}")
        b.close()


if __name__ == "__main__":
    main()
