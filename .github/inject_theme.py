# -*- coding: utf-8 -*-
"""构建后：去掉 Live2D 插件加载 + 挂主题脚本。"""
import io

p = ".webgal-src/packages/webgal/dist/index.html"
s = io.open(p, encoding="utf-8").read()

s = s.replace("loadIifePlugin('lib/live2d.min.js')", "Promise.resolve(null)")
s = s.replace("loadIifePlugin('lib/live2dcubismcore.min.js')", "Promise.resolve(null)")

if "theme-inject.js" not in s:
    s = s.replace("</body>", '  <script src="theme-inject.js?v=20261118i"></script>\n</body>')

io.open(p, "w", encoding="utf-8").write(s)
print("注入完成；live2d 调用剩余:", s.count("loadIifePlugin('lib/live2d"))





