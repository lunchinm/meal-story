# -*- coding: utf-8 -*-
"""构建后：去掉 Live2D 插件加载 + 挂主题脚本。"""
import io

p = ".webgal-src/packages/webgal/dist/index.html"
s = io.open(p, encoding="utf-8").read()

base = ('<style id="paper-base-bg">html,body{background:#f6efe0 !important;}</style>')
preload = ('<style id="paper-preload">html,body{background:#f6efe0 !important}#root{opacity:0 !important}</style>')
if "paper-base-bg" not in s:
    s = s.replace("<head>", "<head>" + base, 1)
if "paper-preload" not in s:
    s = s.replace("</head>", preload + "</head>", 1)
s = s.replace("background: black;", "background: #f6efe0;")
s = s.replace("background-color: black;", "background-color: #f6efe0;")
s = s.replace("loadIifePlugin('lib/live2d.min.js')", "Promise.resolve(null)")
s = s.replace("loadIifePlugin('lib/live2dcubismcore.min.js')", "Promise.resolve(null)")

if "theme-inject.js" not in s:
    s = s.replace("</body>", '  <script src="theme-inject.js?v=20261119w"></script>\n</body>')

io.open(p, "w", encoding="utf-8").write(s)
print("注入完成；live2d 调用剩余:", s.count("loadIifePlugin('lib/live2d"))























