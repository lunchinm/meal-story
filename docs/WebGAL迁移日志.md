# WebGAL 迁移日志（方案 A）

开始时间：2026-11-17 14:30

## 已完成

1. 下载官方运行时 `WebGAL-4.6.7-web.zip`（50.4MB），解压到 `合理膳食/webgal/`
2. 结构与约定确认：`index.html`（引擎）+ `game/`（项目）；`game/` 下分 `background / figure / bgm / vocal / scene / template / animation`
3. 资产搬迁完成：
   - `background/` 19 张（背景 + 过场 + 结局 + 宣传图 + 群聊图片）
   - `figure/` 23 张（六个角色 × 3 表情 + 备用）
   - `bgm/` 5 段
   - `vocal/` 604 句配音
4. `game/config.txt` 写入本作信息（游戏名、标题图、标题 BGM、开启鉴赏与流程图）
5. 试点脚本 `game/scene/start.txt`：第二章开场 + 三个人物 + `choose` 三分支 + `label/jumpLabel` 汇合
6. 自建 UTF-8 静态服务 `serve.py`（WebGAL 的 `.txt` 必须按 UTF-8 解码，python 默认不带 charset 会乱码）

## 已验证

- 引擎正常启动（v4.6.7，PixiJS 6.5.10，WebGL 2）
- 控制台日志确认读取的是**我们的** `game/scene/start.txt`：
  `解析场景：start.txt，数据为：{sentenceList: Array(2)...}`（最小脚本测试）
- 资产路径正确：`/game/background/*.webp`、`/game/vocal/*.mp3` 均 200

## 当前阻塞

官方 **web 包内置了 demo 的标题/语言选择流程**，它会盖在场景之上：场景已在跑（DOM 里有我们的台词），但截图始终是 `LANGUAGE SELECT` 那层。
按官方文档，正式工程应当由 **WebGAL Terre 编辑器**创建（或从源码 `yarn build`），demo 包只适合官方演示。

## 下一步（明天/今天继续）

1. 取 Terre 的 `WebGAL_Template`（空工程模板）替换现在的 demo `game/`，或直接 clone 源码 `yarn build` 得到干净引擎
2. 写转换器：`content/act*.json` → WebGAL 脚本
   - `say` → `角色:台词;`，旁白 → `:台词;`
   - `choice` → `choose:选项:label|选项:label;`
   - `record/branch` → `setVar` + `jumpLabel`（用变量替代 flag）
   - `chat` 频道 → 单独场景文件（WebGAL 无原生聊天 UI，需要自定义界面插件）
3. 五个自制关卡（配餐 / 圈选 / 瓶身对比 / 物件探索 / 调查簿）用 `create-webgal-ui` 自定义界面插件重做——这是最大的不确定项
4. 配音绑定：`game/config.txt` 的 character 表 + `vocal/` 命名规则

## 交付形式的变化（需要确认）

WebGAL 是 SPA + 资源目录，**不再是单文件 index.html**：
- 在线：继续用 GitHub Pages（需把 `webgal/` 整个目录发布）
- 离线：打包 zip + 一个 `启动.bat`（起本地静态服务），或者用 Terre 导出的可执行版
