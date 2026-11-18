# -*- coding: utf-8 -*-
"""点「合成试听」，抓 WebSocket 与音频响应；可选切换音色。"""
import base64
import json
import os

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
TEXT = "菜基本一样，就是西兰花没有照片里站得那么整齐。"
VOICE = os.environ.get("VOICE", "")

frames, posts, got = [], [], []

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()

    def on_ws(ws):
        def on_frame(payload):
            s = payload if isinstance(payload, str) else f"<bin {len(payload)}>"
            frames.append((ws.url[:90], s[:120]))
            if isinstance(payload, str) and len(payload) > 500:
                open(os.path.join(HERE, f"ws-{len(frames)}.txt"), "w").write(payload)

        ws.on("framereceived", lambda pl: on_frame(pl if isinstance(pl, str) else pl))
    page.on("websocket", on_ws)
    page.on("request", lambda r: posts.append((r.method, r.url)) if r.method == "POST" else None)

    def on_resp(r):
        ct = r.headers.get("content-type", "")
        if "audio" in ct or "octet-stream" in ct or "mpeg" in ct:
            try:
                d = r.body()
                if len(d) > 1500:
                    n = f"a{len(got)+1}.bin"
                    open(os.path.join(HERE, n), "wb").write(d)
                    got.append((r.url[:80], ct, len(d), n))
            except Exception:  # noqa: BLE001
                pass
    page.on("response", on_resp)

    page.goto(URL, wait_until="networkidle", timeout=90000)
    page.wait_for_timeout(3000)
    page.mouse.click(1450, 620)
    page.wait_for_timeout(800)

    if VOICE:
        # 点音色卡片换音色
        card = page.get_by_text("Vivi 2.0", exact=False).first
        if card.count():
            card.click(force=True)
            page.wait_for_timeout(2500)
            page.screenshot(path=os.path.join(HERE, "voice-panel.png"))
            print("已点开音色面板，截图 voice-panel.png")

    page.evaluate("() => document.querySelector('.ProseMirror').focus()")
    page.keyboard.type(TEXT, delay=10)
    page.wait_for_timeout(1200)

    btn = page.get_by_text("合成试听", exact=False).first
    print("合成试听按钮存在:", btn.count())
    if btn.count():
        btn.click(force=True)
        print("已点击合成试听")
    page.wait_for_timeout(20000)

    page.screenshot(path=os.path.join(HERE, "after-synth.png"))
    print("\nPOST:", len(posts))
    for m, u in posts[-8:]:
        print("  ", u[:130])
    print("\nWebSocket 帧:", len(frames))
    for u, s in frames[:8]:
        print("  ", u, "|", s[:100])
    print("\n音频响应:")
    for u, ct, n, f in got:
        print(f"  {n} 字节 {ct[:24]} → {f}")
    if not got:
        print("  无")
    b.close()
