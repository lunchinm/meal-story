# -*- coding: utf-8 -*-
"""云端登录：切到豆包账号登录（通常带扫码），截图供扫码，成功后保存登录态。

用法:
    ~/tts-venv/bin/python login_scan.py --wait 300
"""
import argparse
import os
import time

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
SHOT = os.path.join(HERE, "login.png")


def snap(page, tag):
    page.screenshot(path=SHOT)
    print(f"[{tag}] 截图已更新 {page.url[:80]}", flush=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--wait", type=int, default=300)
    args = ap.parse_args()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = browser.new_context(
            locale="zh-CN", viewport={"width": 1400, "height": 900},
            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"))
        page = ctx.new_page()
        page.goto(URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(3000)
        snap(page, "初始")

        # 切到「豆包账号登录」，那里一般是扫码
        for label in ["豆包账号登录", "豆包账号"]:
            try:
                el = page.get_by_text(label, exact=False).first
                if el.count():
                    el.click(timeout=5000)
                    page.wait_for_timeout(2500)
                    snap(page, f"点了{label}")
                    break
            except Exception as e:  # noqa: BLE001
                print("点", label, "失败:", str(e)[:80])

        # 看看页面上有哪些登录方式
        try:
            texts = page.evaluate(
                "() => [...document.querySelectorAll('div,span,a,button')]"
                ".map(e => (e.innerText||'').trim()).filter(t => t && t.length < 12)"
                ".filter((v,i,a) => a.indexOf(v) === i).slice(0, 60)")
            print("页面短文本:", " / ".join(texts))
        except Exception:  # noqa: BLE001
            pass

        print(f"等待扫码，最长 {args.wait} 秒", flush=True)
        t0 = time.time()
        logged = False
        while time.time() - t0 < args.wait:
            page.wait_for_timeout(4000)
            if not any(k in page.url.lower() for k in ("login", "passport", "signin")):
                logged = True
                break
            if int(time.time() - t0) % 40 < 4:
                snap(page, f"等待{int(time.time()-t0)}s")

        if logged:
            page.wait_for_timeout(5000)
            snap(page, "已登录")
            ctx.storage_state(path=STATE)
            print("登录成功，登录态已保存:", STATE, flush=True)
        else:
            snap(page, "超时")
            print("超时未登录", flush=True)

        browser.close()


if __name__ == "__main__":
    main()
