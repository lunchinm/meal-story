# -*- coding: utf-8 -*-
"""打包可玩离线压缩包到 release/（dist + 启动bat + 说明）。"""
import os
import shutil
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
DIST = ROOT.parent / "WebGAL-src" / "packages" / "webgal" / "dist"
VER = "20261119af"

stage = pathlib.Path(os.environ["TEMP"]) / ("meal-pack-" + VER)
shutil.rmtree(stage, ignore_errors=True)
shutil.copytree(DIST, stage)

(stage / "启动游戏.bat").write_text(
    '@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0"\r\n'
    'start "meal-story-server" /min cmd /c "python -m http.server 8081"\r\n'
    'timeout /t 2 >nul\r\nstart "" "http://127.0.0.1:8081/"\r\n',
    encoding="utf-8")
(stage / "使用说明.txt").write_text(
    "《今天吃什么？——校园膳食调查簿》离线包 v" + VER + "\r\n\r\n"
    "1. 解压整个文件夹（不要只拖 index.html）。\r\n"
    "2. 电脑需安装 Python 3。\r\n"
    "3. 双击「启动游戏.bat」，浏览器自动打开 http://127.0.0.1:8081/。\r\n"
    "4. 关闭黑色命令行窗口即停止。\r\n"
    "注意：不要直接双击 index.html（本地跨域会白屏）。\r\n"
    "在线版：https://lunchinm.github.io/meal-story/\r\n",
    encoding="utf-8")

rel = ROOT / "release"
rel.mkdir(exist_ok=True)
for old in rel.glob("meal-story-offline-*.zip"):
    old.unlink()
out = rel / ("meal-story-offline-" + VER)
shutil.make_archive(str(out), "zip", stage)
print("zip", out.name, round(out.with_suffix(".zip").stat().st_size / 1e6, 1), "MB")
