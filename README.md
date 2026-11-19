# 今天吃什么？——校园膳食调查簿

"合理膳食 · 免疫基石"创意宣传大赛作品 · 四川大学华西临床医学院
网页互动叙事（Galgame 风）：四章、三种结局，含群聊、看图核实、配餐、瓶身对比、调查簿等互动。

**在线试玩**：https://lunchinm.github.io/meal-story/
**当前版本**：`20261119af`
**技术形态**：WebGAL 4.6.7（静态 SPA）+ 自绘纸质「调查簿」UI + 构建期剧本转换。

> 接手请先读 [docs/交接文档.md](docs/交接文档.md)（架构、机制、坑、发布、待办），再按需读下面分册。

---

## 目录结构（文档与工作文件分离）

```
meal-story/
├─ README.md               本文件：入口与索引
├─ 启动游戏.bat            双击本地游玩（需 Python3）
├─ content/                ★ 剧本唯一事实源（act1..4.json，816 节点/12 类型）
├─ assets/                 素材：bg/ ch/ props/ voice/ sfx/ sheets/
├─ webgal-game/            构建输入：scene/(生成物,勿手改) theme-inject.js config/jump/flowchart/template
├─ tools/                  生产脚本：转换/导出/同步/服务/素材/反馈表
│   └─ dev/                工作文件：调试/复现/截图/面板遍历（不影响构建）
├─ tests/                  回归与路线验收（qa-v4 / acceptance-*）
├─ docs/                   ★ 纯文档（交接/说明/交付/问题/设计/改动 + archive/）
├─ release/                交付物：可玩压缩包 / 二维码 / 分享说明
└─ .github/                CI：patch-engine.py / inject_theme.py / workflows
```

文档索引：

| 文档 | 用途 |
|---|---|
| [docs/交接文档.md](docs/交接文档.md) | **接手必读**：架构、运行机制、已知坑、发布、待办、反思 |
| [docs/说明文档.md](docs/说明文档.md) | 是什么、跑起来、目录、剧本模型、界面规则、构建发布 |
| [docs/交付文档.md](docs/交付文档.md) | 交付清单、验收步骤、素材来源、改内容三路径 |
| [docs/问题文档.md](docs/问题文档.md) | 已知问题/优先级、各轮修复留档、反思 |
| [docs/设计说明.md](docs/设计说明.md) | 分层规则、互动节点、状态分支设计 |
| [docs/改动文档-20261119.md](docs/改动文档-20261119.md) | 本轮整体优化明细 |
| docs/archive/ | 历史过程文档 |

---

## 快速开始

```powershell
# 首次：引擎在 ../WebGAL-src，先打补丁再构建
cd ..\WebGAL-src ; python ..\meal-story\.github\patch-engine.py packages\webgal\src ; yarn webgal:build
cd ..\meal-story
python tools\sync-dist.py <版本号>   # 同步内容+主题进 dist
python tools\serve.py                # 默认 8081，可 PORT=8123
# 或双击 启动游戏.bat
```

## 改剧本（写手）

改 `content/act*.json` 后跑：

```powershell
python tools\convert-to-webgal.py
python tools\export-line-meta.py ; python tools\export-chat-meta.py
python tools\export-ui-data.py ; python tools\export-story-meta.py
python tools\sync-dist.py <新版本号>
```

**不要手改** `webgal-game/scene/*.txt`（生成物）。字段与界面规则见说明文档第 4、5 节。

## 发布前必做

1. `.github/inject_theme.py` 与 `tools/patch-dist.py` 的 `theme-inject.js?v=` 改新版本号（不改等于没发布）。
2. 确认 `git commit` 成功（本机 `.git/index.lock` 偶发占用致静默失败）。
3. 触发 `构建并发布 WebGAL 版` 工作流，等 CI 绿。
4. 本机 github.com:443 常被阻断：可用 GitHub Git Data API 推送（见交接文档），`gh`/api.github.com 可用。

## 回归与验收

```powershell
node tools\qa-v3.mjs http://127.0.0.1:8081/ --out qa-1        # 32 条
node tests\qa-v4-features.mjs http://127.0.0.1:8081/ qa-2     # 9 条
node tests\acceptance-branch.mjs                              # 隐藏支线
node tests\acceptance-endings.mjs hidden                      # 结局路线
```

> 回归只覆盖结构/文本/单击；视觉与音频竞态需人肉试玩 + `tools/dev/` 截图脚本。发布前按交接文档清单过一遍。

## 打包可玩压缩包

```powershell
python tools\sync-dist.py <版本号>     # 确保 dist 最新
# 将 ../WebGAL-src/packages/webgal/dist 内容 + 启动bat + 说明 压缩到 release/
```

`release/` 已含一份可玩压缩包与二维码、分享说明。
