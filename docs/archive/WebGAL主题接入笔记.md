# WebGAL 主题（A 纸质调查簿）接入笔记

更新：2026-11-17 晚

## 结论先说

WebGAL 4.6.7 的 UI **可以**改成 A 纸质调查簿，但要按它自己的规矩来：改 `game/template/**/*.scss`（用模板里的原始类名），不要用属性选择器，也不要只改 `userStyleSheet.css` 里的哈希类名。

## 已验证的事实

1. 模板 scss 里的类名是**组件原始名**，构建时才会哈希：
   - `.TextBox_main` / `.TextBox_main_miniavatarOff` / `.TextBox_Background`
   - `.TextBox_showName` / `.TextBox_ShowName_Background`
   - `.TextBox_textElement_Settled` / `.TextBox_textElement_start`
   - `.text` / `.readText` / `.readTextOuter`
   - `.miniAvatarContainer` / `.nameContainer` / `.outer` / `.inner` / `.zhanwei`
2. 运行时 DOM 会变成 `_TextBox_Container_p1zxt_10`、`_TextBox_main_p1zxt_18`、`_TextBox_Background_p1zxt_43` 这类哈希名，**属性选择器 `[class*="..."]` 在模板 scss 里不生效**（WebGAL 的 scss 解析器不支持），在 `userStyleSheet.css` 里则生效但容易被服务端缓存。
3. 实测把 `.TextBox_main` 改成纸卡样式（奶油渐变 + 双线内框 + 圆角）**是成功的**——截图上能看到底部出现纸卡。
4. 之前几次「改了没反应」的原因是**浏览器缓存**：WebGAL 带 Service Worker，测试脚本必须 `serviceWorkers: 'block'`，并且换端口起新 origin 最保险。
5. 正文的字号是**逐字 span + 内联样式**控制的，模板 scss 里的 `font-size` 不一定盖得住，需要在内联层面处理（或改引擎里的字号设置 `game/config.txt` 的 `Font_size`）。

## 待办（明天的顺序）

1. 在 `textbox.scss` 里一次性写全：纸卡（已验证可行）、正文（`.TextBox_textElement_Settled` 字号用 `!important`）、名牌（`.TextBox_showName` + `.TextBox_ShowName_Background` 上深绿底）
2. 立绘尺寸：`changeFigure ... -transform={"scale":{"x":0.66,"y":0.66},"position":{"x":0,"y":170}}`（已实测生效，写进转换器）
3. 选项 `Choose/choose.scss` 同步改成纸标签
4. 标题页 `UI/Title/title.scss` 换字体与字距
5. 做完再跑一次完整截图，对照预览图 A 校色

## 踩过的坑（写下来省得重复）

- 剧本第一句必须是 `say`，否则 `changeBg` / `changeFigure` 会静默卡死
- 正文里的 `:` `;` `|` 要写成 `\:` `\;` `\|`
- 源码构建会连编辑器 WebSocket，连不上就「重置数据」，要在 `initializeScript.ts` 里注释 `startPreviewSyncRuntime()`
- 官方 web 包不要改 `index.html` 之外的构建产物，会与 Service Worker 缓存打架
