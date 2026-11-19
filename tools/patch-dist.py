# -*- coding: utf-8 -*-
"""本地构建后给 dist/index.html 打补丁：去掉 Live2D 加载、挂主题脚本。
   （CI 里用 .github/inject_theme.py，路径不同，效果一样）"""
import io
import sys

p = sys.argv[1] if len(sys.argv) > 1 else \
    r"C:\Users\MIC lunchinm\Desktop\学习资料\Vibe-Coding\合理膳食\WebGAL-src\packages\webgal\dist\index.html"

s = io.open(p, encoding="utf-8").read()
before = len(s)

s = s.replace("loadIifePlugin('lib/live2d.min.js')", "Promise.resolve(null)")
s = s.replace("loadIifePlugin('lib/live2dcubismcore.min.js')", "Promise.resolve(null)")

if "theme-inject.js" not in s:
    s = s.replace("</body>", '  <script src="theme-inject.js?v=20261119m"></script>\n</body>')

io.open(p, "w", encoding="utf-8").write(s)
print("补丁完成：", p)
print("  theme-inject 已挂:", "theme-inject.js" in s)
print("  live2d 已禁:", "Promise.resolve(null)" in s)
print("  长度", before, "→", len(s))




















