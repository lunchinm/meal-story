# -*- coding: utf-8 -*-
"""构建后把主题脚本挂到 index.html 末尾。"""
import io

p = ".webgal-src/packages/webgal/dist/index.html"
s = io.open(p, encoding="utf-8").read()
if "theme-inject.js" not in s:
    s = s.replace("</body>", '  <script src="theme-inject.js"></script>\n</body>')
    io.open(p, "w", encoding="utf-8").write(s)
print("主题脚本注入完成")