# -*- coding: utf-8 -*-
"""点右下角圆形按钮，抓合成接口。"""
import os

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
TEXT = "菜基本一样，就是西兰花没有照片里站得那么整齐。"

posts, got = [], []

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
    ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                        storage_state=STATE if os.path.exists(STATE) else None)
    page = ctx.new_page()
    page.on("request", lambda r: posts.append((r.method, r.url)) if r.method == "POST" else None)

    def on_resp(r):
        ct = r.headers.get("content-type", "")
        if "audio" in ct or "octet-stream" in ct:
            try:
                d = r.body()
                if len(d) > 2000:
                    n = f"a{len(got)+1}.bin"
                    open(os.path.join(HERE, n), "wb").write(d)
                    got.append((r.url[:90], ct, len(d), n))
            except Exception:  # noqa: BLE001
                pass

    page.on("response", on_resp)
    page.goto(URL, wait_until="networkidle", timeout=90000)
    page.wait_for_timeout(3000)

    # 点空白处关掉「产品与服务」菜单
    page.mouse.click(1450, 620)
    page.wait_for_timeout(1200)
    page.screenshot(path=os.path.join(HERE, "s1-closed.png"))

    page.evaluate("() => document.querySelector('.ProseMirror').focus()")
    page.wait_for_timeout(300)
    page.keyboard.type(TEXT, delay=10)
    page.wait_for_timeout(1500)
    page.screenshot(path=os.path.join(HERE, "s2-typed.png"))

    # 右下角圆形按钮
    for (x, y) in [(1459, 812), (1455, 880), (1440, 900)]:
        page.mouse.click(x, y)
        page.wait_for_timeout(6000)
        if posts or got:
            print(f"点 ({x},{y}) 后出现请求")
            break
        print(f"点 ({x},{y}) 无反应")

    page.wait_for_timeout(10000)
    page.screenshot(path=os.path.join(HERE, "s3-after.png"))

    print("\nPOST:")
    for m, u in posts[-10:]:
        print("  ", u[:130])
    print("\n音频响应:")
    for u, ct, n, f in got:
        print(f"  {n} 字节 {ct[:24]} {u} → {f}")
    if not got:
        print("  无")
    b.close()
