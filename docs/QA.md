# 测试说明

## 一、三套测试各管一段

| 命令 | 覆盖 | 用时 |
| --- | --- | --- |
| `npm run test:e2e` | **Playwright**，22 条用例：标题页、推进、存档、自动播放、快进、回想、设置持久化、右键隐藏、快捷键、群聊图片、物件探索、调查簿、配餐关、三结局、隐藏结局链 | 约 45 秒 |
| `npm run test:static` | 内容静态自检：节点可达性、断链、配音缺失、道具与知识卡引用 | 约 2 秒 |
| `npm run test:play` | 机器人整局试玩：从标题一路点到结局，检查卡死与控制台报错 | 约 3 分钟 |

Playwright 失败时会留 `test-results/` 下的截图、录屏与 trace，用
`npx playwright show-trace test-results/<用例>/trace.zip` 回放。

## 二、旧的 e2e.mjs 为什么留着

`tools/e2e.mjs` 是零依赖的 CDP 脚本，不需要 `npx playwright install`。
在没有 Node 依赖的机器（比如只拷了 `dist/index.html` 的评审电脑）上仍能跑，
作为 Playwright 的兜底。

## 三、这轮新增功能的用例

| 功能 | 用例 |
| --- | --- |
| 自动播放 | `reading.spec.ts` 自动播放会自己往下走 / 连续推进多句 / 遇选项停下 |
| 快进已读 | `reading.spec.ts` 快进只跳已读、遇到没读过的停下；`auto-long.spec.ts` 一段一次跳完 |
| 回想（Backlog） | `reading.spec.ts` 回想面板能列出刚看过的对白 |
| 音量分离 | `reading.spec.ts` 设置面板能调音量并记住（重载后仍生效） |
| 右键隐藏界面 | `reading.spec.ts` 右键隐藏与恢复 |
| 快捷键 | `reading.spec.ts` A / L / Esc |
| 群聊图片气泡 | `story.spec.ts` 图片直接贴出、点图放大、不再有文字按钮 |

## 四、跑之前注意

- `npm run preview` 会被 Playwright 自动拉起，但 `test:play` 需要先手动起一个（`npm run preview -- --port 4174`）
- 单文件构建产物在 `dist/index.html`，测试跑的是 `vite preview` 的那份，改完记得 `npm run build`
