# 今天吃什么？——校园膳食调查簿

“合理膳食 · 免疫基石”创意宣传大赛作品 · 四川大学华西临床医学院
网页互动叙事（校园膳食调查）：四章、三种结局，含群聊、看图核实、配餐、瓶身对比、调查簿等互动。

**在线试玩**：https://lunchinm.github.io/meal-story/

技术形态：**WebGAL 4.6.7（静态 SPA）+ 自绘纸质「调查簿」UI + 构建期剧本转换**。
（早期用自研 HTML 原型，已废弃并清除，仓库现在只有 WebGAL 版本。）

## 先读这三份

| 文档 | 用途 |
|---|---|
| [docs/说明文档.md](docs/说明文档.md) | 项目是什么、三分钟跑起来、目录、剧本模型、界面规则、构建发布 |
| [docs/交付文档.md](docs/交付文档.md) | 交付清单、验收步骤、素材来源、怎么改内容、交接要点 |
| [docs/问题文档.md](docs/问题文档.md) | 已知问题与优先级、已修复问题留档 |
| [docs/设计说明.md](docs/设计说明.md) | 按剧本展开的设计细节（分层规则、互动节点、状态分支） |
| docs/archive/ | 历史过程文档（试玩记录、剧本对照审查、进度、旧规范） |

## 快速开始

```powershell
cd ..\WebGAL-src ; yarn webgal:build      # 首次：先跑 .github/patch-engine.py 打引擎补丁
cd ..\meal-story
python tools\sync-dist.py local           # 同步内容进 dist
python tools\serve.py                     # 默认 8080，可 PORT=8123
```

## 改剧本（写手看这段）

剧情全在 `content/act1..4.json`（816 节点 / 12 种类型），改完跑：

```powershell
python tools\convert-to-webgal.py
python tools\export-line-meta.py
python tools\export-chat-meta.py
python tools\export-ui-data.py
python tools\export-story-meta.py
python tools\sync-dist.py <新版本号>
```

节点字段与界面规则见 `docs/说明文档.md` 第 4、5 节。**不要手改** `webgal-game/scene/*.txt`（生成物）。

## 发布前必做

1. 把 `.github/inject_theme.py` 与 `tools/patch-dist.py` 里的 `theme-inject.js?v=` 改成新版本号（不改等于没发布）
2. 确认 `git commit` 真的成功（这台机器常出现 `.git/index.lock` 占用导致静默失败）
3. 触发 `构建并发布 WebGAL 版` 工作流，等 CI 绿

## 轻量回归

```powershell
node tools\qa-v3.mjs http://127.0.0.1:8123/ --out qa-1      # 32 条
node tests\qa-v4-features.mjs http://127.0.0.1:8123/ qa-2   # 9 条
```

> 这两套只覆盖“有没有内容”，查不出语义错误（界面串台、发言人错配、重复）。
> 语义问题仍需人肉试玩，参考 `docs/archive/试玩记录.md`。
