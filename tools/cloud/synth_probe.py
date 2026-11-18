# -*- coding: utf-8 -*-
"""试合成一句：输入文本→点生成→抓合成接口与音频。

用法: ~/tts-venv/bin/python synth_probe.py --text "..." [--voice 米粒]
"""
import argparse
import json
import os
import re

from playwright.sync_api import sync_playwright

URL = "https://console.volcengine.com/speech/new/experience/tts?projectName=default"
HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
SHOT = os.path.join(HERE, "synth.png")
AUDIO_DIR = os.path.join(HERE, "probe-audio")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text", default="菜基本一样，就是西兰花没有照片里站得那么整齐。")
    ap.add_argument("--voice", default="")
    ap.add_argument("--shot", default=SHOT)
    args = ap.parse_args()

    os.makedirs(AUDIO_DIR, exist_ok=True)
    posts, audios = [], []

    with sync_playwright() as p:
        b = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = b.new_context(locale="zh-CN", viewport={"width": 1500, "height": 950},
                            storage_state=STATE if os.path.exists(STATE) else None)
        page = ctx.new_page()

        page.on("response", lambda r: posts.append((r.request.method, r.url, r.status,
                                                    r.headers.get("content-type", "")))
                if r.request.method == "POST" else None)

        def on_body(resp):
            ct = resp.headers.get("content-type", "")
            if "audio" in ct or "octet-stream" in ct:
                try:
                    data = resp.body()
                    if len(data) > 3000:
                        name = "resp-%d.bin" % (len(audios) + 1)
                        open(os.path.join(AUDIO_DIR, name), "wb").write(data)
                        audios.append((resp.url[:80], ct, len(data), name))
                except Exception:  # noqa: BLE001
                    pass

        page.on("response", on_body)

        page.goto(URL, wait_until="networkidle", timeout=90000)
        page.wait_for_timeout(3000)
        # 顶部导航会拦截指针事件
        page.add_style_tag(content="#navbar{pointer-events:none !important}")
        page.wait_for_timeout(500)

        ed = page.locator(".ProseMirror").first
        if not ed.count():
            print("没找到编辑器")
            b.close()
            return
        page.evaluate("() => document.querySelector('.ProseMirror').focus()")
        page.wait_for_timeout(300)
        page.keyboard.type(args.text, delay=12)
        page.wait_for_timeout(1500)
        page.screenshot(path=args.shot)
        print("已输入文本，截图:", args.shot)

        # 找生成按钮
        clicked = False
        for label in ["生成", "合成", "开始合成", "生成语音", "试听"]:
            try:
                loc = page.get_by_text(label, exact=False).first
                if loc.count():
                    box = loc.bounding_box()
                    if not box:
                        continue
                    loc.click(force=True, timeout=8000)
                    print(f"点了「{label}」({box['x']:.0f},{box['y']:.0f})")
                    clicked = True
                    break
            except Exception as e:  # noqa: BLE001
                print(f"点「{label}」失败:", str(e)[:90])

        if not clicked:
            print("没找到生成按钮，列出所有含关键字的按钮：")
            btns = page.evaluate(
                "() => [...document.querySelectorAll('button,[role=button],div')]"
                ".map(e => ({t: (e.innerText||'').trim(), c: (e.className||'').toString().slice(0,40)}))"
                ".filter(x => x.t && x.t.length < 10)"
                ".filter((v,i,a) => a.findIndex(y => y.t===v.t) === i).slice(0, 40)")
            for x in btns:
                print("   ", x["t"], "|", x["c"])
        else:
            page.wait_for_timeout(12000)
            page.screenshot(path=args.shot)

        print("\nPOST 请求:")
        for m, u, s, ct in posts[-15:]:
            print(f"  {s} {u[:120]}  [{ct[:30]}]")
        print("\n抓到音频响应:")
        for url, ct, n, name in audios:
            print(f"  {n} 字节 {ct[:30]} {url} → {name}")
        if not audios:
            print("  没有 audio 类型的响应")

        json.dump({"posts": posts, "audios": audios}, open(os.path.join(HERE, "synth-net.json"), "w"),
                  ensure_ascii=False, indent=1)
        b.close()


if __name__ == "__main__":
    main()
