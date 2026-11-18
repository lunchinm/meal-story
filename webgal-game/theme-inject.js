// A 纸质调查簿 · 自绘 UI 叠层（排版对齐预览图 A）
// WebGAL 原生文本框设为透明（保留点击推进），在它上面画我们的纸卡。
// 文案来源：WebGAL 每字三层 span，_outer_ 是正文，_outerName_ 是名字。
(function () {
  if (window.__paperUiLoaded) return;
  window.__paperUiLoaded = true;

  var CSS = `
/* ---------- WebGAL 原生文本框：视觉隐藏，保留点击 ---------- */
[class*="TextBox_Container"] {
  opacity: 0 !important;
  pointer-events: auto !important;
}

/* ---------- WebGAL 快捷条：藏起来，改由自绘图标触发 ---------- */
[class*="_main_rdjpk"] {
  position: fixed !important;
  left: -9999px !important;
  top: -9999px !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* ---------- 自绘快捷图标（对齐 A 版右下角） ---------- */
#paper-ui .pu-tools {
  position: absolute;
  z-index: 6;
  right: 66px;
  bottom: 46px;
  display: flex;
  gap: 4px;
  pointer-events: auto;
}

#paper-ui .pu-tools button {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #5b6b4f;
  opacity: .55;
  cursor: pointer;
  transition: opacity .15s ease, transform .15s ease;
}

#paper-ui .pu-tools button:hover {
  opacity: 1;
  transform: translateY(-1px);
}

#paper-ui .pu-tools svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

[class*="_singleButton_rdjpk"] {
  flex: 0 0 26px !important;
  width: 26px !important;
  min-width: 26px !important;
  height: 26px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  color: #4f6047 !important;
  font-size: 18px !important;
  line-height: 1 !important;
}

[class*="_button_text_rdjpk"] {
  display: none !important;
}

/* ---------- 选项：居中纸标签，压在纸卡上方 ---------- */
[class*="_chooseContainer"] {
  z-index: 900 !important;
  position: fixed !important;
  filter: none !important;
}

[class*="_Choose_item_outer"] {
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  box-sizing: border-box !important;
  padding: 28px 48px !important;
  background: rgba(252, 248, 236, .97) !important;
  border: 2px solid rgba(120, 104, 74, .42) !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 22px rgba(84, 70, 44, .22) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  font-family: 'Songti SC', 'SimSun', serif !important;
  font-size: 78px !important;
  color: #33402f !important;
  cursor: pointer !important;
  transition: transform .12s ease, border-color .12s ease !important;
}

[class*="_Choose_item_outer"]:hover {
  transform: translateY(-1px) !important;
  border-color: #2f4a34 !important;
}

[class*="_Choose_item_outer"] span,
[class*="_Choose_item_outer"] div {
  color: #33402f !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
  font-family: 'Songti SC', 'SimSun', serif !important;
  font-size: 36px !important;
}
/* 选项内部的次级容器一律透明，只留外层纸卡 */
[class*="_Choose_item_outer"] > * {
  background: transparent !important;
  background-image: none !important;
  border: none !important;
  box-shadow: none !important;
  width: 100% !important;
  height: auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  margin: 0 !important;
}

[class*="_Choose_item_outer"] > * > * {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
/* ---------- 标题页：自绘书名 + 菜单 ---------- */
#paper-title {
  position: fixed;
  inset: 0;
  z-index: 58;
  pointer-events: none;
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif;
  display: none;
}

#paper-title .pt-wash {
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, rgba(247, 242, 228, .92) 0%, rgba(247, 242, 228, .72) 38%, rgba(247, 242, 228, .16) 68%, rgba(247, 242, 228, 0) 100%);
}

#paper-title .pt-lockup { position: absolute; left: 92px; top: 128px; }
#paper-title .pt-name { font-size: 52px; letter-spacing: .06em; color: #2f3a2e; line-height: 1.15; }
#paper-title .pt-sub { margin-top: 14px; font-size: 19px; letter-spacing: .34em; color: #6f7b63; }
#paper-title .pt-rule { margin: 22px 0 6px; width: 168px; height: 1px; background: linear-gradient(90deg, #2f4a34, rgba(47, 74, 52, 0)); }

#paper-title .pt-menu {
  position: absolute;
  left: 92px;
  bottom: 96px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  pointer-events: auto;
}

#paper-title .pt-menu button {
  background: none;
  border: none;
  padding: 8px 12px;
  margin-left: -12px;
  min-height: 40px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: 20px;
  letter-spacing: .16em;
  color: #33402f;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: border-color .16s ease, letter-spacing .16s ease, color .16s ease;
}

#paper-title .pt-menu button:hover {
  color: #2f4a34;
  border-bottom-color: #2f4a34;
  letter-spacing: .22em;
}
/* ---------- 背景做旧：整体轻微去饱和 + 暖化 ---------- */
#paper-wash {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background:
    radial-gradient(120% 90% at 50% 42%, rgba(255, 250, 235, 0) 46%, rgba(74, 58, 34, .20) 100%),
    rgba(247, 242, 228, .13);
}

/* ---------- 原生语言选择层（App 直属，不在 title-enter 里） ---------- */
[class*="_langWrapper"], [class*="_lang_"], [class*="_trans_1oupq"] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

/* ---------- 原生开始层（PRESS THE SCREEN / LANGUAGE SELECT）整层隐藏 ---------- */
.html-body__title-enter,
[class*="title-enter"],
[class*="languageSelect"],
[class*="LANGUAGE"] {
  display: none !important;
  pointer-events: none !important;
  visibility: hidden !important;
}


/* ---------- 流程图画板 ---------- */
#paper-flow {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(38, 30, 20, .45);
  backdrop-filter: blur(3px);
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif;
}

#paper-flow.open { display: flex; }

#paper-flow .pf-card {
  width: 720px;
  max-height: 78vh;
  overflow: auto;
  padding: 34px 40px 30px;
  background: rgba(252, 249, 240, .97);
  border: 1px solid rgba(120, 104, 74, .45);
  border-radius: 5px;
  box-shadow: 0 20px 50px rgba(20, 14, 8, .35), inset 0 0 0 5px rgba(252, 249, 240, .95), inset 0 0 0 6px rgba(120, 104, 74, .18);
}

#paper-flow h3 {
  margin: 0 0 20px;
  font-size: 22px;
  letter-spacing: .12em;
  color: #2f3a2e;
  font-weight: normal;
}

#paper-flow .pf-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(120, 104, 74, .3);
  color: #33402f;
  font-size: 17px;
}

#paper-flow .pf-row:last-child { border-bottom: none; }

#paper-flow .pf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #2f4a34; flex: 0 0 8px;
}

#paper-flow .pf-end .pf-dot { background: #a8442f; }

#paper-flow .pf-close {
  margin-top: 22px;
  padding: 8px 20px;
  background: #2f4a34;
  color: #f7f2e3;
  border: none;
  border-radius: 3px;
  font-family: inherit;
  font-size: 15px;
  letter-spacing: .1em;
  cursor: pointer;
}


/* ---------- 选项 CHOOSE-V2：结构选择器（容器子元素） ---------- */
[class*="_chooseContainer"] {
  position: fixed !important;
  left: 50% !important;
  right: auto !important;
  top: auto !important;
  bottom: 464px !important;
  transform: translateX(-50%) !important;
  width: 1120px !important;
  height: auto !important;
  max-height: 600px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 24px !important;
  background: transparent !important;
  z-index: 58 !important;
  overflow: visible !important;
}

[class*="_chooseContainer"] > div {
  width: 100% !important;
  box-sizing: border-box !important;
  padding: 56px 96px !important;
  background-image: linear-gradient(180deg, #fdfaf1, #f4ecda) !important;
  background-color: #fbf7ec !important;
  opacity: 1 !important;
  border: 4px solid #b9a986 !important;
  border-radius: 6px !important;
  box-shadow: 0 40px 80px rgba(84, 70, 44, .28) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  cursor: pointer !important;
}

[class*="_chooseContainer"] > div * {
  color: #33402f !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif !important;
  font-size: 36px !important;
  line-height: 1.5 !important;
  letter-spacing: .02em !important;
  background: none !important;
}

[class*="_chooseContainer"] > div:hover {
  border-color: #2f4a34 !important;
}


/* ---------- 自绘选项面板 ---------- */
[class*="_chooseContainer"] {
  opacity: 0 !important;   /* 视觉上用我们的纸签，但仍要能点：不要屏蔽 pointer-events */
  z-index: 60 !important;
}

#paper-ui .pu-choices {
  position: fixed;
  inset: 0;
  display: none;
  pointer-events: none;   /* 只做外观，点击穿透到引擎条目 */
  z-index: 60;
}

#paper-ui .pu-choices button {
  position: absolute;
  pointer-events: none;   /* 同上 */
  box-sizing: border-box;
  padding: 10px 22px;
  background-image: linear-gradient(180deg, #fdfaf1, #f4ecda);
  color: #33402f;
  border: 1px solid #b9a986;
  border-radius: 3px;
  box-shadow: 0 10px 22px rgba(84, 70, 44, .25);
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif;
  font-size: 18px;
  letter-spacing: .02em;
  cursor: pointer;
  transition: transform .12s ease, border-color .12s ease;
}

#paper-ui .pu-choices button:hover {
  transform: translateY(-1px);
  border-color: #2f4a34;
}


/* ---------- 群聊面板 ---------- */
#paper-chat {
  position: fixed;
  right: 56px;
  top: 44px;
  width: 470px;
  height: 540px;
  display: none;
  flex-direction: column;
  background: rgba(252, 249, 240, .96);
  border: 1px solid rgba(120, 104, 74, .45);
  border-radius: 8px;
  box-shadow: 0 18px 44px rgba(84, 70, 44, .3), inset 0 0 0 5px rgba(252, 249, 240, .95), inset 0 0 0 6px rgba(150, 130, 96, .3);
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif;
  pointer-events: auto;
  z-index: 56;
  overflow: hidden;
}

#paper-chat .pc-head {
  flex: 0 0 auto;
  padding: 12px 18px;
  font-size: 15px;
  letter-spacing: .14em;
  color: #6f7b63;
  border-bottom: 1px dashed rgba(120, 104, 74, .35);
}

#paper-chat .pc-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

#paper-chat .pc-row { display: flex; flex-direction: column; gap: 3px; align-items: flex-start; }
#paper-chat .pc-row.me { align-items: flex-end; }

#paper-chat .pc-who {
  font-size: 12px;
  letter-spacing: .08em;
  color: #8a8064;
}

#paper-chat .pc-bubble {
  max-width: 330px;
  padding: 9px 13px;
  font-size: 16px;
  line-height: 1.7;
  color: #2f3a2e;
  background-image: linear-gradient(180deg, #fdfaf1, #f4ecda);
  border: 1px solid rgba(120, 104, 74, .35);
  border-radius: 10px 10px 10px 3px;
  box-shadow: 0 6px 14px rgba(84, 70, 44, .16);
}

#paper-chat .pc-row.me .pc-bubble {
  background-image: linear-gradient(180deg, #e8efe2, #d9e5d2);
  border-radius: 10px 10px 3px 10px;
}

#paper-chat .pc-choices {
  flex: 0 0 auto;
  padding: 10px 14px 14px;
  display: none;
  flex-direction: column;
  gap: 8px;
  border-top: 1px dashed rgba(120, 104, 74, .35);
}

#paper-chat .pc-choices button {
  width: 100%;
  padding: 10px 14px;
  text-align: left;
  background-image: linear-gradient(180deg, #fdfaf1, #f4ecda);
  border: 1px solid #b9a986;
  border-radius: 6px;
  color: #33402f;
  font-family: inherit;
  font-size: 15px;
  cursor: pointer;
}

#paper-chat .pc-choices button:hover { border-color: #2f4a34; }


#paper-chat .pc-thumb {
  width: 240px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(120, 104, 74, .4);
  box-shadow: 0 8px 18px rgba(84, 70, 44, .22);
  cursor: zoom-in;
  background: #fbf7ec;
  line-height: 0;
}

#paper-chat .pc-thumb img {
  width: 100%;
  display: block;
}

/* 大图查看层 */
#paper-viewer {
  position: fixed;
  inset: 0;
  z-index: 9500;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(28, 22, 14, .78);
  backdrop-filter: blur(4px);
  cursor: zoom-out;
}

#paper-viewer.open { display: flex; }

#paper-viewer img {
  max-width: 86vw;
  max-height: 84vh;
  border-radius: 8px;
  border: 6px solid rgba(252, 249, 240, .96);
  box-shadow: 0 26px 60px rgba(0, 0, 0, .5);
}


/* ---------- 原生菜单纸质化 ---------- */
[class*="_Menu"] , [class*="Config"] , [class*="Save"] , [class*="Load"] , [class*="Backlog"] , [class*="Flowchart"] {
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif !important;
}

[class*="_Menu"] span, [class*="Config"] span, [class*="Save"] span,
[class*="Load"] span, [class*="Backlog"] span, [class*="Flowchart"] span,
[class*="_Menu"] div, [class*="Config"] div, [class*="Save"] div,
[class*="Load"] div, [class*="Backlog"] div, [class*="Flowchart"] div {
  color: #33402f !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
}

[class*="_MenuButton"], [class*="MenuItem"], [class*="Config"] button, [class*="Save"] button {
  background-image: linear-gradient(180deg, #fdfaf1, #f2e9d6) !important;
  border: 1px solid #b9a986 !important;
  border-radius: 4px !important;
  color: #2f3a2e !important;
}


/* ---------- 菜单里的纸片小工具条 ---------- */
#paper-esc {
  position: fixed;
  top: 22px;
  right: 26px;
  z-index: 9600;
  display: none;
  gap: 10px;
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif;
}

#paper-esc button {
  padding: 8px 18px;
  background-image: linear-gradient(180deg, #fdfaf1, #f2e9d6);
  border: 1px solid #b9a986;
  border-radius: 4px;
  box-shadow: 0 6px 14px rgba(84, 70, 44, .22);
  color: #2f3a2e;
  font-family: inherit;
  font-size: 15px;
  letter-spacing: .08em;
  cursor: pointer;
}

#paper-esc button:hover { border-color: #2f4a34; }


/* ---------- 菜单页米色底 ---------- */
#paper-menubg {
  position: fixed;
  inset: 0;
  z-index: 3;
  display: none;
  pointer-events: none;
  background:
    radial-gradient(120% 90% at 50% 30%, rgba(255, 252, 244, .96) 40%, rgba(240, 232, 214, .97) 100%);
}


/* ---------- 原生各菜单页：米色纸底 ---------- */
[class*="_Options_main_"], [class*="_Options_page_container_"],
[class*="_Save_main_"], [class*="_Save_page_"],
[class*="_Backlog_main_"], [class*="_Flowchart_main_"],
[class*="_MenuPanel_"], [class*="_Menu_main_"] {
  background:
    radial-gradient(120% 90% at 50% 20%, rgba(255, 252, 244, .985) 45%, rgba(243, 235, 220, .99) 100%) !important;
  box-shadow: inset 0 0 0 1px rgba(150, 130, 96, .28) !important;
}


/* ---------- 隐藏的原生标题层不许吃点击 ---------- */
[class*="title-enter"], [class*="_langWrapper"], [class*="_lang_"], [class*="_trans_1oupq"] {
  pointer-events: none !important;
}


#paper-chat .pc-send {
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  background-image: linear-gradient(180deg, #e8efe2, #d9e5d2);
  border: 1px solid #9fb597;
  border-radius: 10px;
  color: #2f3a2e;
  font-family: inherit;
  font-size: 15px;
  cursor: pointer;
}


/* ---------- 原生对话框不吃点击（否则点空白会重播语音） ---------- */
[class*="TextBox_Container"] {
  pointer-events: none !important;
}

/* ---------- 引擎底色层的黑改米色（首帧不黑屏） ---------- */
#ebg, .html-body__effect-background, .html-body__effect-background-overlay {
  background-color: #f6efe0 !important;
}

/* ---------- 纸卡不吃点击：点击穿透到画面推进 ---------- */
#paper-ui .pu-card {
  pointer-events: none;
}


/* ---------- 互动节点纸面面板 ---------- */
#paper-task {
  position: fixed;
  left: 56px;
  top: 64px;
  width: 520px;
  max-height: 62vh;
  overflow-y: auto;
  padding: 18px 22px 20px;
  background: rgba(252, 249, 240, .965);
  border: 1px solid rgba(120, 104, 74, .45);
  border-radius: 6px;
  box-shadow: 0 16px 36px rgba(84, 70, 44, .28), inset 0 0 0 4px rgba(252, 249, 240, .95), inset 0 0 0 5px rgba(150, 130, 96, .28);
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif;
  color: #33402f;
  display: none;
  z-index: 57;
}

#paper-task .pt-tag {
  display: inline-block;
  padding: 3px 10px;
  margin-bottom: 10px;
  background: #2f4a34;
  color: #f7f2e3;
  font-size: 12px;
  letter-spacing: .18em;
  border-radius: 2px;
}

#paper-task .pt-title { font-size: 20px; letter-spacing: .04em; margin-bottom: 8px; }
#paper-task .pt-prompt { font-size: 16px; line-height: 1.8; margin-bottom: 8px; }
#paper-task .pt-hint { font-size: 13px; color: #7a7156; line-height: 1.7; border-left: 2px solid rgba(150, 130, 96, .5); padding-left: 10px; margin-bottom: 12px; }
#paper-task .pt-sec { font-size: 13px; color: #6f7b63; letter-spacing: .12em; margin: 12px 0 6px; }
#paper-task ul { margin: 0; padding-left: 18px; }
#paper-task li { font-size: 15px; line-height: 1.8; }

#paper-task .pt-chips { display: flex; flex-wrap: wrap; gap: 8px; }
#paper-task .pt-chip {
  padding: 6px 12px;
  background-image: linear-gradient(180deg, #fdfaf1, #f2e9d6);
  border: 1px solid #b9a986;
  border-radius: 4px;
  font-size: 14px;
}

#paper-task .pt-poster { margin-top: 6px; border: 1px solid rgba(120, 104, 74, .4); border-radius: 4px; padding: 12px 14px; background: #fffdf7; }
#paper-task .pt-poster .pl { font-size: 16px; line-height: 1.9; color: #4a3a22; }
#paper-task .pt-poster .pl.hi { color: #a8442f; }

#paper-task .pt-body { font-size: 15px; line-height: 1.9; }
#paper-task .pt-action { margin-top: 12px; font-size: 14px; color: #2f4a34; }

/* ---------- 自绘叠层 ---------- */
#paper-ui {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 55;
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif;
}

#paper-ui .pu-card {
  pointer-events: auto;
  cursor: pointer;
  position: absolute;
  left: 56px;
  right: 56px;
  bottom: 40px;
  min-height: 150px;
  box-sizing: border-box;
  padding: 26px 30px 22px;
  background: rgba(252, 249, 240, .94);
  border: 1px solid rgba(120, 104, 74, .42);
  border-radius: 4px;
  box-shadow:
    0 12px 30px rgba(84, 70, 44, .22),
    inset 0 0 0 5px rgba(252, 249, 240, .95),
    inset 0 0 0 6px rgba(120, 104, 74, .18);
  backdrop-filter: blur(2px);
}

#paper-ui .pu-name {
  position: absolute;
  left: 80px;
  bottom: 174px;
  padding: 5px 16px;
  background: #2f4a34;
  color: #f6f2e2;
  font-size: 15px;
  letter-spacing: .1em;
  border-radius: 2px;
  box-shadow: 0 6px 14px rgba(47, 74, 52, .28);
  display: none;
  white-space: nowrap;
}

#paper-ui .pu-text {
  font-size: 21px;
  line-height: 1.95;
  letter-spacing: .02em;
  color: #33402f;
  white-space: pre-wrap;
  text-align: left;
}

#paper-ui .pu-chapter {
  position: absolute;
  left: 46px;
  top: 34px;
  font-size: 13px;
  letter-spacing: .18em;
  color: #8a8064;
  padding: 6px 14px;
  background: rgba(252, 248, 236, .8);
  border: 1px solid rgba(120, 104, 74, .35);
  border-radius: 3px;
  display: none;
}

#paper-ui .pu-tag {
  position: absolute;
  right: 26px;
  top: 30px;
  font-size: 12px;
  letter-spacing: .14em;
  color: #8a8064;
}
`;

  function addCss() {
    // 只注入一次：早先每次删除重建 <style>，会强制整页重排，推进一次要好几秒
    if (document.getElementById('paper-ui-style')) return;
    var tag = document.createElement('style');
    tag.id = 'paper-ui-style';
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }

  function buildUi() {
    if (document.getElementById('paper-ui')) return;

    var wash = document.createElement('div');
    wash.id = 'paper-wash';
    document.body.appendChild(wash);

    var root = document.createElement('div');
    root.id = 'paper-ui';

    var chapter = document.createElement('div');
    chapter.className = 'pu-chapter';

    var tag = document.createElement('div');
    tag.className = 'pu-tag';
    tag.textContent = 'PAPER DOSSIER';

    var card = document.createElement('div');
    card.className = 'pu-card';

    var name = document.createElement('div');
    name.className = 'pu-name';

    var text = document.createElement('div');
    text.className = 'pu-text';

    card.appendChild(text);
    card.addEventListener('click', function () { advanceByKey(); });

    // 右下角快捷图标：点它 = 点 WebGAL 藏起来的同名按钮
    var tools = document.createElement('div');
    tools.className = 'pu-tools';
    tools.innerHTML =
      '<button data-label="回想" title="回想"><svg viewBox="0 0 24 24"><path d="M4 5v6h6"/><path d="M4 11a8 8 0 1 1 2 8"/></svg></button>' +
      '<button data-label="自动" title="自动"><svg viewBox="0 0 24 24"><path d="M7 5l11 7-11 7z"/></svg></button>' +
      '<button data-label="快进" title="快进"><svg viewBox="0 0 24 24"><path d="M5 5l8 7-8 7z"/><path d="M14 5l8 7-8 7z"/></svg></button>' +
      '<button data-label="存档" title="存档"><svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5z"/><path d="M9 4v5h6V4"/></svg></button>' +
      '<button data-label="选项" title="设置"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg></button>' +
      '<button data-label="标题" title="回到标题"><svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10v9h12v-9"/></svg></button>' +
      '<button data-label="全屏" title="全屏"><svg viewBox="0 0 24 24"><path d="M4 9V4h5"/><path d="M15 4h5v5"/><path d="M20 15v5h-5"/><path d="M9 20H4v-5"/></svg></button>' +
      '<button data-label="流程图" title="流程图"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="4" rx="1"/><rect x="3" y="16" width="6" height="4" rx="1"/><rect x="15" y="16" width="6" height="4" rx="1"/><path d="M12 7v4M6 16v-2h12v2"/></svg></button>';

    // 首次交互时唤醒被拦下的音频
    var audioKicked = false;
    var kickedSet = new WeakSet();
    function kickAudio() {
      audioKicked = true;
      document.querySelectorAll('audio').forEach(function (a) {
        if (kickedSet.has(a)) return;
        if (a.paused && a.currentSrc) {
          kickedSet.add(a);
          var p = a.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
    }
    document.addEventListener('pointerdown', kickAudio, { once: false });
    document.addEventListener('keydown', kickAudio, { once: false });
    // 音频元素常常在点击之后才创建，交互过一次后持续兜底
    var kickTicks = 0;
    var kickTimer = setInterval(function () {
      kickTicks += 1;
      if (audioKicked) kickAudio();
      if (kickTicks > 20) clearInterval(kickTimer);
    }, 1500);

    tools.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      var want = btn.getAttribute('data-label');
      if (btn.blur) btn.blur();  // 别让按钮吃焦点，否则之后按空格会重复触发它
      if (want === '流程图') { openFlow(); return; }
      nativeAction(want);
    });

    root.appendChild(tools);

    var choices = document.createElement('div');
    choices.className = 'pu-choices';
    root.appendChild(choices);

    var chat = document.createElement('div');
    chat.id = 'paper-chat';
    chat.innerHTML = '<div class="pc-head">校园膳食调查组</div><div class="pc-body"></div><div class="pc-choices"></div>';
    document.body.appendChild(chat);
    stopOwnEvents(chat);

    if (!document.getElementById('paper-viewer')) {
      var viewer = document.createElement('div');
      viewer.id = 'paper-viewer';
      viewer.innerHTML = '<img alt="查看大图">';
      viewer.addEventListener('click', function () { viewer.classList.remove('open'); });
      document.body.appendChild(viewer);
      stopOwnEvents(viewer);
    }
    root.appendChild(chapter);
    root.appendChild(tag);
    root.appendChild(card);
    root.appendChild(name);
    stopOwnEvents(root);
    stopOwnEvents(tools);
    document.body.appendChild(root);
  }


  function removeTitleEnter() {
    var nodes = document.querySelectorAll('.html-body__title-enter, [class*="title-enter"]');
    for (var i = 0; i < nodes.length; i += 1) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }


  var FLOW_ITEMS = [
    ['第一章 · 套餐的秘密', false],
    ['第二章 · 三种晚饭', false],
    ['第三章 · 便利店的标签', false],
    ['第四章 · 你写的那一版', false],
    ['结局 · 照着吃', true],
    ['结局 · 会挑着吃', true],
    ['结局 · 把问题问回去', true],
  ];

  function openFlow() {
    var el = document.getElementById('paper-flow');
    if (!el) {
      el = document.createElement('div');
      el.id = 'paper-flow';
      var rows = FLOW_ITEMS.map(function (it) {
        return '<div class="pf-row' + (it[1] ? ' pf-end' : '') + '"><span class="pf-dot"></span>' + it[0] + '</div>';
      }).join('');
      el.innerHTML = '<div class="pf-card"><h3>流程图</h3>' + rows +
        '<button class="pf-close">返回</button></div>';
      document.body.appendChild(el);
      el.addEventListener('click', function (ev) {
        if (ev.target === el || ev.target.className === 'pf-close') el.classList.remove('open');
      });
    }
    el.classList.add('open');
  }


  // 纸卡点击 → 把点击转发到画面上方的推进热区
  function advanceByKey() {
    var x = Math.round(window.innerWidth / 2);
    var y = Math.round(window.innerHeight * 0.35);
    var target = document.elementFromPoint(x, y);
    if (!target) return;
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (type) {
      target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    });
  }


  // 例：苏苏苏桃桃桃 → 苏桃
  function collapseTriples(raw) {
    var out = '';
    for (var i = 0; i < raw.length; i += 1) {
      var ch = raw[i];
      if (ch === raw[i + 1] && ch === raw[i + 2]) {
        out += ch;
        i += 2;
      } else {
        out += ch;
      }
    }
    return out;
  }

  var NAME_SEL = '[class*="showname"], [class*="showName"], [class*="ShowName"], [class*="nameContainer"]';

  var fillClass = '';       // 填充层的类名（探测一次）
  var nameClassHint = '';

  function detectFillClass(cont) {
    var all = cont.querySelectorAll('*');
    for (var i = 0; i < all.length && i < 60; i += 1) {
      var el = all[i];
      if (el.children.length) continue;
      var t = (el.textContent || '').trim();
      if (!t || t.length > 2) continue;
      var cs = window.getComputedStyle(el);
      var isFill = cs.backgroundImage && cs.backgroundImage !== 'none';
      var isStroke = cs.webkitTextStrokeWidth && cs.webkitTextStrokeWidth !== '0px';
      if (isFill && !isStroke) {
        var cls = el.className.toString().split(/\s+/).filter(Boolean);
        if (cls.length) { fillClass = cls[0]; return true; }
      }
    }
    return false;
  }

  var fillCls = '';

  function pickFillClass(cont) {
    var all = cont.querySelectorAll('*');
    var limit = Math.min(all.length, 120);
    for (var i = 0; i < limit; i += 1) {
      var el = all[i];
      if (el.children.length) continue;
      var t = (el.textContent || '').trim();
      if (!t || t.length > 2) continue;
      var cs = window.getComputedStyle(el);
      var isFill = cs.backgroundImage && cs.backgroundImage !== 'none';
      var isStroke = cs.webkitTextStrokeWidth && cs.webkitTextStrokeWidth !== '0px';
      if (isFill && !isStroke) {
        var list = el.className.toString().split(/\s+/).filter(Boolean);
        for (var k = 0; k < list.length; k += 1) {
          if (list[k].indexOf('css-') === 0) { fillCls = list[k]; return; }
        }
      }
    }
  }

  // 把「每个字重复 k 遍」的串还原（k = 2 或 3）
  function dedupeLayers(str) {
    if (!str) return str;
    for (var k = 2; k <= 3; k += 1) {
      if (str.length % k !== 0) continue;
      var base = '';
      var ok = true;
      for (var i = 0; i < str.length; i += k) {
        var c = str[i];
        for (var j = 1; j < k; j += 1) {
          if (str[i + j] !== c) { ok = false; break; }
        }
        if (!ok) break;
        base += c;
      }
      if (ok && base) return base;
    }
    return str;
  }

  // 把「每 k 个一组、组内相同」的节点序列压成 1 层
  function flattenLayers(list) {
    if (!list.length) return '';
    for (var k = 2; k <= 4; k += 1) {
      if (list.length < k * 2) continue;
      var ok = true;
      var upto = Math.min(list.length, k * 3);
      for (var i = k; ok && i < upto; i += 1) {
        var g = Math.floor(i / k) * k;
        if (list[i] !== list[g]) ok = false;
      }
      if (ok) {
        var out = '';
        for (var j = 0; j < list.length; j += k) out += list[j];
        return halfRepeat(out);
      }
    }
    return halfRepeat(list.join(''));
  }

  function halfRepeat(str) {
    if (!str) return str;
    // 全同字符（你你 / 苏苏）→ 一个字
    var same = true;
    for (var i = 1; i < str.length; i += 1) if (str[i] !== str[0]) { same = false; break; }
    if (same) return str[0];
    if (str.length >= 4 && str.length % 2 === 0) {
      var h = str.length / 2;
      if (str.slice(0, h) === str.slice(h)) return str.slice(0, h);
    }
    return str;
  }


  // 自绘面板内的点击不要再冒泡到 document（否则引擎会当成点击画面推进剧情）
  function stopOwnEvents(node) {
    if (!node || node.dataset.paperStopped === '1') return;
    node.dataset.paperStopped = '1';
    ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click'].forEach(function (t) {
      node.addEventListener(t, function (ev) { ev.stopPropagation(); }, false);
    });
  }

  function readDialogue() {
    var cont = document.querySelector('#textBoxMain') || document.querySelector('[class*="TextBox_Container"]');
    if (!cont) return { name: '', text: '' };

    var nameChars = [];
    var bodyChars = [];
    var all = cont.querySelectorAll('*');

    for (var i = 0; i < all.length; i += 1) {
      var el = all[i];
      if (el.children.length) continue;
      var t = (el.textContent || '').trim();
      if (!t || t.length > 4) continue;
      var cls = el.className.toString();
      if (cls.indexOf('showname') >= 0) nameChars.push(t);
      else bodyChars.push(t);
    }

    return { name: flattenLayers(nameChars), text: flattenLayers(bodyChars) };
  }


  var lastChoiceKey = '';


  // 从引擎选项容器里取条目
  function readChoiceItems() {
    var cont = document.querySelector('[class*="_chooseContainer"]');
    if (!cont) return [];

    var all = [].slice.call(cont.querySelectorAll('div')).map(function (d) {
      return { el: d, t: (d.innerText || '').replace(/\s+/g, '') };
    }).filter(function (o) { return o.t.length >= 2 && o.t.length <= 40; });

    // 剔除「文本包含别的候选」的外层容器
    var leaves = all.filter(function (o) {
      return !all.some(function (p) { return p !== o && p.t.length < o.t.length && o.t.indexOf(p.t) >= 0; });
    });

    // 同文本只留一个；再按尺寸过滤（动画早期尺寸为 0 的先跳过）
    var seen = {};
    var out = [];
    leaves.forEach(function (o) {
      if (seen[o.t]) return;
      seen[o.t] = 1;
      var r = o.el.getBoundingClientRect();
      if (r.height < 20 || r.width < 80) return;
      out.push(o.el);
    });
    return out;
  }

  function syncChoices() {
    var ui = document.getElementById('paper-ui');
    if (!ui) return;
    var box = ui.querySelector('.pu-choices');
    if (!box) return;

    var items = readChoiceItems();
    if (!items.length) {
      box.style.display = 'none';
      box.innerHTML = '';
      lastChoiceKey = '';
      return;
    }

    var sig = items.map(function (it) {
      var r = it.getBoundingClientRect();
      return Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.width) + ',' + Math.round(r.height);
    }).join(';');

    if (sig !== lastChoiceKey) {
      lastChoiceKey = sig;
      box.innerHTML = '';
      items.forEach(function (it, idx) {
        var r = it.getBoundingClientRect();
        var btn = document.createElement('button');
        btn.textContent = (it.innerText || '').replace(/\s+/g, ' ').trim();
        btn.style.left = Math.round(r.left) + 'px';
        btn.style.top = Math.round(r.top) + 'px';
        btn.style.width = Math.round(r.width) + 'px';
        btn.style.height = Math.round(r.height) + 'px';
        btn.dataset.idx = String(idx);
        box.appendChild(btn);
      });
    }
    box.style.display = 'block';
  }

  var chatLines = [];
  var chatSig = '';
  var pendingReply = null;
  var chatLastTextAt = 0;
  var titleForcedUntil = 0;
  var gameStarted = false;
  var stateSeenText = false;
  var lastPushedKey = '';

  // 按剧本清单判定：channel=chat 才进聊天；旁白/章节/场景描写走文本框
  function lineMetaOf(name, text) {
    if (typeof LINE_META === 'undefined' || !LINE_META) return null;
    return LINE_META[(name || '') + '|' + (text || '')] || null;
  }

  function pushBubble(who, text) {
    var key = (who || '') + '|' + (text || '');
    if (key === lastPushedKey) return false;
    lastPushedKey = key;
    var mine = who === '你';
    chatLines.push({ who: who || '', text: text || '', me: mine });
    if (chatLines.length > 40) chatLines.shift();
    return true;
  }

  function renderChat(panel) {
    var body = panel.querySelector('.pc-body');
    if (!body) return;
    body.innerHTML = '';
    chatLines.forEach(function (ln) {
      var row = document.createElement('div');
      row.className = 'pc-row' + (ln.me ? ' me' : '');
      if (ln.who) {
        var who = document.createElement('div');
        who.className = 'pc-who';
        who.textContent = ln.me ? '我' : ln.who;
        row.appendChild(who);
      }
      var bub = document.createElement('div');
      bub.className = 'pc-bubble';
      bub.textContent = ln.text;
      row.appendChild(bub);

      var imgName = (typeof CHAT_IMAGES !== 'undefined' && CHAT_IMAGES) ? CHAT_IMAGES[ln.text] : '';
      if (imgName) {
        var thumb = document.createElement('div');
        thumb.className = 'pc-thumb';
        var im = document.createElement('img');
        im.onload = function () { body.scrollTop = body.scrollHeight; };
        im.src = 'game/background/' + imgName;
        im.alt = '聊天图片';
        thumb.appendChild(im);
        thumb.addEventListener('click', function () {
          var viewer = document.getElementById('paper-viewer');
          if (!viewer) return;
          viewer.querySelector('img').src = 'game/background/' + imgName;
          viewer.classList.add('open');
        });
        row.appendChild(thumb);
      }
      body.appendChild(row);
    });
    body.scrollTop = body.scrollHeight;
  }


  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildTaskPanel() {
    var el = document.getElementById('paper-task');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'paper-task';
    document.body.appendChild(el);
    stopOwnEvents(el);
    return el;
  }

  function renderTask(text) {
    var panel = buildTaskPanel();
    var data = (typeof UI_DATA !== 'undefined' && UI_DATA) ? UI_DATA[text] : null;
    if (!data) { panel.style.display = 'none'; return; }

    var html = '<div class="pt-tag">' + esc({ plate: '配餐', compare: '对比', explore: '翻阅', evidence: '核实', notebook: '调查簿', ending: '结局' }[data.kind] || '') + '</div>';
    if (data.title) html += '<div class="pt-title">' + esc(data.title) + '</div>';
    if (data.prompt && data.prompt !== data.title) html += '<div class="pt-prompt">' + esc(data.prompt) + '</div>';
    if (data.hint) html += '<div class="pt-hint">' + esc(data.hint) + '</div>';

    if (data.kind === 'plate') {
      html += '<div class="pt-sec">预算 ' + esc(data.budget) + ' 元 · ' + esc(data.slots) + ' 个格子</div>';
      html += '<div class="pt-chips">' + (data.cards || []).map(function (c) {
        return '<span class="pt-chip">' + esc(c) + '</span>';
      }).join('') + '</div>';
    } else if (data.kind === 'compare') {
      html += '<div class="pt-sec">货架上的两瓶</div>';
      html += (data.offers || []).map(function (o) {
        return '<div class="pt-poster" style="margin-bottom:8px"><div class="pl">' + esc(o.name) + '</div>'
          + '<div class="pl">正面：' + esc(o.front) + '</div>'
          + '<div class="pl">背面：' + esc(o.back || '') + '</div></div>';
      }).join('');
    } else if (data.kind === 'explore') {
      html += '<ul>' + (data.items || []).map(function (i) {
        return '<li>' + esc(i.label) + ' — ' + esc(i.summary) + '</li>';
      }).join('') + '</ul>';
    } else if (data.kind === 'evidence') {
      html += '<div class="pt-sec">宣传图上的字</div><div class="pt-poster">'
        + (data.posterText || []).map(function (l, i) {
          return '<div class="pl' + (i >= 1 ? ' hi' : '') + '">' + esc(l) + '</div>';
        }).join('') + '</div>';
      if (data.need) html += '<div class="pt-sec">需要圈出 ' + esc(data.need) + ' 处</div>';
    } else if (data.kind === 'notebook') {
      html += (data.entries || []).map(function (e) {
        return '<div class="pt-sec">' + esc(e.label) + '</div><div class="pt-body">' + esc(e.text) + '</div>';
      }).join('');
    } else if (data.kind === 'ending') {
      html += '<div class="pt-body">' + (data.body || []).map(esc).join('<br>') + '</div>';
      if (data.action) html += '<div class="pt-action">明天可以做的一件事：' + esc(data.action) + '</div>';
      if ((data.unlocks || []).length) html += '<div class="pt-sec">解锁</div><div class="pt-chips">'
        + data.unlocks.map(function (u) { return '<span class="pt-chip">' + esc(u) + '</span>'; }).join('') + '</div>';
    }

    panel.innerHTML = html;
    panel.style.display = 'block';
  }

  function syncChat(state) {
    var panel = document.getElementById('paper-chat');
    if (!panel) return;
    var card = document.querySelector('#paper-ui .pu-card');
    var nameEl = document.querySelector('#paper-ui .pu-name');

    var meta = lineMetaOf(state.name, state.text);
    var isChat = meta ? meta.c === 1 : false;

    if (!isChat) {
      // 离开聊天前把还没发出去的回复落地
      if (pendingReply) { chatLines.push(pendingReply); pendingReply = null; }
      panel.style.display = 'none';
      if (card) card.style.display = '';
      if (nameEl) nameEl.style.display = state.name ? 'inline-block' : 'none';
      chatLines = [];
      lastPushedKey = '';
      chatSig = '';
      return;
    }

    if (card) card.style.display = 'none';
    if (nameEl) nameEl.style.display = 'none';
    panel.style.display = 'flex';

    var replyBox = panel.querySelector('.pc-choices');

    if (state.text) {
      var key = (state.name || '') + '|' + state.text;
      var mineNow = state.name === '你';
      if (mineNow) {
        if (!pendingReply || pendingReply.text !== state.text) {
          if (pendingReply) { pushBubble(pendingReply.who, pendingReply.text); }
          pendingReply = { who: '你', text: state.text, me: true };
        }
      } else {
        if (pendingReply) { pushBubble(pendingReply.who, pendingReply.text); pendingReply = null; }
        if (pushBubble(state.name || '', state.text)) renderChat(panel);
      }
    }

    // 「我」的待发送回复：底部一条纸签
    if (pendingReply) {
      replyBox.style.display = 'flex';
      if (replyBox.dataset.reply !== pendingReply.text) {
        replyBox.dataset.reply = pendingReply.text;
        replyBox.dataset.key = '';
        replyBox.innerHTML = '';
        var sendBtn = document.createElement('button');
        sendBtn.className = 'pc-send';
        sendBtn.textContent = pendingReply.text;
        sendBtn.addEventListener('click', function () {
          if (!pendingReply) return;
          pushBubble(pendingReply.who, pendingReply.text);
          pendingReply = null;
          replyBox.dataset.reply = '';
          replyBox.innerHTML = '';
          replyBox.style.display = 'none';
          renderChat(panel);
        });
        replyBox.appendChild(sendBtn);
      }
      return;
    }

    // 真正的分支选项：交给引擎条目（纸签只做外观，点不透）
    var items = readChoiceItems();
    if (items.length) {
      replyBox.style.display = 'none';
      replyBox.dataset.key = '';
    }
  }

  function sync() {
    try {
      if (nativePanelOpen()) { hideOwnChrome(); return; }
      syncInner();
    } catch (e) { /* 单次失败不影响游戏 */ }
  }

  function syncInner() {
    buildUi();
    var ui = document.getElementById('paper-ui');
    if (!ui) return;

    // 标题页/鉴赏页没有文本框，这时把叠层收起来
    var hasBox = !!document.querySelector('[class*="TextBox_Container"]');
    ui.style.display = hasBox ? 'block' : 'none';
    var washEl = document.getElementById('paper-wash');
    if (washEl) washEl.style.display = hasBox ? 'block' : 'none';

    var state = readDialogue();
    var nameEl = ui.querySelector('.pu-name');
    var textEl = ui.querySelector('.pu-text');
    var chapEl = ui.querySelector('.pu-chapter');

    syncChoices();
    renderTask(state.text || '');
    if (state.text) { stateSeenText = true; window.__paperLine = state.text; }
    if (state.name) window.__paperName = state.name;
    if (state.text) textEl.textContent = state.text;

    if (state.name) {
      nameEl.textContent = state.name;
      nameEl.style.display = 'inline-block';
    } else {
      nameEl.style.display = 'none';
    }

    syncChat(state);

    var m = /^第([一二三四五六七八九十]+)章[《·\s]*([^》，。]*)[》]?/.exec(state.text || '');
    if (m) {
      chapEl.textContent = '第' + m[1] + '章 · ' + m[2].replace(/[《》]/g, '').trim();
      chapEl.style.display = 'block';
    }
  }



  // 主题就绪前的启动幕：挡住原生黑屏 / 设置页 / 旧素材闪现
  (function bootScreen() {
    var css = document.createElement('style');
    css.id = 'paper-boot-style';
    css.textContent = ''
      + 'html,body{background:#f6efe0 !important;}'
      + '#paper-boot{position:fixed;inset:0;z-index:99999;background:'
      + 'radial-gradient(120% 90% at 50% 30%, #fdfaf1 40%, #efe6d2 100%);'
      + 'display:flex;align-items:center;justify-content:center;'
      + "font-family:'Songti SC','SimSun','Noto Serif SC',serif;color:#2f3a2e;"
      + 'transition:opacity .35s ease;}'
      + '#paper-boot .pb-in{text-align:center;letter-spacing:.3em;}'
      + '#paper-boot .pb-t{font-size:26px;letter-spacing:.12em;}'
      + '#paper-boot .pb-s{margin-top:12px;font-size:13px;color:#8a8064;letter-spacing:.3em;}';
    (document.head || document.documentElement).appendChild(css);

    var cover = document.createElement('div');
    cover.id = 'paper-boot';
    cover.innerHTML = '<div class="pb-in"><div class="pb-t">今天吃什么？</div>'
      + '<div class="pb-s">校 园 膳 食 调 查 簿</div></div>';
    (document.body || document.documentElement).appendChild(cover);

    window.__paperBootDone = function () {
      var el = document.getElementById('paper-boot');
      if (!el || el.dataset.closing === '1') return;
      el.dataset.closing = '1';
      el.style.opacity = '0';
      setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 420);
    };
    // 兜底：最多挡 9 秒
    setTimeout(function () { if (window.__paperBootDone) window.__paperBootDone(); }, 9000);
  })();

/* LINEMETA_START */
  var LINE_META = {"周简|食堂二楼，谁来？": {"c": 1, "k": "", "s": 1}, "陆燃|十分钟。": {"c": 1, "k": "", "s": 1}, "苏桃|你上次的十分钟，是从我吃饭开始算到我洗完碗。": {"c": 1, "k": "", "s": 1}, "陆燃|这次是真的。": {"c": 1, "k": "", "s": 1}, "米粒|先看这个！": {"c": 1, "k": "", "s": 1}, "米粒|要是真能承包，我以后就不用每天在窗口前思考人生了。": {"c": 1, "k": "", "s": 1}, "苏桃|看起来挺上镜。": {"c": 1, "k": "", "s": 1}, "周简|价格被裁掉了。这张图没有考虑我的感受。": {"c": 1, "k": "", "s": 1}, "陆燃|有鸡肉有鸡蛋。可以。": {"c": 1, "k": "", "s": 1}, "许知夏|原图从哪里来的？": {"c": 1, "k": "", "s": 1}, "米粒|隔壁群。": {"c": 1, "k": "", "s": 1}, "许知夏|隔壁群的原图呢？": {"c": 1, "k": "", "s": 1}, "米粒|……": {"c": 1, "k": "", "s": 1}, "米粒|隔壁群的隔壁群。": {"c": 1, "k": "", "s": 1}, "你|我想知道，它怎么知道免疫力已经满了？": {"c": 1, "k": "k1", "s": 1}, "苏桃|可能会弹一个“恭喜升级”。": {"c": 1, "k": "", "s": 1}, "许知夏|真要这么方便，体检报告就能少好几页了。": {"c": 1, "k": "", "s": 1}, "许知夏|人体免疫功能有很多环节，没有一个简单数字能概括它。图里这个“满”，目前连怎么算都没说。": {"c": 1, "k": "", "s": 1}, "周简|先记下来，等会儿问。": {"c": 1, "k": "", "s": 1}, "你|这份菜我好像在二楼见过。": {"c": 1, "k": "", "s": 1}, "周简|对，我正站窗口前。菜牌写的是“午间搭配餐”。": {"c": 1, "k": "", "s": 1}, "米粒|名字怎么突然朴素了？": {"c": 1, "k": "", "s": 1}, "周简|可能还没来得及升级。": {"c": 1, "k": "", "s": 1}, "许知夏|去看看实物吧，顺便问问师傅。": {"c": 1, "k": "", "s": 1}, "米粒|我已经到二楼了。靠窗，绿色书包，正在努力占住三个位置。": {"c": 1, "k": "", "s": 1}, "许知夏|来了。": {"c": 1, "k": "", "s": 1}, "你|马上到。": {"c": 1, "k": "", "s": 1}, "米粒|菜基本一样，就是西兰花没有照片里站得那么整齐。": {"c": 0, "k": "", "s": 2}, "你|你已经买了？": {"c": 0, "k": "", "s": 2}, "米粒|我可以一边吃，一边保持怀疑。": {"c": 0, "k": "", "s": 2}, "许知夏|这个安排挺合理。": {"c": 0, "k": "", "s": 2}, "米粒|你看！我就说——": {"c": 0, "k": "", "s": 2}, "许知夏|我说的是先吃饭。": {"c": 0, "k": "", "s": 2}, "你|师傅，这份套餐是你们新出的？": {"c": 0, "k": "", "s": 2}, "罗师傅|这周配的。点起来快一点，窗口也能少堵一会儿。": {"c": 0, "k": "", "s": 2}, "米粒|那这个宣传也是你们的吗？": {"c": 0, "k": "", "s": 2}, "罗师傅|菜是我们的。": {"c": 0, "k": "", "s": 2}, "罗师傅|后面这几句话，我也是第一次见。": {"c": 0, "k": "", "s": 2}, "米粒|尤其是这个“七天”。": {"c": 0, "k": "", "s": 2}, "罗师傅|七天以后，这个窗口轮换菜单。新菜牌都写好了。": {"c": 0, "k": "", "s": 2}, "米粒|它的计划比你们还长。": {"c": 0, "k": "", "s": 2}, "罗师傅|图片从哪里来的，我得回去问问。你们要看菜品和份量，窗口有实物。": {"c": 0, "k": "", "s": 2}, "许知夏|谢谢师傅。我们先把能核实的记下来。": {"c": 0, "k": "", "s": 2}, "你|所以，现在确定了什么？": {"c": 0, "k": "", "s": 2}, "许知夏|这份饭确实存在。那几句效果承诺，还没有看到依据。": {"c": 0, "k": "", "s": 2}, "米粒|饭找到了，广告还在流浪。": {"c": 0, "k": "", "s": 2}, "米粒|看来我们今天省下了选菜时间，花在研究广告上了。": {"c": 0, "k": "", "s": 2}, "你|至少终于知道自己在忙什么。": {"c": 0, "k": "", "s": 2}, "你|下面只写了“网友分享”。": {"c": 1, "k": "", "s": 3}, "米粒|网友真忙，每天都在分享。": {"c": 1, "k": "", "s": 3}, "许知夏|这能告诉我们它被转发过，没告诉我们效果是怎么得出的。": {"c": 1, "k": "", "s": 3}, "你|那我去问问有没有原图。": {"c": 1, "k": "", "s": 3}, "米粒|我问转给我的同学。": {"c": 1, "k": "", "s": 3}, "米粒|这张图有原链接吗？": {"c": 1, "k": "", "s": 3}, "米粒|暂时追到这里了。": {"c": 0, "k": "", "s": 3}, "许知夏|那就记“出处待核实”。后面拿到原图，再看它具体引用了什么。": {"c": 0, "k": "", "s": 3}, "你|如果图上写着“研究证明”呢？": {"c": 0, "k": "", "s": 3}, "许知夏|还得看是哪项研究。研究了谁，吃了什么，观察了什么结果，能不能支持图上的话。": {"c": 0, "k": "", "s": 3}, "米粒|那四个字后面，还得有内容。": {"c": 0, "k": "", "s": 3}, "许知夏|嗯，有出处才方便查。": {"c": 0, "k": "", "s": 3}, "旁白|目前只有转发截图，效果承诺的来源尚未查明。": {"c": 0, "k": "", "s": 3}, "米粒|我觉得它至少长得挺有营养的。": {"c": 0, "k": "", "s": 3}, "你|确实有好几样东西。": {"c": 0, "k": "", "s": 3}, "许知夏|有主食、肉蛋和蔬菜，可以用来讨论一顿饭的搭配。": {"c": 0, "k": "", "s": 3}, "米粒|那为什么“承包全天”还要打问号？": {"c": 0, "k": "k2", "s": 3}, "许知夏|我们还不知道份量，也不知道你早饭、晚饭吃什么。这一张照片提供的信息有限。": {"c": 0, "k": "", "s": 3}, "米粒|等一下，我买的是午饭，它把早饭和晚饭的功劳也领了？": {"c": 0, "k": "", "s": 3}, "你|工作范围扩得有点快。": {"c": 0, "k": "", "s": 3}, "许知夏|看全天饮食，要把一天的记录合起来。再看更长一点的时间，食物种类和搭配是不是合适。": {"c": 0, "k": "", "s": 3}, "米粒|明白。那我先把这顿吃明白。": {"c": 0, "k": "", "s": 3}, "旁白|判断一日饮食，需要结合各餐、食物种类与数量。": {"c": 0, "k": "", "s": 3}, "你|你下午这么赶？": {"c": 0, "k": "", "s": 3}, "米粒|对，所以我才看到“承包”两个字就心动了。": {"c": 0, "k": "", "s": 3}, "许知夏|你想解决的是每天选饭太费时间。": {"c": 0, "k": "", "s": 3}, "米粒|还有排队。我上午想了三家，最后哪家队短就去哪家。": {"c": 0, "k": "", "s": 3}, "你|那以后给你建议，得把窗口、排队和上课时间一起考虑。": {"c": 0, "k": "", "s": 3}, "米粒|对！别给我列一个在三个校区分别采购的豪华菜单。": {"c": 0, "k": "", "s": 3}, "许知夏|记住了。": {"c": 0, "k": "", "s": 3}, "旁白|米粒希望吃饭省时，建议需要结合课表和购买条件。": {"c": 0, "k": "", "s": 3}, "许知夏|我刚把图放大看了，没找到能核实效果的出处。": {"c": 0, "k": "", "s": 3}, "米粒|我也问了转图的人，暂时只有截图。": {"c": 0, "k": "", "s": 3}, "许知夏|这份有主食、肉蛋和蔬菜。搭配可以讨论，但要判断一天吃得怎么样，还得看其他餐和份量。": {"c": 0, "k": "", "s": 3}, "米粒|好，先把它按一顿午饭看。": {"c": 0, "k": "", "s": 3}, "米粒|不过，你们总说合理膳食和免疫有关。": {"c": 0, "k": "", "s": 4}, "米粒|它具体帮了什么忙？": {"c": 0, "k": "", "s": 4}, "许知夏|身体维持正常免疫功能，需要从饮食中获得充足的营养。": {"c": 0, "k": "", "s": 4}, "许知夏|如果某些必需营养素长期摄入不足，免疫功能就可能受到影响。": {"c": 0, "k": "", "s": 4}, "米粒|所以要关心自己平时有没有吃够、搭配是不是合适。": {"c": 0, "k": "", "s": 4}, "许知夏|嗯。不同食物提供的营养各有特点，长期合理搭配很重要。": {"c": 0, "k": "", "s": 4}, "你|那“吃七天就拉满”，跨得确实有点远。": {"c": 0, "k": "", "s": 4}, "许知夏|对。这张图没有给出支持那个承诺的证据。": {"c": 0, "k": "", "s": 4}, "陆燃|到楼下了。": {"c": 0, "k": "", "s": 4}, "周简|你的十分钟已经二十分钟了。": {"c": 0, "k": "", "s": 4}, "陆燃|刚才帮人搬了器材。": {"c": 0, "k": "", "s": 4}, "苏桃|你们研究得怎么样？我这边有人问能不能跟着买七天。": {"c": 0, "k": "", "s": 4}, "米粒|我们得回一句。光说“正在研究”，她可能已经下单了。": {"c": 0, "k": "", "s": 4}, "你|她是想省下选饭时间，还是冲着“增强免疫”的效果？": {"c": 0, "k": "", "s": 4}, "苏桃|主要是后者。说最近大家都在感冒，想买来预防。": {"c": 0, "k": "", "s": 4}, "许知夏|那要先把预期说清楚。合理膳食有助于支持正常免疫功能，但不能保证吃这份套餐就不得病。": {"c": 0, "k": "", "s": 4}, "米粒|这个得直接告诉她。": {"c": 0, "k": "", "s": 4}, "你|再补上我们目前核实到的内容。": {"c": 0, "k": "", "s": 4}, "你|我差点想直接回：这种套餐别买。": {"c": 0, "k": "", "s": 4}, "米粒|那我的午饭怎么办？": {"c": 0, "k": "", "s": 4}, "许知夏|目前没有发现这份饭本身有什么安全问题，也不能因为广告夸张，就直接判断它不适合吃。": {"c": 0, "k": "", "s": 4}, "你|对，我把套餐和那几句宣传一起否定了。": {"c": 0, "k": "", "s": 4}, "许知夏|我们可以具体说，哪些承诺缺乏依据。买不买，再结合菜品、份量、价格和自己的需要判断。": {"c": 0, "k": "", "s": 4}, "米粒|好，我的午饭恢复名誉了。": {"c": 0, "k": "", "s": 4}, "你|我们在食堂看到实物了，是一份有米饭、肉蛋和蔬菜的午餐。": {"c": 0, "k": "", "s": 4}, "你|“承包全天营养”和“七天免疫力拉满”，目前没有找到可核实的依据。单看这张图，也没法判断一天的营养需要是否得到满足。": {"c": 0, "k": "", "s": 4}, "你|平时食物多样、搭配合理，有助于获得充足营养、支持正常免疫功能。选这份午饭可以结合份量和自己的需要考虑，其他餐也要一起安排。": {"c": 0, "k": "", "s": 4}, "你|另外，吃这份套餐不能保证预防感冒。": {"c": 0, "k": "", "s": 4}, "苏桃|收到。我转给她，也让她先别按那个效果买七天。": {"c": 1, "k": "", "s": 4}, "周简|以后评价套餐，我申请增加一个价格栏。": {"c": 1, "k": "", "s": 4}, "陆燃|以及够不够我吃。": {"c": 1, "k": "", "s": 4}, "米粒|你先出现，我们再讨论够不够。": {"c": 1, "k": "", "s": 4}, "米粒|那我有个更实际的问题。": {"c": 0, "k": "", "s": 5}, "米粒|如果没有那种一键解决的套餐，我怎么知道自己平时吃得怎么样？": {"c": 0, "k": "", "s": 5}, "许知夏|先从记录开始。今天吃了什么，大概多少，分几次吃，漏掉了什么，都可以记。": {"c": 0, "k": "", "s": 5}, "你|用手机拍照就行？": {"c": 0, "k": "", "s": 5}, "许知夏|照片加一点份量和时间说明，会更有帮助。": {"c": 0, "k": "", "s": 5}, "米粒|我有！我吃饭之前经常拍。": {"c": 0, "k": "", "s": 5}, "米粒|第四张是苏桃说光线不好，想把盘子搬走。我在抢救我的饭。": {"c": 0, "k": "", "s": 5}, "你|这组记录的艺术性比较突出。": {"c": 0, "k": "", "s": 5}, "许知夏|我们可以从明天开始拍完整一点。": {"c": 0, "k": "", "s": 5}, "苏桃|我可以负责拍摄规范。": {"c": 1, "k": "", "s": 5}, "周简|我负责记价格。": {"c": 1, "k": "", "s": 5}, "陆燃|我负责按时来吃。": {"c": 1, "k": "", "s": 5}, "米粒|这句先存档。": {"c": 1, "k": "", "s": 5}, "米粒|对，你已经看过我的课表了。明天早上比今天还赶。": {"c": 1, "k": "", "s": 5}, "你|那从早餐开始，把买饭的时间也记上。": {"c": 1, "k": "", "s": 5}, "米粒|你看，买饭、排队、赶课，经常挤在一起。": {"c": 1, "k": "", "s": 5}, "米粒|顺便帮我们两个都研究一下，少站在窗口前发呆的办法。": {"c": 1, "k": "", "s": 5}, "你|先看看陆燃训练那天都吃了什么。": {"c": 1, "k": "", "s": 5}, "陆燃|我记得挺细的。肉和蛋都有记录。": {"c": 1, "k": "", "s": 5}, "许知夏|其他食物呢？": {"c": 1, "k": "", "s": 5}, "陆燃|……": {"c": 1, "k": "", "s": 5}, "陆燃|我现在补一个表。": {"c": 1, "k": "", "s": 5}, "你|先把记得的都写上，明天再拍完整记录。": {"c": 1, "k": "", "s": 5}, "你|先帮周简看看，预算内还能怎么搭。": {"c": 1, "k": "", "s": 5}, "周简|可以。我有小票。": {"c": 1, "k": "", "s": 5}, "米粒|你连这个都有？": {"c": 1, "k": "", "s": 5}, "周简|价格记不住，怎么判断哪次真的便宜。": {"c": 1, "k": "", "s": 5}, "许知夏|那也记一下份量和实际吃了多少，方便一起看。": {"c": 1, "k": "", "s": 5}, "周简|成交。方案要能在食堂买到。": {"c": 1, "k": "", "s": 5}, "你|那就从一整天开始。把吃过的都放在一起看看。": {"c": 1, "k": "", "s": 5}, "许知夏|明天带记录来。我们一起找能调整的地方。": {"c": 1, "k": "", "s": 5}, "米粒|先说好，允许有“下午临时饿了，又买了点东西”这一栏。": {"c": 1, "k": "", "s": 5}, "你|当然，这也算当天吃的。": {"c": 1, "k": "", "s": 5}, "苏桃|等等，饮料也要拍吗？": {"c": 1, "k": "", "s": 5}, "你|要。": {"c": 1, "k": "", "s": 5}, "苏桃|那我的相册可能比想象中长。": {"c": 1, "k": "", "s": 5}, "你|今天挺早。": {"c": 0, "k": "", "s": ""}, "陆燃|我提前了十五分钟。": {"c": 0, "k": "", "s": ""}, "陆燃|你们再不来，我就要发“十分钟”了。": {"c": 0, "k": "", "s": ""}, "米粒|别发。昨天那条还没完全失去影响。": {"c": 0, "k": "", "s": ""}, "苏桃|别动，拍一张。": {"c": 0, "k": "", "s": ""}, "陆燃|拍我干什么？": {"c": 0, "k": "", "s": ""}, "苏桃|留个记录。": {"c": 0, "k": "", "s": ""}, "周简|我的记录在这里。早饭、午饭、晚饭。": {"c": 0, "k": "", "s": ""}, "米粒|我也拍了。": {"c": 0, "k": "", "s": ""}, "许知夏|时间和大概吃了多少，有补上吗？": {"c": 0, "k": "", "s": ""}, "米粒|有。午饭吃完了，面汤没喝完。早上的咖啡也喝完了。": {"c": 0, "k": "", "s": ""}, "苏桃|你早饭的其他照片呢？": {"c": 0, "k": "", "s": ""}, "米粒|你已经看完了。": {"c": 0, "k": "", "s": ""}, "米粒|还有两块饼干。包装扔了，我打了字。": {"c": 0, "k": "", "s": ""}, "你|这次确实记得挺全。": {"c": 0, "k": "", "s": ""}, "许知夏|把真实情况记下来就有用了。我们可以一起找找，哪里最容易调整。": {"c": 0, "k": "", "s": ""}, "你|米粒，我们先看看你今天怎么赶的。": {"c": 0, "k": "", "s": ""}, "你|陆燃，你昨天说要补的表，补好了？": {"c": 0, "k": "", "s": ""}, "你|周简，先看看你的账本。": {"c": 0, "k": "", "s": ""}, "米粒|你们看这个时间，就知道我为什么没去食堂。": {"c": 0, "k": "", "s": ""}, "你|从起床到上课，十八分钟。": {"c": 0, "k": "", "s": ""}, "米粒|其中还有五分钟在找校园卡。": {"c": 0, "k": "", "s": ""}, "周简|你需要的可能先是一个固定放卡的地方。": {"c": 0, "k": "", "s": ""}, "米粒|这个建议已经采纳了。": {"c": 0, "k": "", "s": ""}, "你|有些东西可以前一天就放进包里。": {"c": 0, "k": "", "s": ""}, "米粒|我愿意把早上的工作交给昨晚的我。": {"c": 0, "k": "", "s": ""}, "你|可以先准备按包装要求能常温保存的独立包装面包、未开封常温奶。早上吃饭时再打开。": {"c": 0, "k": "", "s": ""}, "许知夏|水果也可以提前挑好，吃之前处理干净。需要冷藏的食物就按包装要求保存。": {"c": 0, "k": "", "s": ""}, "米粒|我寝室没有冰箱。": {"c": 0, "k": "", "s": ""}, "你|那我们就挑符合你保存条件的。": {"c": 0, "k": "", "s": ""}, "你|如果多留十分钟，能去食堂吗？": {"c": 0, "k": "", "s": ""}, "米粒|有时候可以。星期三早八不太行，路更远。": {"c": 0, "k": "", "s": ""}, "你|那普通早八走食堂，星期三留一个便利店方案。": {"c": 0, "k": "", "s": ""}, "米粒|这个我能试。直接让我每天早起半小时，我可能会先把闹钟按掉。": {"c": 0, "k": "", "s": ""}, "许知夏|先定一个能坚持的调整，也给赶时间的日子留后手。": {"c": 0, "k": "", "s": ""}, "米粒|那咖啡还算在早餐里吗？": {"c": 0, "k": "", "s": ""}, "许知夏|可以记作饮品。不过你这杯是不加糖的美式，提供的能量和其他营养很有限。": {"c": 0, "k": "", "s": ""}, "米粒|所以我早上真正吃进去的，主要就是那两块饼干。": {"c": 0, "k": "", "s": ""}, "许知夏|对。主食、奶蛋豆类等食物，可以让早餐的搭配更充实一些。": {"c": 0, "k": "", "s": ""}, "你|我们先把明早会买的摆出来看看。": {"c": 0, "k": "", "s": ""}, "米粒|牛奶和面包我今晚放好，水果明早带。": {"c": 0, "k": "", "s": ""}, "米粒|我明天直接去买，少站在货架前犹豫一轮。": {"c": 0, "k": "", "s": ""}, "米粒|这个食堂最容易买到。": {"c": 0, "k": "", "s": ""}, "许知夏|也能搭配。馒头提供主食，鸡蛋和豆浆可以提供蛋白质。": {"c": 0, "k": "", "s": ""}, "米粒|那我喝豆浆，是不是就不用管奶了？": {"c": 0, "k": "", "s": ""}, "许知夏|普通豆浆和奶的营养构成不一样。比如钙，普通豆浆通常比牛奶少，不能直接按同样一杯来算。": {"c": 0, "k": "", "s": ""}, "你|早餐喜欢豆浆可以保留。其他时间再看看奶或奶制品怎么安排。": {"c": 0, "k": "", "s": ""}, "米粒|那我下午可以买一杯酸奶。我本来就喜欢。": {"c": 0, "k": "", "s": ""}, "米粒|这一套我最熟悉。": {"c": 0, "k": "", "s": ""}, "许知夏|可以先看看三明治实际有些什么，面包、鸡蛋和蔬菜分别有多少，够不够你吃。": {"c": 0, "k": "", "s": ""}, "米粒|我常买那款有蛋，蔬菜就一片生菜。": {"c": 0, "k": "", "s": ""}, "你|那这片生菜先如实记上。午饭、晚饭还得安排蔬菜。": {"c": 0, "k": "", "s": ""}, "许知夏|今天没出现的水果和奶类，也可以放进明天的安排里。": {"c": 0, "k": "", "s": ""}, "米粒|行。我买完会拆开拍一张，让大家看见那片生菜到底多努力。": {"c": 0, "k": "", "s": ""}, "米粒|这样看起来，我明早知道要去哪里，也知道买什么了。": {"c": 0, "k": "", "s": ""}, "你|先试一天。吃完后记一下，是否够吃、会不会赶时间。": {"c": 0, "k": "", "s": ""}, "米粒|如果上午又饿了呢？": {"c": 0, "k": "", "s": ""}, "许知夏|可以看看早餐的份量是不是合适，也可以安排适量加餐。把实际情况记下来再调整。": {"c": 0, "k": "", "s": ""}, "你|别为了让记录好看，把加餐偷偷删了。": {"c": 0, "k": "", "s": ""}, "米粒|放心，我现在连两块饼干都有户口。": {"c": 0, "k": "", "s": ""}, "苏桃|这张构图很稳定。": {"c": 0, "k": "", "s": ""}, "陆燃|我特意把盘子拍全了。": {"c": 0, "k": "", "s": ""}, "你|米饭呢？": {"c": 0, "k": "", "s": ""}, "陆燃|晚饭没点。今天训练，我又加了一份鸡肉。": {"c": 0, "k": "", "s": ""}, "陆燃|蛋白质这一栏，我记得很认真。": {"c": 0, "k": "", "s": ""}, "许知夏|看出来了。其他栏也有东西值得聊。": {"c": 0, "k": "", "s": ""}, "米粒|鸡肉的出勤率很高。": {"c": 0, "k": "", "s": ""}, "陆燃|这个窗口省事。": {"c": 0, "k": "", "s": ""}, "许知夏|你今天有奶、蛋、肉，也有主食。蔬菜在照片里比较少，水果还没出现。": {"c": 0, "k": "", "s": ""}, "陆燃|这么放在一起，我才发现自己一直在拍同几样东西。": {"c": 0, "k": "", "s": ""}, "你|明天可以换一些，先从最明显的地方调整。": {"c": 0, "k": "", "s": ""}, "你|你今天训练以后，还吃了别的东西吗？": {"c": 0, "k": "", "s": ""}, "陆燃|没有。晚饭就是这两份鸡肉，喝了白水。": {"c": 0, "k": "", "s": ""}, "你|那这份记录就比较清楚了。": {"c": 0, "k": "", "s": ""}, "许知夏|不过只凭一天的照片，还不能算清你所有营养是否够。可以先看出哪些食物较少，再连续记录几天。": {"c": 0, "k": "", "s": ""}, "陆燃|好，今天先把漏掉的栏目补齐。": {"c": 0, "k": "", "s": ""}, "陆燃|那明天训练日，晚饭怎么点比较顺手？": {"c": 0, "k": "", "s": ""}, "罗师傅|明天有鸡肉、豆腐、青菜，还有米饭和蒸红薯。你们正好看。": {"c": 0, "k": "", "s": ""}, "陆燃|豆腐也能算进蛋白质来源？": {"c": 0, "k": "", "s": ""}, "许知夏|能。豆腐、豆干这类大豆制品可以提供优质蛋白质。肉、鱼、蛋、奶也各有特点，可以轮换着安排。": {"c": 0, "k": "", "s": ""}, "你|明天午饭如果已经吃了肉，晚饭就多了一个选择。": {"c": 0, "k": "", "s": ""}, "陆燃|那我去试试豆腐。不过我得先看看一份多大。": {"c": 0, "k": "", "s": ""}, "罗师傅|可以，别隔着照片猜。": {"c": 0, "k": "", "s": ""}, "陆燃|红薯我喜欢。那米饭还点吗？": {"c": 0, "k": "", "s": ""}, "许知夏|红薯属于薯类，也能提供主食。可以用它替换一部分米饭，具体看份量和你的需要。": {"c": 0, "k": "", "s": ""}, "米粒|原来你把米饭拿走以后，主食也可以换个形状回来。": {"c": 0, "k": "", "s": ""}, "陆燃|这个形状我接受。": {"c": 0, "k": "", "s": ""}, "陆燃|青菜我会点。不过大份看着挺多的。": {"c": 0, "k": "", "s": ""}, "苏桃|你今天这几片，也确实很节省画面。": {"c": 0, "k": "", "s": ""}, "许知夏|可以把蔬菜分到几餐，选你愿意吃的种类。比如青菜、番茄、胡萝卜，轮换着来。": {"c": 0, "k": "", "s": ""}, "你|明天午饭和晚饭各安排一份，先看看实际有多少。": {"c": 0, "k": "", "s": ""}, "陆燃|大概要吃多少？": {"c": 0, "k": "", "s": ""}, "许知夏|一般成人的参考建议是，每天新鲜蔬菜不少于300克，深色蔬菜约占一半。水果每天200到350克。": {"c": 0, "k": "", "s": ""}, "陆燃|这个克数，是端上来的菜连油一起称？": {"c": 0, "k": "", "s": ""}, "许知夏|这里看的是食材可食部分的生重。炒熟以后，重量和体积会变，食堂照片也很难精确算出来。": {"c": 0, "k": "", "s": ""}, "罗师傅|你们想知道一份大概用了多少菜，可以来问。我分菜时给你们看一眼。": {"c": 0, "k": "", "s": ""}, "米粒|实物教学，我支持。": {"c": 0, "k": "", "s": ""}, "陆燃|水果我可以训练后路过水果摊时买。": {"c": 0, "k": "", "s": ""}, "许知夏|可以安排。蔬菜和水果都要照顾到，种类也换着吃。": {"c": 0, "k": "", "s": ""}, "你|不用把所有缺的东西挤到今晚，明天开始好好安排就行。": {"c": 0, "k": "", "s": ""}, "陆燃|那我把记录改一下。": {"c": 0, "k": "", "s": ""}, "米粒|鸡肉终于有同事了。": {"c": 0, "k": "", "s": ""}, "陆燃|你别说，表一下就显得很满。": {"c": 0, "k": "", "s": ""}, "米粒|你这份记录自带审计。": {"c": 0, "k": "", "s": ""}, "周简|消费记录都在手机里，顺手而已。": {"c": 0, "k": "", "s": ""}, "周简|我想先改午饭。明天午饭预算十二元。": {"c": 0, "k": "", "s": ""}, "你|有特别想保留的吗？": {"c": 0, "k": "", "s": ""}, "周简|得吃得下，买得到，吃完能去上课。": {"c": 0, "k": "", "s": ""}, "米粒|要求很朴素。": {"c": 0, "k": "", "s": ""}, "周简|再加一条，不能最后说“其实再加十块就好了”。": {"c": 0, "k": "", "s": ""}, "苏桃|我昨天看到一个套餐，名字叫“五色能量碗”。": {"c": 0, "k": "", "s": ""}, "周简|名字我记住了，预算没跟上。": {"c": 0, "k": "", "s": ""}, "罗师傅|明天青菜和土豆丝可以打小份，肉菜暂时不拆。别把所有菜都按半价算。": {"c": 0, "k": "", "s": ""}, "你|那我们用实际能买到的选项来搭。": {"c": 0, "k": "", "s": ""}, "周简|很好，这个计划开始落地了。": {"c": 0, "k": "", "s": ""}, "你|先看看你现在这份，最值得改哪里。": {"c": 0, "k": "", "s": ""}, "周简|我当时想的是，有饭、有菜、有蛋。": {"c": 0, "k": "", "s": ""}, "许知夏|土豆的确经常在菜品窗口出现。不过按膳食搭配看，它属于薯类，淀粉比较多，可以用来替换部分主食。": {"c": 0, "k": "", "s": ""}, "周简|所以这份土豆丝，不能直接算我已经吃到一份绿叶菜了。": {"c": 0, "k": "", "s": ""}, "许知夏|对，可以再安排其他蔬菜。": {"c": 0, "k": "", "s": ""}, "你|那就围绕这个改，不用整份推倒重来。": {"c": 0, "k": "", "s": ""}, "周简|还有一元余量。": {"c": 0, "k": "", "s": ""}, "米粒|你看起来比刚才放松了。": {"c": 0, "k": "", "s": ""}, "许知夏|主食、蔬菜和蛋白质来源都安排到了。豆腐是可以利用的普通食材。": {"c": 0, "k": "", "s": ""}, "周简|那豆腐和鸡蛋，今天就先选这两个。": {"c": 0, "k": "", "s": ""}, "许知夏|可以结合你一天其他餐调整，之后也能换成鱼、肉等不同食物。种类和份量都要看。": {"c": 0, "k": "", "s": ""}, "周简|刚好十二。": {"c": 0, "k": "", "s": ""}, "罗师傅|这几个都在同一排窗口，买起来也快。": {"c": 0, "k": "", "s": ""}, "你|这个方案保留了你熟悉的荤菜。": {"c": 0, "k": "", "s": ""}, "许知夏|也能作为一个搭配思路。跟刚才豆腐鸡蛋的方案相比，可以结合口味和其他餐次轮换。": {"c": 0, "k": "", "s": ""}, "周简|那我不用每天吃同一套。菜单有哪个就换哪个。": {"c": 0, "k": "", "s": ""}, "周简|我还是有点想留土豆丝。": {"c": 0, "k": "", "s": ""}, "米粒|这才是诚实的点餐。": {"c": 0, "k": "", "s": ""}, "许知夏|可以保留。土豆能提供淀粉，点的时候把它和米饭一起考虑，调整主食的总量，再配其他蔬菜和蛋类。": {"c": 0, "k": "", "s": ""}, "你|比如米饭少打一点，具体看土豆和米饭各有多少、够不够你吃。": {"c": 0, "k": "", "s": ""}, "周简|这样我喜欢的菜也留下了。": {"c": 0, "k": "", "s": ""}, "周简|如果今天只想吃一点，我就要半份。": {"c": 0, "k": "", "s": ""}, "罗师傅|可以，这个窗口能这么打。": {"c": 0, "k": "", "s": ""}, "周简|原来十二元里能列出好几种。": {"c": 0, "k": "", "s": ""}, "你|以后遇到售罄，就照这个思路找替换。": {"c": 0, "k": "", "s": ""}, "许知夏|到窗口也看看实际份量。这张表能帮我们选组合，不能单凭价格算出营养够不够。": {"c": 0, "k": "", "s": ""}, "周简|午饭安排好了。": {"c": 0, "k": "", "s": ""}, "许知夏|再看全天，你今天有豆浆和蛋，奶类、水果还没出现，蔬菜也比较少。": {"c": 0, "k": "", "s": ""}, "周简|水果我可以买。奶和豆浆不能直接算同一项，对吧？": {"c": 0, "k": "", "s": ""}, "米粒|这个我刚问过！普通豆浆的钙通常比奶少。": {"c": 0, "k": "", "s": ""}, "许知夏|对，不能简单按同样一杯替换。": {"c": 0, "k": "", "s": ""}, "许知夏|它们都能提供一些蛋白质，不过营养构成不同。比如普通豆浆的钙通常比牛奶少。": {"c": 0, "k": "", "s": ""}, "周简|那我得把这些也算进全天预算，不能只把午饭配得好看。": {"c": 0, "k": "", "s": ""}, "你|可以先看看便宜、常买得到的水果，再安排合适的奶或奶制品。": {"c": 0, "k": "", "s": ""}, "周简|行，我去看一下价格。": {"c": 0, "k": "", "s": ""}, "米粒|你会不会顺便做出一张全校水果价格地图？": {"c": 0, "k": "", "s": ""}, "周简|样本不够，暂时不能发布。": {"c": 0, "k": "", "s": ""}, "许知夏|你们发现没有，单看一顿饭，有些问题不太明显。把时间、其他餐和份量放进来，就更容易找调整的地方。": {"c": 0, "k": "", "s": ""}, "你|而且大家最需要解决的事还不一样。": {"c": 0, "k": "", "s": ""}, "米粒|我最先要解决的是，早上到底去哪里买、买什么。": {"c": 0, "k": "", "s": ""}, "米粒|明天少纠结一次，就有希望吃得从容一点。": {"c": 0, "k": "", "s": ""}, "陆燃|我之前一直盯着肉和蛋。把照片放一起，才看见蔬菜水果没怎么出现。": {"c": 0, "k": "", "s": ""}, "苏桃|你下次拍照，记得给它们也留位置。": {"c": 0, "k": "", "s": ""}, "陆燃|先让它们真的出现在盘子里。": {"c": 0, "k": "", "s": ""}, "周简|我先用窗口现有的菜调整，留几套能互换的组合。": {"c": 0, "k": "", "s": ""}, "米粒|售价十二元以内，选择不止一种。": {"c": 0, "k": "", "s": ""}, "周简|还有全天预算。这个我会接着记。": {"c": 0, "k": "", "s": ""}, "米粒|那我们这样调整，对昨天说的免疫，到底有什么帮助？": {"c": 0, "k": "", "s": ""}, "许知夏|身体维持正常免疫功能，需要充足的能量和多种营养素。主食、肉蛋奶豆、蔬菜水果，各有能提供的东西。": {"c": 0, "k": "", "s": ""}, "许知夏|今天做的这些调整，是让平时的饮食更完整。长期营养不足可能影响正常免疫功能，所以值得把日常吃饭安排好。": {"c": 0, "k": "", "s": ""}, "陆燃|也不能明天多吃一份菜，就说自己免疫力涨了多少。": {"c": 0, "k": "", "s": ""}, "许知夏|对。我们可以看的是，计划有没有执行、吃得是否合适、这些习惯能不能持续。": {"c": 0, "k": "", "s": ""}, "周简|这个能记录。": {"c": 0, "k": "", "s": ""}, "米粒|那今天先别给我发奖状，等我明天真的吃上早餐。": {"c": 0, "k": "", "s": ""}, "米粒|你在给它找角度？": {"c": 0, "k": "", "s": 6}, "苏桃|找字。这个位置刚好反光。": {"c": 0, "k": "", "s": 6}, "苏桃|我一直把它记在奶那一栏。": {"c": 0, "k": "", "s": 6}, "你|先看看它具体是什么。": {"c": 0, "k": "", "s": 6}, "苏桃|正面有一头奶牛，还有一大杯白色的东西。": {"c": 0, "k": "", "s": 6}, "许知夏|看一下产品名称、配料表，再和奶的营养成分比较一下，会更清楚。": {"c": 0, "k": "k3", "s": 6}, "苏桃|等我拍下来。": {"c": 0, "k": "", "s": 6}, "米粒|第一次见你拍瓶子背面。": {"c": 0, "k": "", "s": 6}, "苏桃|今天正面已经出过镜了，给背面一个机会。": {"c": 0, "k": "", "s": 6}, "你|你是因为喜欢它的味道才买的？": {"c": 0, "k": "", "s": 6}, "苏桃|嗯，桃子味，我挺喜欢。": {"c": 0, "k": "", "s": 6}, "你|那把它按实际类别记成饮料。奶类再另外安排。": {"c": 0, "k": "", "s": 6}, "许知夏|对，先弄清它是什么，再考虑喝多少、放在哪一餐。": {"c": 0, "k": "", "s": 6}, "苏桃|我之前是喝了一瓶饮料，顺便给自己的奶类记录盖了章。": {"c": 0, "k": "", "s": 6}, "你|先找一盒普通牛奶，对着看看。": {"c": 0, "k": "", "s": 6}, "周简|目前桌上没有这个证据。": {"c": 0, "k": "", "s": 6}, "苏桃|明天去便利店，我知道在哪排。": {"c": 0, "k": "", "s": 6}, "许知夏|可以。比较时先把“每100毫升”这一栏对齐。": {"c": 0, "k": "", "s": 6}, "米粒|别拿一瓶和一口比。": {"c": 0, "k": "", "s": 6}, "苏桃|那明天去一趟。顺便给科普小组买点开会吃的东西。": {"c": 0, "k": "", "s": 6}, "你|群里说是下午碰面，三点半。": {"c": 0, "k": "", "s": 6}, "周简|我列预算。": {"c": 0, "k": "", "s": 6}, "米粒|我负责带杯子。": {"c": 0, "k": "", "s": 6}, "陆燃|我提前到。": {"c": 0, "k": "", "s": 6}, "陆燃|这次我不说几分钟了。": {"c": 0, "k": "", "s": 6}, "你|今天早餐安排得怎么样？": {"c": 0, "k": "", "s": 7}, "米粒|吃上了。这次照片里有完整的食物。": {"c": 0, "k": "", "s": 7}, "米粒|我直接去便利店拿昨天选好的，没站在货架前想半天。": {"c": 0, "k": "", "s": 7}, "米粒|昨晚把能按包装要求常温保存的东西准备好了，早上拿起来就走。": {"c": 0, "k": "", "s": 7}, "米粒|今天食堂排队不长。星期三赶课那天，我就用备用方案。": {"c": 0, "k": "", "s": 7}, "你|来得及吃吗？份量感觉怎么样？": {"c": 0, "k": "", "s": 7}, "米粒|来得及。先这样试几天，有不合适的再改。": {"c": 0, "k": "", "s": 7}, "许知夏|好，记下实际情况就行。": {"c": 0, "k": "", "s": 7}, "米粒|酸奶我下午再看看，已经记在便签上了。": {"c": 0, "k": "", "s": 7}, "你|今天准备怎么点餐？": {"c": 0, "k": "", "s": 7}, "陆燃|午饭正好用上昨天的方案，晚饭再按今天实际情况调整。": {"c": 0, "k": "", "s": 7}, "陆燃|鸡肉、米饭、青菜都点了。份量到窗口看着打。": {"c": 0, "k": "", "s": 7}, "陆燃|今天豆腐有，我点了米饭、豆腐和青菜。": {"c": 0, "k": "", "s": 7}, "陆燃|有蒸红薯。我买了一个，米饭相应少打一点，也点了鸡肉和蔬菜。": {"c": 0, "k": "", "s": 7}, "苏桃|镜头终于拍到了盘子边缘。": {"c": 0, "k": "", "s": 7}, "陆燃|我专门站远了半步。": {"c": 0, "k": "", "s": 7}, "许知夏|这张记录清楚多了，吃完也记一下实际吃了多少。": {"c": 0, "k": "", "s": 7}, "陆燃|好。现在先吃，拍摄工作结束。": {"c": 0, "k": "", "s": 7}, "你|新组合买到了吗？": {"c": 0, "k": "", "s": 7}, "周简|买到了，价格和菜单一致。": {"c": 0, "k": "", "s": 7}, "你|份量呢？": {"c": 0, "k": "", "s": 7}, "周简|我拍了，吃完再记够不够。省下的钱也不会自动变成奶茶预算。": {"c": 0, "k": "", "s": 7}, "米粒|你为什么看起来像在提前回答我？": {"c": 0, "k": "", "s": 7}, "周简|因为我了解这个群。": {"c": 0, "k": "", "s": 7}, "苏桃|今天给它们拍合照。": {"c": 0, "k": "", "s": 8}, "你|背面朝前。": {"c": 0, "k": "", "s": 8}, "苏桃|知道了，摄影要求已经变了。": {"c": 0, "k": "", "s": 8}, "你|一个写灭菌乳，一个写含乳饮料。": {"c": 0, "k": "", "s": 8}, "苏桃|正面都有奶牛，背面分得倒很清楚。": {"c": 0, "k": "", "s": 8}, "许知夏|产品名称和类型能帮助我们确认买的是什么。包装图案只能提供一部分印象。": {"c": 0, "k": "", "s": 8}, "苏桃|我以后先找这一行。": {"c": 0, "k": "", "s": 8}, "你|这盒纯牛奶的配料是生牛乳。饮料这边先写了水。": {"c": 0, "k": "", "s": 8}, "苏桃|排在前面的，一般是放得更多的？": {"c": 0, "k": "", "s": 8}, "许知夏|通常按生产时加入量从多到少排列。不过少量配料有排列例外，不能光靠位置算出准确百分比。": {"c": 0, "k": "", "s": 8}, "周简|所以可以看主要用了什么，不能自己给它编比例。": {"c": 0, "k": "", "s": 8}, "许知夏|对。": {"c": 0, "k": "", "s": 8}, "你|两份都写每100毫升，可以直接对比这一行。": {"c": 0, "k": "", "s": 8}, "苏桃|3.2克和1.0克。": {"c": 0, "k": "", "s": 8}, "许知夏|这里买的两瓶都是250毫升。喝完整瓶，就分别约是8克和2.5克蛋白质。": {"c": 0, "k": "", "s": 8}, "苏桃|这次差别看得挺明白。": {"c": 0, "k": "", "s": 8}, "许知夏|但判断一种食品，还要结合其他营养成分和你购买的目的。": {"c": 0, "k": "", "s": 8}, "苏桃|牛奶配料只有生牛乳，为什么还有4.7克碳水化合物？": {"c": 0, "k": "", "s": 8}, "许知夏|奶本身含有乳糖。配料没有加白砂糖，也可以有天然存在的糖。": {"c": 0, "k": "", "s": 8}, "你|那看到这一栏，不能直接说它加了这么多糖。": {"c": 0, "k": "", "s": 8}, "许知夏|对。碳水化合物还包括淀粉等成分，不能把整行数字都当成添加糖。": {"c": 0, "k": "", "s": 8}, "苏桃|记住了。我之前差点拿这一栏给所有食品算“放了几勺糖”。": {"c": 0, "k": "", "s": 8}, "许知夏|如果你是想安排每天的奶类，就选合适的奶或奶制品。含乳饮料要按它的实际类别考虑。": {"c": 0, "k": "", "s": 8}, "苏桃|那我昨天那瓶，还是记饮料。奶类另外安排。": {"c": 0, "k": "", "s": 8}, "苏桃|我昨天想补奶类，今天就先看奶类货架。": {"c": 0, "k": "", "s": 8}, "苏桃|哪天想喝桃子味，可以再考虑这款，份量也照实记。": {"c": 0, "k": "", "s": 8}, "你|这次买东西，你主要想安排奶类，还是买喜欢的饮料？": {"c": 0, "k": "", "s": 8}, "苏桃|今天先把奶类安排好。": {"c": 0, "k": "", "s": 8}, "米粒|我来买下午开会的饮料。陆燃在外面等。": {"c": 0, "k": "", "s": 9}, "周简|为什么？": {"c": 0, "k": "", "s": 9}, "米粒|他说人齐再进去，可以减少他临时买东西的机会。": {"c": 0, "k": "", "s": 9}, "苏桃|这个办法我需要学一下。": {"c": 0, "k": "", "s": 9}, "周简|这两个都标了糖含量。大瓶每100毫升4克，小瓶6克。": {"c": 0, "k": "", "s": 9}, "米粒|大瓶的数字小一点。": {"c": 0, "k": "", "s": 9}, "你|再看看一瓶多大。": {"c": 0, "k": "", "s": 9}, "米粒|原来喝完大瓶，反而会更多。": {"c": 0, "k": "", "s": 9}, "许知夏|因为喝进去的总量也变了。": {"c": 0, "k": "", "s": 9}, "周简|两个瓶子刚才站在一起，我光看数字了。": {"c": 0, "k": "", "s": 9}, "你|如果我每次只喝250毫升呢？": {"c": 0, "k": "", "s": 9}, "苏桃|这次又是A少了。": {"c": 0, "k": "", "s": 9}, "许知夏|同样喝250毫升，A的糖含量较少。喝完整瓶，就要按各自容量计算。": {"c": 0, "k": "", "s": 9}, "米粒|所以比较的时候，得先说清楚自己准备喝多少。": {"c": 0, "k": "", "s": 9}, "你|先问大家需要多少，别直接按大瓶买。": {"c": 0, "k": "", "s": 9}, "米粒|我主要是开会时口渴。我带了杯子，可以接水。": {"c": 0, "k": "", "s": 9}, "苏桃|我只是想尝一口这个口味。": {"c": 0, "k": "", "s": 9}, "周简|那不用先默认每个人喝完一大瓶。": {"c": 0, "k": "", "s": 9}, "许知夏|对。喝多少会影响实际摄入量。": {"c": 0, "k": "", "s": 9}, "许知夏|看每100毫升，方便比较浓度；看实际喝多少，才能知道这次喝进去多少。": {"c": 0, "k": "", "s": 9}, "苏桃|这回我知道净含量为什么也要一起看了。": {"c": 0, "k": "", "s": 9}, "米粒|那我先去接水。下午真想喝这个味道，再按想喝的量考虑。": {"c": 0, "k": "", "s": 9}, "周简|预算跟着需要走，挺好。": {"c": 0, "k": "", "s": 9}, "苏桃|这个能不能放进下午的零食清单？": {"c": 0, "k": "", "s": 10}, "你|翻过来看看。": {"c": 0, "k": "", "s": 10}, "苏桃|麦芽糖浆还在。": {"c": 0, "k": "", "s": 10}, "苏桃|没有糖那一行。碳水化合物倒是写了。": {"c": 0, "k": "", "s": 10}, "许知夏|不能直接拿碳水化合物当糖的含量。这里面还有淀粉等成分。": {"c": 0, "k": "", "s": 10}, "你|没有单列，也不能按零来记。": {"c": 0, "k": "", "s": 10}, "许知夏|对，这张表没有提供单独的糖含量。": {"c": 0, "k": "", "s": 10}, "你|你想用它解决什么？饿了，还是想吃点甜的？": {"c": 0, "k": "", "s": 10}, "苏桃|下午开会可能饿，也想吃点有味道的。我以为“无蔗糖”就能放心一直拿。": {"c": 0, "k": "", "s": 10}, "许知夏|先按你准备吃的量看。它仍然有能量，配料里的麦芽糖浆也会带来糖。": {"c": 0, "k": "", "s": 10}, "周简|那先别因为三个字，把购物数量改成三袋。": {"c": 0, "k": "", "s": 10}, "苏桃|你观察得很及时。": {"c": 0, "k": "", "s": 10}, "许知夏|糖只是碳水化合物的一部分。标签有单列糖时，可以直接查看对应含量；没有单列时，不能把碳水化合物全算成糖，也不能认为没有糖。": {"c": 0, "k": "", "s": 10}, "苏桃|那配料表能帮我发现加了什么，但未必告诉我加了几克。": {"c": 0, "k": "", "s": 10}, "许知夏|对，两张表要结合着看。": {"c": 0, "k": "", "s": 10}, "米粒|牛奶里还有原本就存在的乳糖。所以糖那一行，也不能直接当成“额外加了多少”。": {"c": 0, "k": "", "s": 10}, "许知夏|记得很清楚。": {"c": 0, "k": "", "s": 10}, "你|今天这袋饼干，你还想吃吗？": {"c": 0, "k": "", "s": 10}, "苏桃|想吃。买一小份，下午饿的时候吃一些，晚饭照常安排。": {"c": 0, "k": "", "s": 10}, "你|好，把食品类别和本次份量照实记下来。": {"c": 0, "k": "", "s": 10}, "苏桃|今天先买水果和奶吧。这个标签我拍下来，下午给大家看看。": {"c": 0, "k": "", "s": 10}, "你|拍上净含量，别又只留下最醒目的那行字。": {"c": 0, "k": "", "s": 10}, "苏桃|放心，今天我已经升级成全景摄影了。": {"c": 0, "k": "", "s": 10}, "周简|先确认一下，哪些是个人买的，哪些是下午一起吃的。": {"c": 0, "k": "", "s": 11}, "米粒|我主要带水杯，别算我一瓶饮料。": {"c": 0, "k": "", "s": 11}, "苏桃|我自己的奶和水果，我自己付。": {"c": 0, "k": "", "s": 11}, "你|小组的采购还差什么信息？": {"c": 0, "k": "", "s": 11}, "你|下午准备带一点吃的。大家有没有明确不能吃的食物，或者需要避开的配料？": {"c": 1, "k": "", "s": 11}, "陆燃|我没有已知食物过敏，少买一点就行，我晚饭正常吃。": {"c": 1, "k": "", "s": 11}, "周简|我也没有。会议室没冰箱，保存条件记得看。": {"c": 1, "k": "", "s": 11}, "米粒|我更想要能分开拿的，吃多少自己取。": {"c": 1, "k": "", "s": 11}, "许知夏|那就结合这些选。需要冷藏的产品按包装要求保存，准备什么时候吃也一起考虑。": {"c": 1, "k": "", "s": 11}, "米粒|你昨天问我的课表，今天问采购条件，已经很熟练了。": {"c": 1, "k": "", "s": 11}, "你|先各自说说准备吃多少，再决定买多大包装。": {"c": 1, "k": "", "s": 11}, "周简|好，先别用“总会有人吃”当人数。": {"c": 1, "k": "", "s": 11}, "米粒|我带一个水果就够了。": {"c": 1, "k": "", "s": 11}, "苏桃|我也不用一大袋饼干。": {"c": 1, "k": "", "s": 11}, "许知夏|再确认一下有没有食物过敏或其他明确的饮食限制。需要冷藏的东西，也看看有没有合适的保存条件。": {"c": 1, "k": "", "s": 11}, "你|我来把现有清单发到群里，大家补充。": {"c": 1, "k": "", "s": 11}, "周简|补上数量。": {"c": 1, "k": "", "s": 11}, "米粒|我可以自己带水果，别重复买。": {"c": 1, "k": "", "s": 11}, "陆燃|会议室没有冰箱，买的时候看看贮存条件。": {"c": 1, "k": "", "s": 11}, "许知夏|也请大家确认一下过敏或其他饮食限制。": {"c": 1, "k": "", "s": 11}, "你|好，按回复改清单。": {"c": 1, "k": "", "s": 11}, "周简|现在买的东西，都知道给谁、什么时候吃了。": {"c": 1, "k": "", "s": 11}, "苏桃|我还多拍了一整组背面照片。": {"c": 1, "k": "", "s": 11}, "米粒|你的相册终于开始提供有效信息。": {"c": 1, "k": "", "s": 11}, "苏桃|昨天那组也有，鸡肉拍得很清楚。": {"c": 1, "k": "", "s": 11}, "陆燃|我提前来了，这次大家都看见了。": {"c": 0, "k": "", "s": 12}, "周简|看见了，已经不需要再举证。": {"c": 0, "k": "", "s": 12}, "苏桃|今天至少弄明白了一件事。以后给饮食记录分类，我先看清楚产品。": {"c": 0, "k": "", "s": 12}, "米粒|我学会看一瓶多大了。以前默认那张表写的就是整瓶。": {"c": 0, "k": "", "s": 12}, "你|还有“没有单列”的信息，不能自己补成零。": {"c": 0, "k": "", "s": 12}, "许知夏|嗯。不过这些标签，主要帮助我们了解食品和作比较。一顿饭、一天怎么搭配，还得放回前面聊过的实际情况里。": {"c": 0, "k": "", "s": 12}, "陆燃|所以我不能买一袋蛋白质数字很高的东西，就宣布今天吃得很好。": {"c": 0, "k": "", "s": 12}, "许知夏|还要看其他食物、实际份量，以及你一天的饮食。": {"c": 0, "k": "", "s": 12}, "米粒|那跟免疫有关的营养，也得从整体饮食去安排。": {"c": 0, "k": "", "s": 12}, "许知夏|对。充足、多样的营养有助于支持正常免疫功能，某一项数字或一句包装宣传不能保证健康效果。": {"c": 0, "k": "k1", "s": 12}, "罗师傅|窗口菜单我整理好了。明天有几样会换，你们写建议时可以用。": {"c": 1, "k": "", "s": 12}, "周简|很好，菜单有变化。": {"c": 1, "k": "", "s": 12}, "米粒|你为什么听起来有点高兴？": {"c": 1, "k": "", "s": 12}, "周简|看看我们的方案能不能换着用。": {"c": 1, "k": "", "s": 12}, "苏桃|还有，昨天帮你追截图来源的同学回复了。": {"c": 1, "k": "", "s": 12}, "你|那来源就继续标“待核实”。我们整理指南时把自己的依据列清楚。": {"c": 1, "k": "", "s": 12}, "许知夏|第一天那张宣传图，出处还是没有核实。我们这次整理自己的指南，把依据和适用情况写清楚。": {"c": 1, "k": "", "s": 12}, "苏桃|封面我来拍。这次正面背面都拍。": {"c": 1, "k": "", "s": 12}, "陆燃|餐盘我也可以提供。": {"c": 1, "k": "", "s": 12}, "周简|价格和替换方案交给我。": {"c": 1, "k": "", "s": 12}, "米粒|赶课版一定要有。": {"c": 1, "k": "", "s": 12}, "你|那下一步，我们把这些信息做成真正能照着用的方案。": {"c": 1, "k": "", "s": 12}, "米粒|这个是不是比较划算？": {"c": 0, "k": "", "s": 12}, "周简|得先知道我们本来要买几件。": {"c": 0, "k": "", "s": 12}, "你|买一瓶6元，两瓶9元。单瓶平均价便宜了，但今天付的钱会多3元。": {"c": 0, "k": "", "s": 12}, "米粒|如果我本来只想买一瓶，就不是少花钱了。": {"c": 0, "k": "", "s": 12}, "周简|对。如果本来就要买两瓶，可以再比较。先看需要。": {"c": 0, "k": "", "s": 12}, "你|有人本来就准备买同款吗？": {"c": 0, "k": "", "s": 12}, "苏桃|我今天已经选了别的。": {"c": 0, "k": "", "s": 12}, "米粒|那我也按原来需要的买。": {"c": 0, "k": "", "s": 12}, "周简|这样数量就清楚了。": {"c": 0, "k": "", "s": 12}, "米粒|这张也能放调查簿，提醒一下未来的我。": {"c": 0, "k": "", "s": 12}, "陆燃|这个写钠120毫克，旁边是6%。": {"c": 0, "k": "", "s": 12}, "你|先看表头。": {"c": 0, "k": "", "s": 12}, "陆燃|我刚才差点把一份当成一袋。": {"c": 0, "k": "", "s": 12}, "米粒|这个错误我在饮料那里刚犯过，我们可以组成学习小组。": {"c": 0, "k": "", "s": 12}, "你|你准备一次吃多少？": {"c": 0, "k": "", "s": 12}, "陆燃|可能拿一些，没想过一定吃完。": {"c": 0, "k": "", "s": 12}, "许知夏|那按实际份量看。吃30克是这里的一份，整袋吃完就是三份。": {"c": 0, "k": "", "s": 12}, "陆燃|我知道了，标签分份不代表我拿在手里就是一份。": {"c": 0, "k": "", "s": 12}, "陆燃|那6%是说，这袋里面6%都是钠？": {"c": 0, "k": "", "s": 12}, "许知夏|不是这个意思。它表示标示份量中的钠，相当于标签规定的营养素参考值的6%。": {"c": 0, "k": "", "s": 12}, "你|这是用于理解和比较的参考比例，不是每个人的精确个人额度。": {"c": 0, "k": "", "s": 12}, "许知夏|对。这里按每份算，吃几份还要换算。": {"c": 0, "k": "", "s": 12}, "苏桃|这回我们知道先要什么了。上次追截图追了好几层。": {"c": 1, "k": "", "s": 12}, "你|你是打算用它补充某种营养，还是想靠它预防生病？": {"c": 1, "k": "", "s": 12}, "许知夏|维生素C参与正常免疫功能，但不能因此认定这瓶饮料能预防感冒。还要看具体证据，日常饮食也要整体安排。": {"c": 1, "k": "", "s": 12}, "你|你可以先发完整标签，我们帮你看懂写了什么。": {"c": 1, "k": "", "s": 12}, "苏桃|我昨天也差不多。下次拍照把背面带上。": {"c": 1, "k": "", "s": 12}, "苏桃|这个写常温保存，另一款写冷藏。": {"c": 1, "k": "", "s": 12}, "许知夏|按各自包装要求保存，开封后的要求也要看。": {"c": 1, "k": "", "s": 12}, "周简|会议室没有冰箱，这个信息影响我们买什么、什么时候买。": {"c": 1, "k": "", "s": 12}, "米粒|我已经装好水了。": {"c": 1, "k": "", "s": 12}, "你|所以今天的饮料预算可以按实际需要改。": {"c": 1, "k": "", "s": 12}, "米粒|对，我不需要拿着一瓶饮料来证明自己参与了采购。": {"c": 1, "k": "", "s": 12}, "苏桃|我的相册越来越像调查材料了。": {"c": 1, "k": "", "s": 12}, "你|构图还是挺好的。": {"c": 1, "k": "", "s": 12}, "苏桃|这句我也存一下。": {"c": 1, "k": "", "s": 12}, "你|还要拍标签吗？": {"c": 0, "k": "", "s": 13}, "苏桃|拍我们为什么买这些。": {"c": 0, "k": "", "s": 13}, "苏桃|过几天我再翻相册，才知道当时为什么这样选。": {"c": 0, "k": "", "s": 13}, "你|这张也留给第四章。": {"c": 0, "k": "", "s": 13}, "苏桃|好，跟包装照片放一起。": {"c": 0, "k": "", "s": 13}, "许知夏|“无蔗糖”只说明没加蔗糖，不等于没有糖，也不等于可以随便吃。": {"c": 0, "k": "k3", "s": ""}, "米粒|这张促销牌写着“指定饮料，第二件半价”。": {"c": 0, "k": "", "s": ""}, "周简|得先知道我们本来要买几件。多买一件放着，也是钱。": {"c": 0, "k": "", "s": ""}, "苏桃|这袋是家庭装，拆开可以分三份。": {"c": 0, "k": "", "s": ""}, "许知夏|分装以后要看每份的量，别把一袋当成一次的量。": {"c": 0, "k": "", "s": ""}, "苏桃|这张只拍到半个瓶身，背面完全没拍到。": {"c": 0, "k": "", "s": ""}, "你|那就再拍一张完整的，正面背面都要。": {"c": 0, "k": "", "s": ""}, "苏桃|结账以后她没急着走，拿起手机拍了一张购物清单。": {"c": 0, "k": "", "s": ""}, "苏桃|拍我们为什么买这些：开会三点半，会议室没有冰箱，各自按需要取。": {"c": 0, "k": "", "s": ""}, "你|过几天翻相册，才知道当时为什么这样选。这张留给第四章。": {"c": 0, "k": "", "s": ""}, "米粒|我的早八已经成为公共资料了？": {"c": 0, "k": "", "s": 14}, "你|这里只保留吃饭时间和购买地点，其他课程信息可以遮掉。": {"c": 0, "k": "", "s": 14}, "米粒|那还行。尤其别把我找校园卡那五分钟印进去。": {"c": 0, "k": "", "s": 14}, "陆燃|我今天提前到了。": {"c": 0, "k": "", "s": 14}, "周简|我们已经开始接受这个事实了。": {"c": 0, "k": "", "s": 14}, "许知夏|指南的依据也带来了。我们今天把内容整理好，再看看哪些地方需要实际试一下。": {"c": 0, "k": "", "s": 14}, "苏桃|封面名字我先留空。等内容定下来再排。": {"c": 0, "k": "", "s": 14}, "米粒|这个顺序让我想起第一天那张图。": {"c": 0, "k": "", "s": 14}, "你|我们已经知道，标题能跑得多快了。": {"c": 0, "k": "", "s": 14}, "许知夏|这张图的原始出处仍然没核实。效果承诺也没有找到可核实的依据。": {"c": 0, "k": "", "s": 14}, "你|那就按调查结果写，留在“遇到宣传怎么核实”的例子里。": {"c": 0, "k": "", "s": 14}, "苏桃|我会遮掉无关群聊信息，保留需要讨论的文字。": {"c": 0, "k": "", "s": 14}, "苏桃|这张也带来了。": {"c": 0, "k": "", "s": 14}, "米粒|看上去最普通的一张。": {"c": 0, "k": "", "s": 14}, "周简|但里面的信息影响了我们买什么。": {"c": 0, "k": "", "s": 14}, "你|先把三件实际能做的事写清楚。": {"c": 0, "k": "", "s": 14}, "米粒|这句话没问题。但如果明早我又只有十八分钟呢？": {"c": 0, "k": "", "s": 15}, "你|把在哪里买、什么时候准备写进去。": {"c": 0, "k": "", "s": 15}, "米粒|我这次是直接去便利店拿选好的东西，确实快。": {"c": 0, "k": "", "s": 15}, "你|那就写清楚最近的购买点。再留一个排队太长时的备用方案。": {"c": 0, "k": "", "s": 15}, "米粒|能提前准备的东西，前一晚放好。": {"c": 0, "k": "", "s": 15}, "米粒|我前一天准备好了，早上省事。": {"c": 0, "k": "", "s": 15}, "许知夏|那保存条件也留一句。能常温保存的按包装要求放，需要冷藏的另外处理。": {"c": 0, "k": "", "s": 15}, "米粒|这个要写。我寝室没冰箱，不能看见别人准备什么就原样抄。": {"c": 0, "k": "", "s": 15}, "米粒|普通早八我能去食堂，最远那间教室的早八就用备用方案。": {"c": 0, "k": "", "s": 15}, "你|那这张卡可以分成两种情况。": {"c": 0, "k": "", "s": 15}, "米粒|对，别把所有早八当成同一个早八。": {"c": 0, "k": "", "s": 15}, "米粒|我上课路线旁边有便利店，食堂稍微绕一点，寝室没有冰箱。": {"c": 0, "k": "", "s": 15}, "你|那可以先选好顺路能买的组合，再准备一个符合保存条件的备用方案。": {"c": 0, "k": "", "s": 15}, "米粒|这个我能试。": {"c": 0, "k": "", "s": 15}, "许知夏|再加一句，数量和食物可以按自己的需要调整。": {"c": 0, "k": "", "s": 15}, "米粒|还要给自己留出真正吃饭的时间。拿在手上不算已经吃了。": {"c": 0, "k": "", "s": 15}, "你|这句很有必要。": {"c": 0, "k": "", "s": 15}, "你|先写一套明天最容易执行的，再附上替换。": {"c": 0, "k": "", "s": 15}, "许知夏|我们也把午饭、晚饭和加餐留在一天的安排里。早餐有了计划，全天仍要一起看。": {"c": 0, "k": "", "s": 15}, "米粒|这张看着有希望执行。": {"c": 0, "k": "", "s": 15}, "罗师傅|补充一下，明天鸡肉那道暂停一天，有鱼和豆腐。青菜照常供应。": {"c": 0, "k": "", "s": 16}, "周简|刚好。旧方案不能原样用了。": {"c": 0, "k": "", "s": 16}, "陆燃|昨天我才把鸡肉安排明白。": {"c": 0, "k": "", "s": 16}, "米粒|你的菜单开始出现剧情分支了。": {"c": 0, "k": "", "s": 16}, "周简|午饭预算还是十二元。": {"c": 0, "k": "", "s": 16}, "你|先看看现有东西怎么组合。": {"c": 0, "k": "", "s": 16}, "周简|这个也一样是十一元。": {"c": 0, "k": "", "s": 16}, "陆燃|可以换成鱼，窗口倒是帮我安排轮换了。": {"c": 0, "k": "", "s": 16}, "许知夏|鱼、肉、蛋、奶、大豆制品都可以成为饮食中的营养来源，具体组合要结合其他餐和供应。": {"c": 0, "k": "", "s": 16}, "你|这张卡上也写明，换菜以后看实际份量。": {"c": 0, "k": "", "s": 16}, "你|把两套都放进去，现场看供应。": {"c": 0, "k": "", "s": 16}, "周简|那今天就有两种十一元方案。": {"c": 0, "k": "", "s": 16}, "许知夏|可以。让使用的人知道，某一道菜售罄后，还能按搭配思路寻找替换。": {"c": 0, "k": "", "s": 16}, "米粒|这个对我很有用。我经常排到前面才发现想吃的卖完了。": {"c": 0, "k": "", "s": 16}, "周简|价格我写“示例价格，以窗口当天为准”。": {"c": 0, "k": "", "s": 16}, "你|再加一个提醒，午饭安排好了，也要看看全天有没有遗漏的食物。": {"c": 0, "k": "", "s": 16}, "许知夏|对，奶类、水果等也要放在全天安排中考虑。": {"c": 0, "k": "", "s": 16}, "周简|我还想把喜欢土豆丝那种情况留在旁边。": {"c": 0, "k": "", "s": 16}, "许知夏|可以。保留薯类时，把它和其他主食的总量一起考虑，也照顾到其他蔬菜。": {"c": 0, "k": "", "s": 16}, "米粒|土豆丝成功留在了你的长期规划里。": {"c": 0, "k": "", "s": 16}, "周简|喜欢的食物值得认真安排。": {"c": 0, "k": "", "s": 16}, "苏桃|上午又拍到两盒。想把它们放进指南里，让大家试着看。": {"c": 0, "k": "", "s": 17}, "米粒|B的每100毫升比较多。": {"c": 0, "k": "k3", "s": 17}, "你|但两盒大小不一样。": {"c": 0, "k": "", "s": 17}, "苏桃|对，这次我们已经会先看表头了。": {"c": 0, "k": "", "s": 17}, "陆燃|喝完整盒，A这盒反而多一点。": {"c": 0, "k": "", "s": 17}, "许知夏|这里说的是蛋白质这一项。选产品还要结合其他营养信息、食用量和实际需要。": {"c": 0, "k": "", "s": 17}, "周简|价格、能不能按要求保存，也值得看。": {"c": 0, "k": "", "s": 17}, "你|先问使用的人，准备一次喝多少。": {"c": 0, "k": "", "s": 17}, "米粒|如果都喝200毫升，B提供的蛋白质多一些。喝完整盒，就得重新算。": {"c": 0, "k": "", "s": 17}, "苏桃|你已经能替我讲了。": {"c": 0, "k": "", "s": 17}, "许知夏|对，这就是为什么比较之前要把单位和实际食用量说清楚。": {"c": 0, "k": "", "s": 17}, "你|指南里可以保留这个例子，但不直接给整种食品贴“最好”的标签。": {"c": 0, "k": "", "s": 17}, "苏桃|那我配三个动作。": {"c": 0, "k": "", "s": 17}, "许知夏|再保留来源入口，方便想继续看的人查。": {"c": 0, "k": "", "s": 17}, "苏桃|这里还放得下一张小卡。写什么？": {"c": 0, "k": "", "s": 18}, "周简|可以写怎么用。": {"c": 0, "k": "", "s": 18}, "你|我们要不要先选一个人，看看这份指南对他具体怎么用？": {"c": 0, "k": "", "s": 18}, "你|把之前的回访对象请来，再核对一下条件。": {"c": 0, "k": "", "s": 18}, "你|明天的课表和购买路线，还是之前那样吗？": {"c": 0, "k": "", "s": 18}, "米粒|早上还是要赶课。便利店顺路，食堂稍微绕一点。寝室也还是没有冰箱。": {"c": 0, "k": "", "s": 18}, "你|早餐想保留什么？有没有不方便吃的？": {"c": 0, "k": "", "s": 18}, "米粒|就按我们之前选的组合。我想要拿得到、来得及坐下吃的，别安排需要我早上现做的。": {"c": 0, "k": "", "s": 18}, "你|明天还是训练日吗？": {"c": 0, "k": "", "s": 18}, "陆燃|下午有训练。午饭能正常去食堂，晚饭时间也来得及。": {"c": 0, "k": "", "s": 18}, "你|目前的食量安排，有什么想调整的？": {"c": 0, "k": "", "s": 18}, "陆燃|我想看窗口实际份量。别人觉得够的一小份，我可能还需要加一点。": {"c": 0, "k": "", "s": 18}, "许知夏|那就把“按自己的需要和活动情况调整”写进你的版本，实际情况继续记录。": {"c": 0, "k": "", "s": 18}, "你|明天午饭预算还是十二元？": {"c": 0, "k": "", "s": 18}, "周简|对。十二元是午饭预算，不是全天伙食费。": {"c": 0, "k": "", "s": 18}, "你|两套替换方案，有哪套不喜欢？": {"c": 0, "k": "", "s": 18}, "周简|都可以。主要是看实际价钱和供应，最好一排窗口能买齐。": {"c": 0, "k": "", "s": 18}, "许知夏|主题说明也一起确认一下。": {"c": 0, "k": "", "s": 18}, "米粒|这样跟第一天那张图就接上了。": {"c": 0, "k": "", "s": 18}, "陆燃|我们写的是具体怎么安排，也把适用情况写出来了。": {"c": 0, "k": "", "s": 18}, "你|最后加上资料来源和更新日期。": {"c": 0, "k": "", "s": 18}, "苏桃|好，排版完成以后我再检查一次，别把来源挤得看不见。": {"c": 0, "k": "", "s": 18}, "你|内容已经核对完了。接下来怎么用？": {"c": 0, "k": "", "s": 19}, "你|选一个人明天用一下，再看哪里需要调整。": {"c": 0, "k": "", "s": 19}, "米粒|我可以。": {"c": 0, "k": "", "s": 19}, "陆燃|我也行。": {"c": 0, "k": "", "s": 19}, "周简|我愿意提供小票。": {"c": 0, "k": "", "s": 19}, "苏桃|怎么大家突然都很熟练。": {"c": 0, "k": "", "s": 19}, "许知夏|记录一下实际吃了什么、买起来方不方便、份量是否合适就可以。": {"c": 0, "k": "", "s": 19}, "你|明天回来讨论。": {"c": 0, "k": "", "s": 19}, "米粒|今天早餐吃上了，不过临时遇到一点情况。": {"c": 1, "k": "", "s": 20}, "你|怎么了？": {"c": 1, "k": "", "s": 20}, "米粒|老师让我们提前到教室确认小组汇报顺序，我原来留给吃饭的时间被挤掉了一部分。": {"c": 1, "k": "", "s": 20}, "米粒|我先吃了一部分，课间再把剩下的吃完。实际时间都记了。": {"c": 1, "k": "", "s": 20}, "你|那我们看看怎么给这种日子留余地。": {"c": 1, "k": "", "s": 20}, "许知夏|再根据实际吃的量、饥饿感和后面餐次调整，别为了照着表走，就把没吃完的记录删掉。": {"c": 1, "k": "", "s": 20}, "米粒|记录保留。我今天最大的发现是，买到早餐以后，还得给它留时间。": {"c": 1, "k": "", "s": 20}, "你|那我把赶课路线、可用时段和保存条件一起补进来。": {"c": 1, "k": "", "s": 20}, "米粒|好，寝室没有冰箱这点也记上。": {"c": 1, "k": "", "s": 20}, "你|先把这条经验写进通用指南。除了在哪里买，还要留出实际吃饭的时间。": {"c": 1, "k": "", "s": 20}, "米粒|对，拿在手上那段不算已经吃了。": {"c": 1, "k": "", "s": 20}, "许知夏|也可以提醒读者，课表变化后重新安排，结合实际食量调整。": {"c": 1, "k": "", "s": 20}, "米粒|这句我会记住。": {"c": 1, "k": "", "s": 20}, "陆燃|今天按组合点了，照片发你。": {"c": 1, "k": "", "s": 20}, "陆燃|这张拍完，我又加了一点米饭，实际记录也补上了。": {"c": 1, "k": "", "s": 20}, "你|你觉得原来的份量不够？": {"c": 1, "k": "", "s": 20}, "陆燃|窗口默认的份量比我平时吃的少。我开始还在想，既然照着示例买了，是不是就该吃这些。": {"c": 1, "k": "", "s": 20}, "你|训练安排、购买时间和份量需求也一起记上。": {"c": 1, "k": "", "s": 20}, "陆燃|好。": {"c": 1, "k": "", "s": 20}, "你|把“份量需要调整”在通用版里写得更明显。": {"c": 1, "k": "", "s": 20}, "陆燃|对，我一开始看那张照片，以为要照着盘子里的量买。": {"c": 1, "k": "", "s": 20}, "许知夏|那就在图下说明，照片展示的是组合示例，份量需要结合个人情况。": {"c": 1, "k": "", "s": 20}, "陆燃|这样以后看图就不会只盯着“长得一样”。": {"c": 1, "k": "", "s": 20}, "周简|买到了，发你今天的小票。": {"c": 1, "k": "", "s": 20}, "周简|时蔬今天四元，昨天的菜单上是三元。整套刚好十二元。": {"c": 1, "k": "", "s": 20}, "你|还在预算里。": {"c": 1, "k": "", "s": 20}, "周简|对。我先看了新价签才点。幸好没直接照着旧表算。": {"c": 1, "k": "", "s": 20}, "你|午饭十二元、尽量在一排窗口买齐，也补上。": {"c": 1, "k": "", "s": 20}, "周简|对，别把它写成我全天只有十二元。": {"c": 1, "k": "", "s": 20}, "你|给通用版加上菜单日期和核价提醒。": {"c": 1, "k": "", "s": 20}, "周简|好，价格别印得像永远不会变。": {"c": 1, "k": "", "s": 20}, "许知夏|保留示例的搭配思路，再提醒使用者看当日供应。": {"c": 1, "k": "", "s": 20}, "周简|这样这张小票也算完成任务了。": {"c": 1, "k": "", "s": 20}, "米粒|哪一块是蔬菜来着？": {"c": 0, "k": "", "s": 20}, "苏桃|看来这张图离开我的电脑以后，有了自己的想法。": {"c": 0, "k": "", "s": 20}, "你|找个没看过的人试着读一下，看看哪里容易误解。": {"c": 0, "k": "", "s": 20}, "苏桃|收到，补文字和轮廓。": {"c": 0, "k": "", "s": 20}, "许知夏|关键说明也留在图片附近，截图转发以后还能看见。": {"c": 0, "k": "", "s": 20}, "米粒|这个我们之前也问过。": {"c": 1, "k": "", "s": 20}, "你|烹调会改变重量和体积。食堂照片可以帮助粗略观察，但不能直接精确推算。": {"c": 1, "k": "", "s": 20}, "罗师傅|每道菜的原料和做法不一样，盛出来的体积也不同。你们要了解某道菜大概用了多少，可以到窗口问。": {"c": 1, "k": "", "s": 20}, "许知夏|指南里的参考量按食材可食部分生重理解。我们把这句紧挨着数字放。": {"c": 1, "k": "", "s": 20}, "苏桃|这句我要直接印出来，不能只藏在点开之后的说明里。": {"c": 1, "k": "", "s": 20}, "你|可以参考搭配思路，再看你们当天供应、份量和自己的需要。": {"c": 1, "k": "", "s": 20}, "米粒|感觉终于有人能直接用上了。": {"c": 1, "k": "", "s": 20}, "陆燃|我的餐盘照片也算有用了。": {"c": 1, "k": "", "s": 20}, "周简|价钱旁边有日期，满意。": {"c": 1, "k": "", "s": 20}, "苏桃|这张背面照片，今天比正面更重要。": {"c": 1, "k": "", "s": 20}, "许知夏|以后用起来遇到问题，还可以继续改。": {"c": 1, "k": "", "s": 20}, "米粒|今天吃什么？": {"c": 0, "k": "", "s": 20}, "你|先看看今天有什么。": {"c": 0, "k": "", "s": 20}, "你|原来方案写好以后，还能发现这些地方。": {"c": 0, "k": "", "s": 20}, "许知夏|实际用一次，就知道哪些说明需要更清楚。": {"c": 0, "k": "", "s": 20}, "米粒|我明天会把吃饭时间也留出来，不能只算走路和排队。": {"c": 0, "k": "", "s": 20}, "陆燃|我现在知道看组合，也会看自己实际吃了多少。": {"c": 0, "k": "", "s": 20}, "周简|以后菜单换了，我先重新核价，再找能用的组合。": {"c": 0, "k": "", "s": 20}, "罗师傅|明天窗口有新的菜，菜单发群里了。": {"c": 1, "k": "", "s": 20}, "米粒|怎么又换？": {"c": 1, "k": "", "s": 20}, "周简|食堂正常更新。": {"c": 1, "k": "", "s": 20}, "陆燃|看看这次能怎么搭。": {"c": 1, "k": "", "s": 20}, "苏桃|下一次用这套办法，照片应该又会不一样。": {"c": 1, "k": "", "s": 20}, "你|这一版，把你这次碰到的问题也写进去了。": {"c": 0, "k": "", "s": 20}, "米粒|这次连不能用的那节课间都标出来了。": {"c": 0, "k": "", "s": 20}, "你|你自己最清楚什么时候能坐下来吃。下次有变化，再一起改。": {"c": 0, "k": "", "s": 20}, "米粒|以前别人提醒我吃早餐，我也知道应该吃。真到了早上，还是得现场决定去哪买、什么时候吃。": {"c": 0, "k": "", "s": 20}, "米粒|现在我不用每天从头想一遍。": {"c": 0, "k": "", "s": 20}, "你|也不用为了配合计划，把实际发生的事从记录里删掉。": {"c": 0, "k": "", "s": 20}, "米粒|那两块饼干可以安心留下了。": {"c": 0, "k": "", "s": 20}, "陆燃|我把第二张也留下。": {"c": 0, "k": "", "s": 20}, "你|那张更接近你实际吃的情况。": {"c": 0, "k": "", "s": 20}, "陆燃|以前我总想找一个现成答案，写着训练日该吃多少，我照着来就行。": {"c": 0, "k": "", "s": 20}, "许知夏|通用建议能提供方向，具体还要结合你的实际情况。记录会让调整更有依据。": {"c": 0, "k": "", "s": 20}, "陆燃|嗯。我再记几天，看哪些安排真的适合自己。": {"c": 0, "k": "", "s": 20}, "周简|这张我留着。刚好多一元，也刚好提醒我看当天价签。": {"c": 0, "k": "", "s": 20}, "你|方案里也写了预算和替换方法，以后再变化，知道先查什么。": {"c": 0, "k": "", "s": 20}, "周简|对。而且你问清了十二元是午饭预算，没给我安排成一天三顿。": {"c": 0, "k": "", "s": 20}, "米粒|这个误会听上去会很严重。": {"c": 0, "k": "", "s": 20}, "周简|所以问清楚真的省事。": {"c": 0, "k": "", "s": 20}, "苏桃|我想给这一页拍张照片。": {"c": 0, "k": "", "s": 20}, "你|拍哪里？": {"c": 0, "k": "", "s": 20}, "苏桃|条件、原来的安排，还有修改的地方，都拍进去。": {"c": 0, "k": "", "s": 20}, "苏桃|这张写的是我们为什么那样买。": {"c": 0, "k": "", "s": 20}, "苏桃|这一张，是后来为什么又改了。": {"c": 0, "k": "", "s": 20}, "苏桃|这次要把选择的理由也留下。以后回看，才知道这些改动是怎么来的。": {"c": 0, "k": "", "s": 20}, "米粒|想起最开始，我就是想找一份什么都能替我决定的套餐。": {"c": 0, "k": "", "s": 20}, "陆燃|我先看有没有肉。": {"c": 0, "k": "", "s": 20}, "周简|我找了半天价格。": {"c": 0, "k": "", "s": 20}, "苏桃|我看它拍得好不好看。": {"c": 0, "k": "", "s": 20}, "许知夏|这些关注点都可以留下，再把需要的信息补齐。": {"c": 0, "k": "", "s": 20}, "你|知道自己想解决什么，再看看实际能怎么做。": {"c": 0, "k": "", "s": 20}, "许知夏|合理膳食提供多种营养，支持正常免疫功能。我们能做的是把这些知识落实到日常，再根据真实情况调整。": {"c": 0, "k": "k1", "s": 20}, "米粒|那今天午饭呢？": {"c": 0, "k": "", "s": 20}, "陆燃|先去窗口看看。": {"c": 0, "k": "", "s": 20}, "周简|我看一下新价签。": {"c": 0, "k": "", "s": 20}, "苏桃|等会儿拍照，我这次很快。": {"c": 0, "k": "", "s": 20}, "你|那就走吧。": {"c": 0, "k": "", "s": 20}, "旁白|通用总结写完了，个人方案这次没有改。": {"c": 0, "k": "", "s": ""}};
  /* LINEMETA_END */

/* CHAT_META_START */
  var CHAT_TEXTS = {"食堂二楼，谁来？": 1, "十分钟。": 1, "你上次的十分钟，是从我吃饭开始算到我洗完碗。": 1, "这次是真的。": 1, "先看这个！": 1, "要是真能承包，我以后就不用每天在窗口前思考人生了。": 1, "看起来挺上镜。": 1, "价格被裁掉了。这张图没有考虑我的感受。": 1, "有鸡肉有鸡蛋。可以。": 1, "原图从哪里来的？": 1, "隔壁群。": 1, "隔壁群的原图呢？": 1, "……": 1, "隔壁群的隔壁群。": 1, "我想知道，它怎么知道免疫力已经满了？": 1, "可能会弹一个“恭喜升级”。": 1, "真要这么方便，体检报告就能少好几页了。": 1, "人体免疫功能有很多环节，没有一个简单数字能概括它。图里这个“满”，目前连怎么算都没说。": 1, "先记下来，等会儿问。": 1, "这份菜我好像在二楼见过。": 1, "对，我正站窗口前。菜牌写的是“午间搭配餐”。": 1, "名字怎么突然朴素了？": 1, "可能还没来得及升级。": 1, "去看看实物吧，顺便问问师傅。": 1, "我已经到二楼了。靠窗，绿色书包，正在努力占住三个位置。": 1, "来了。": 1, "马上到。": 1, "下面只写了“网友分享”。": 1, "网友真忙，每天都在分享。": 1, "这能告诉我们它被转发过，没告诉我们效果是怎么得出的。": 1, "那我去问问有没有原图。": 1, "我问转给我的同学。": 1, "这张图有原链接吗？": 1, "收到。我转给她，也让她先别按那个效果买七天。": 1, "以后评价套餐，我申请增加一个价格栏。": 1, "以及够不够我吃。": 1, "你先出现，我们再讨论够不够。": 1, "我可以负责拍摄规范。": 1, "我负责记价格。": 1, "我负责按时来吃。": 1, "这句先存档。": 1, "对，你已经看过我的课表了。明天早上比今天还赶。": 1, "那从早餐开始，把买饭的时间也记上。": 1, "你看，买饭、排队、赶课，经常挤在一起。": 1, "顺便帮我们两个都研究一下，少站在窗口前发呆的办法。": 1, "先看看陆燃训练那天都吃了什么。": 1, "我记得挺细的。肉和蛋都有记录。": 1, "其他食物呢？": 1, "我现在补一个表。": 1, "先把记得的都写上，明天再拍完整记录。": 1, "先帮周简看看，预算内还能怎么搭。": 1, "可以。我有小票。": 1, "你连这个都有？": 1, "价格记不住，怎么判断哪次真的便宜。": 1, "那也记一下份量和实际吃了多少，方便一起看。": 1, "成交。方案要能在食堂买到。": 1, "那就从一整天开始。把吃过的都放在一起看看。": 1, "明天带记录来。我们一起找能调整的地方。": 1, "先说好，允许有“下午临时饿了，又买了点东西”这一栏。": 1, "当然，这也算当天吃的。": 1, "等等，饮料也要拍吗？": 1, "要。": 1, "那我的相册可能比想象中长。": 1, "下午准备带一点吃的。大家有没有明确不能吃的食物，或者需要避开的配料？": 1, "我没有已知食物过敏，少买一点就行，我晚饭正常吃。": 1, "我也没有。会议室没冰箱，保存条件记得看。": 1, "我更想要能分开拿的，吃多少自己取。": 1, "那就结合这些选。需要冷藏的产品按包装要求保存，准备什么时候吃也一起考虑。": 1, "你昨天问我的课表，今天问采购条件，已经很熟练了。": 1, "先各自说说准备吃多少，再决定买多大包装。": 1, "好，先别用“总会有人吃”当人数。": 1, "我带一个水果就够了。": 1, "我也不用一大袋饼干。": 1, "再确认一下有没有食物过敏或其他明确的饮食限制。需要冷藏的东西，也看看有没有合适的保存条件。": 1, "我来把现有清单发到群里，大家补充。": 1, "补上数量。": 1, "我可以自己带水果，别重复买。": 1, "会议室没有冰箱，买的时候看看贮存条件。": 1, "也请大家确认一下过敏或其他饮食限制。": 1, "好，按回复改清单。": 1, "现在买的东西，都知道给谁、什么时候吃了。": 1, "我还多拍了一整组背面照片。": 1, "你的相册终于开始提供有效信息。": 1, "昨天那组也有，鸡肉拍得很清楚。": 1, "窗口菜单我整理好了。明天有几样会换，你们写建议时可以用。": 1, "很好，菜单有变化。": 1, "你为什么听起来有点高兴？": 1, "看看我们的方案能不能换着用。": 1, "还有，昨天帮你追截图来源的同学回复了。": 1, "那来源就继续标“待核实”。我们整理指南时把自己的依据列清楚。": 1, "第一天那张宣传图，出处还是没有核实。我们这次整理自己的指南，把依据和适用情况写清楚。": 1, "封面我来拍。这次正面背面都拍。": 1, "餐盘我也可以提供。": 1, "价格和替换方案交给我。": 1, "赶课版一定要有。": 1, "那下一步，我们把这些信息做成真正能照着用的方案。": 1, "这回我们知道先要什么了。上次追截图追了好几层。": 1, "你是打算用它补充某种营养，还是想靠它预防生病？": 1, "维生素C参与正常免疫功能，但不能因此认定这瓶饮料能预防感冒。还要看具体证据，日常饮食也要整体安排。": 1, "你可以先发完整标签，我们帮你看懂写了什么。": 1, "我昨天也差不多。下次拍照把背面带上。": 1, "这个写常温保存，另一款写冷藏。": 1, "按各自包装要求保存，开封后的要求也要看。": 1, "会议室没有冰箱，这个信息影响我们买什么、什么时候买。": 1, "我已经装好水了。": 1, "所以今天的饮料预算可以按实际需要改。": 1, "对，我不需要拿着一瓶饮料来证明自己参与了采购。": 1, "我的相册越来越像调查材料了。": 1, "构图还是挺好的。": 1, "这句我也存一下。": 1, "今天早餐吃上了，不过临时遇到一点情况。": 1, "怎么了？": 1, "老师让我们提前到教室确认小组汇报顺序，我原来留给吃饭的时间被挤掉了一部分。": 1, "我先吃了一部分，课间再把剩下的吃完。实际时间都记了。": 1, "那我们看看怎么给这种日子留余地。": 1, "再根据实际吃的量、饥饿感和后面餐次调整，别为了照着表走，就把没吃完的记录删掉。": 1, "记录保留。我今天最大的发现是，买到早餐以后，还得给它留时间。": 1, "那我把赶课路线、可用时段和保存条件一起补进来。": 1, "好，寝室没有冰箱这点也记上。": 1, "先把这条经验写进通用指南。除了在哪里买，还要留出实际吃饭的时间。": 1, "对，拿在手上那段不算已经吃了。": 1, "也可以提醒读者，课表变化后重新安排，结合实际食量调整。": 1, "这句我会记住。": 1, "今天按组合点了，照片发你。": 1, "这张拍完，我又加了一点米饭，实际记录也补上了。": 1, "你觉得原来的份量不够？": 1, "窗口默认的份量比我平时吃的少。我开始还在想，既然照着示例买了，是不是就该吃这些。": 1, "训练安排、购买时间和份量需求也一起记上。": 1, "好。": 1, "把“份量需要调整”在通用版里写得更明显。": 1, "对，我一开始看那张照片，以为要照着盘子里的量买。": 1, "那就在图下说明，照片展示的是组合示例，份量需要结合个人情况。": 1, "这样以后看图就不会只盯着“长得一样”。": 1, "买到了，发你今天的小票。": 1, "时蔬今天四元，昨天的菜单上是三元。整套刚好十二元。": 1, "还在预算里。": 1, "对。我先看了新价签才点。幸好没直接照着旧表算。": 1, "午饭十二元、尽量在一排窗口买齐，也补上。": 1, "对，别把它写成我全天只有十二元。": 1, "给通用版加上菜单日期和核价提醒。": 1, "好，价格别印得像永远不会变。": 1, "保留示例的搭配思路，再提醒使用者看当日供应。": 1, "这样这张小票也算完成任务了。": 1, "这个我们之前也问过。": 1, "烹调会改变重量和体积。食堂照片可以帮助粗略观察，但不能直接精确推算。": 1, "每道菜的原料和做法不一样，盛出来的体积也不同。你们要了解某道菜大概用了多少，可以到窗口问。": 1, "指南里的参考量按食材可食部分生重理解。我们把这句紧挨着数字放。": 1, "这句我要直接印出来，不能只藏在点开之后的说明里。": 1, "可以参考搭配思路，再看你们当天供应、份量和自己的需要。": 1, "感觉终于有人能直接用上了。": 1, "我的餐盘照片也算有用了。": 1, "价钱旁边有日期，满意。": 1, "这张背面照片，今天比正面更重要。": 1, "以后用起来遇到问题，还可以继续改。": 1, "明天窗口有新的菜，菜单发群里了。": 1, "怎么又换？": 1, "食堂正常更新。": 1, "看看这次能怎么搭。": 1, "下一次用这套办法，照片应该又会不一样。": 1};
  var MY_TEXTS = {"我想知道，它怎么知道免疫力已经满了？": 1, "这份菜我好像在二楼见过。": 1, "马上到。": 1, "下面只写了“网友分享”。": 1, "那我去问问有没有原图。": 1, "那从早餐开始，把买饭的时间也记上。": 1, "先看看陆燃训练那天都吃了什么。": 1, "先把记得的都写上，明天再拍完整记录。": 1, "先帮周简看看，预算内还能怎么搭。": 1, "那就从一整天开始。把吃过的都放在一起看看。": 1, "当然，这也算当天吃的。": 1, "要。": 1, "下午准备带一点吃的。大家有没有明确不能吃的食物，或者需要避开的配料？": 1, "先各自说说准备吃多少，再决定买多大包装。": 1, "我来把现有清单发到群里，大家补充。": 1, "好，按回复改清单。": 1, "那来源就继续标“待核实”。我们整理指南时把自己的依据列清楚。": 1, "那下一步，我们把这些信息做成真正能照着用的方案。": 1, "你是打算用它补充某种营养，还是想靠它预防生病？": 1, "你可以先发完整标签，我们帮你看懂写了什么。": 1, "所以今天的饮料预算可以按实际需要改。": 1, "构图还是挺好的。": 1, "怎么了？": 1, "那我们看看怎么给这种日子留余地。": 1, "那我把赶课路线、可用时段和保存条件一起补进来。": 1, "先把这条经验写进通用指南。除了在哪里买，还要留出实际吃饭的时间。": 1, "你觉得原来的份量不够？": 1, "训练安排、购买时间和份量需求也一起记上。": 1, "把“份量需要调整”在通用版里写得更明显。": 1, "还在预算里。": 1, "午饭十二元、尽量在一排窗口买齐，也补上。": 1, "给通用版加上菜单日期和核价提醒。": 1, "烹调会改变重量和体积。食堂照片可以帮助粗略观察，但不能直接精确推算。": 1, "可以参考搭配思路，再看你们当天供应、份量和自己的需要。": 1};
  /* CHAT_META_END */

/* CHAT_IMAGES_START */
  var CHAT_IMAGES = {
  "价格被裁掉了。这张图没有考虑我的感受。": "chat_poster.webp",
  "对，我正站窗口前。菜牌写的是“午间搭配餐”。": "chat_menu.webp",
  "去看看实物吧，顺便问问师傅。": "chat_tray.webp",
  "米粒希望吃饭省时，建议需要结合课表和购买条件。": "chat_note.webp",
  "正面有一头奶牛，还有一大杯白色的东西。": "chat_product_front.webp",
  "看一下产品名称、配料表，再和奶的营养成分比较一下，会更清楚。": "chat_product_back.webp",
  "可以。比较时先把“每100毫升”这一栏对齐。": "chat_nutrition.webp",
  "酸奶我下午再看看，已经记在便签上了。": "chat_note.webp",
  "这张图的原始出处仍然没核实。效果承诺也没有找到可核实的依据。": "chat_poster.webp",
  "B的每100毫升比较多。": "chat_nutrition.webp",
  "明天的课表和购买路线，还是之前那样吗？": "chat_note.webp",
  "我的餐盘照片也算有用了。": "chat_tray.webp"
};
  /* CHAT_IMAGES_END */

/* UIDATA_START */
  var UI_DATA = {"餐桌上能看的三个东西": {"kind": "explore", "id": "a1-explore", "title": "餐桌上能看的三个东西", "prompt": "点一个看看", "hint": "", "items": [{"label": "手机上的宣传图", "summary": "图里只有“网友分享”，出处和效果依据都没写。"}, {"label": "米粒的餐盘", "summary": "有主食、肉蛋和两种蔬菜，但看不出份量，也不知道另外两餐。"}, {"label": "被水杯压住的便签", "summary": "下午排得很满，所以她才被“承包”两个字吸引。"}]}, "在宣传图上圈出需要核实的说法": {"kind": "evidence", "id": "a1-it", "title": "圈出需要核实的说法", "prompt": "在宣传图上圈出需要核实的说法", "hint": "一共三处可以点，其中两处在夸大。价格那句不用圈。", "posterText": ["免疫满分套餐", "一份承包全天营养", "连吃七天，免疫力拉满！", "原价 38，今天 22"], "need": 2}, "这次核实了什么": {"kind": "notebook", "id": "a1-notebook", "title": "这次核实了什么", "prompt": "这次核实了什么", "hint": "", "entries": [{"label": "“一份承包全天营养”需要更多信息支持", "text": "判断饮食是否合适，要结合食物种类、数量、其他餐次以及个人需要。"}, {"label": "合理膳食与正常免疫功能有关", "text": "多样、合理的饮食有助于获得充足营养。长期营养不足可能影响正常免疫功能。"}, {"label": "“七天免疫力拉满”缺乏可核实依据", "text": "人体免疫功能复杂，不能依据宣传图片或一顿饭判断某人的“免疫力分数”。"}]}, "我一天就这一顿能好好吃。": {"kind": "plate", "id": "a2-plate", "title": "配一份午饭", "prompt": "我一天就这一顿能好好吃。", "hint": "十二块、四个格子。主食先占一个，蔬菜和蛋白各留一个。", "budget": 12, "slots": 4, "cards": ["rice", "noodle", "potato", "greens", "tomato_egg", "pork", "tofu", "egg"]}, "这盒“牛奶”里，哪一处说明它不是纯牛奶？": {"kind": "evidence", "id": "a3-milk", "title": "圈出需要核实的说法", "prompt": "这盒“牛奶”里，哪一处说明它不是纯牛奶？", "hint": "先看产品名称和配料表的第一位。", "posterText": [], "need": 1}, "哪一瓶，整瓶喝下去含糖更多？": {"kind": "compare", "id": "a3-it", "title": "瓶身对比", "prompt": "哪一瓶，整瓶喝下去含糖更多？", "hint": "别只看正面数字，翻到背面看「每 100 毫升」还是「整瓶」。", "offers": [{"id": "bottle_a", "name": "柠檬茶 500ml", "front": "清爽解腻\n甜度：中", "back": ["每 100 毫升含糖 4 克", "净含量 500 毫升", "配料：水、白砂糖、红茶、香精"], "note": "4 克 × 5 = 20 克，这是一整瓶的量。"}, {"id": "bottle_b", "name": "零蔗糖气泡水 500ml", "front": "零蔗糖\n0 卡", "back": ["每 100 毫升含糖 0 克", "净含量 500 毫升", "配料：水、二氧化碳、甜味剂"], "note": "整瓶没有蔗糖，但「零蔗糖」不等于什么糖都没有。"}]}, "偶遇记录": {"kind": "notebook", "id": "a3-meets", "title": "偶遇记录", "prompt": "这次核实了什么", "hint": "", "entries": [{"label": "R1 第二件半价", "text": "促销要看本来要买几件；多买一件放着，也是钱。"}, {"label": "R2 一袋原来分三份", "text": "家庭装拆开分份，要看每份的量，别把一袋当成一次的量。"}, {"label": "R3 瓶身只拍到一半", "text": "只拍到半个瓶身，看不到配料和营养表，等于没拍到。"}]}, "七点出门，我只想拿了就走。": {"kind": "plate", "id": "a4-it", "title": "配一份午饭", "prompt": "七点出门，我只想拿了就走。", "hint": "八块钱、三个格子。主食和蛋白各来一份，别硬凑蔬菜。", "budget": 8, "slots": 3, "cards": ["rice", "noodle", "egg", "milk", "tofu", "greens"]}, "我会选了": {"kind": "ending", "id": "e_normal", "title": "我会选了", "prompt": "", "hint": "", "body": ["你完成了一份有依据的校园膳食指南，先发布了通用版。", "查看信息、合理搭配、考虑实际需要，开始用在日常选择里。"], "action": "明天中午，给自己加一份蔬菜", "unlocks": ["完整通用指南", "已体验角色记录", "知识来源页"]}, "换一家食堂，也会选": {"kind": "ending", "id": "e_advanced", "title": "换一家食堂，也会选", "prompt": "", "hint": "", "body": ["指南完成，也做了试行，写下了通用总结。", "换一份没见过的菜单，你还能说出哪里要补、哪里可以省。"], "action": "下次点餐前，先看一眼有没有蔬菜", "unlocks": ["完整通用指南", "已体验角色记录", "知识来源页", "试行反馈摘要"]}, "先问清楚，再给建议": {"kind": "ending", "id": "e_hidden", "title": "先问清楚，再给建议", "prompt": "", "hint": "", "body": ["你按具体的人核对条件，做完便签，又按反馈改了方案。", "给的是能执行的方案，不是要求。"], "action": "给建议之前，先问一句他的时间表", "unlocks": ["完整通用指南", "已体验角色记录", "知识来源页", "试行反馈摘要", "个人条件便签"]}};
  /* UIDATA_END */

  var MENU_LABELS = ['开始游戏', '继续游戏', '游戏选项', '读取存档', '鉴赏模式', '退出游戏'];


  // 标题菜单：允许点在行与行之间也能命中最近的一行
  function menuRowHit(menu) {
    if (!menu) return;
    menu.addEventListener('click', function (ev) {
      if (ev.target.closest('button')) return;   // 命中按钮就交给按钮自己
      var btns = [].slice.call(menu.querySelectorAll('button'));
      var y = ev.clientY;
      var best = null;
      var bestD = 1e9;
      btns.forEach(function (b) {
        var r = b.getBoundingClientRect();
        var d = Math.abs((r.top + r.bottom) / 2 - y);
        if (d < bestD) { bestD = d; best = b; }
      });
      if (best && bestD < 48) best.click();
    });
  }

  function buildTitle() {
    var existed = document.getElementById('paper-title');
    if (existed) return existed;
    var t = document.createElement('div');
    t.id = 'paper-title';
    t.innerHTML =
      '<div class="pt-wash"></div>' +
      '<div class="pt-lockup">' +
      '  <div class="pt-name">今天吃什么？</div>' +
      '  <div class="pt-sub">校园膳食调查簿</div>' +
      '  <div class="pt-rule"></div>' +
      '</div>' +
      '<div class="pt-menu">' +
      MENU_LABELS.map(function (l) { return '<button data-label="' + l + '">' + l + '</button>'; }).join('') +
      '</div>';
    document.body.appendChild(t);
    menuRowHit(t.querySelector('.pt-menu'));

    t.querySelector('.pt-menu').addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      var want = btn.getAttribute('data-label');
      var spans = document.querySelectorAll('span,div');
      for (var i = 0; i < spans.length; i += 1) {
        if (spans[i].children.length === 0 && (spans[i].textContent || '').trim() === want) {
          spans[i].click();
          return;
        }
      }
    });
    return t;
  }


  // 原生的全屏菜单是否打开（选项 / 存档 / 读档 / 流程图 / 回想）
  function nativePanelOpen() {
    var probes = ['[class*="Config"]', '[class*="Save"]', '[class*="Load"]',
                  '[class*="Backlog"]', '[class*="Flowchart"]', '[class*="_Menu"]'];
    var vw = window.innerWidth, vh = window.innerHeight;
    for (var p = 0; p < probes.length; p += 1) {
      var nodes = document.querySelectorAll(probes[p]);
      for (var i = 0; i < nodes.length; i += 1) {
        var r = nodes[i].getBoundingClientRect();
        var cs = getComputedStyle(nodes[i]);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) continue;
        if (r.width * r.height > vw * vh * 0.3) return true;
      }
    }
    return false;
  }


  function ownOverlay(node) {
    return !!(node.closest && (node.closest('#paper-ui') || node.closest('#paper-esc') || node.closest('#paper-title') || node.closest('#paper-chat')));
  }

  var BAR_LABELS = ['隐藏', '回想', '重播', '自动', '快进', '快速存档', '快速读档', '存档', '读档', '选项', '标题', '全屏'];

  function nativeAction(label) {
    if (label === '开始游戏' || label === '继续游戏' || label === '读取存档') gameStarted = true;
    if (label === '标题') gameStarted = false;
    if (label === '标题' && window.__wgBackToTitle) {
      if (window.__wgClosePanels) window.__wgClosePanels();
      setTimeout(function () { window.__wgBackToTitle(); }, 120);
      // 强制显示自绘标题，别等引擎底栏卸载
      titleForcedUntil = Date.now() + 4000;
      var t = document.getElementById('paper-title');
      if (t) t.style.display = 'block';
      var ui = document.getElementById('paper-ui');
      if (ui) ui.style.display = 'none';
      var chat = document.getElementById('paper-chat');
      if (chat) chat.style.display = 'none';
      return true;
    }
    var btns = document.querySelectorAll('[class*="_singleButton"]');
    // 1) 按底栏文字子节点匹配
    for (var i = 0; i < btns.length; i += 1) {
      var t = btns[i].querySelector('[class*="button_text"]');
      if (t && (t.textContent || '').trim() === label) { btns[i].click(); return true; }
    }
    // 2) 按固定顺序兜底
    var idx = BAR_LABELS.indexOf(label);
    if (idx >= 0 && btns[idx]) { btns[idx].click(); return true; }
    // 3) 菜单页面里的文字按钮（选项/存档等页面自带按钮）
    var leaves = document.querySelectorAll('div, span, button');
    for (var j = 0; j < leaves.length; j += 1) {
      var el = leaves[j];
      if (el.children.length || ownOverlay(el)) continue;
      if ((el.textContent || '').trim() === label) { el.click(); return true; }
    }
    return false;
  }

  function buildEscBar() {
    if (document.getElementById('paper-esc')) return document.getElementById('paper-esc');
    var bar = document.createElement('div');
    bar.id = 'paper-esc';
    var back = document.createElement('button');
    back.textContent = '返回';
    back.addEventListener('click', function () {
      if (!nativeAction('返回')) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
      }
    });
    var title = document.createElement('button');
    title.textContent = '标题';
    title.addEventListener('click', function () {
      // 原生底栏在菜单里不挂载：先 Esc 关菜单，再走工具栏的「标题」
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
      setTimeout(function () {
        var ui = document.getElementById('paper-ui');
        if (ui) ui.style.display = '';
        var btn = document.querySelector('#paper-ui .pu-tools button[data-label="标题"]');
        if (btn) btn.click();
        else nativeAction('标题');
      }, 800);
    });
    bar.appendChild(back);
    bar.appendChild(title);
    document.body.appendChild(bar);
    stopOwnEvents(bar);
    return bar;
  }


  function menuBg(show) {
    var bg = document.getElementById('paper-menubg');
    if (!bg) {
      bg = document.createElement('div');
      bg.id = 'paper-menubg';
      document.body.appendChild(bg);
    }
    bg.style.display = show ? 'block' : 'none';
  }

  function hideOwnChrome() {
    var ui = document.getElementById('paper-ui');
    var chat = document.getElementById('paper-chat');
    var t = document.getElementById('paper-title');
    if (ui) ui.style.display = 'none';
    if (chat) chat.style.display = 'none';
    if (t) t.style.display = 'none';
    var esc = buildEscBar();
    if (esc) esc.style.display = 'flex';
    menuBg(false);
  }

  function showOwnChrome() {
    var ui = document.getElementById('paper-ui');
    if (ui) ui.style.display = '';
    var esc = document.getElementById('paper-esc');
    if (esc) esc.style.display = 'none';
    menuBg(false);
  }


  function nativeTitleVisible() {
    var probes = ['开始游戏', '继续游戏'];
    var els = document.querySelectorAll('div, span');
    for (var i = 0; i < els.length; i += 1) {
      var el = els[i];
      if (el.children.length) continue;
      var t = (el.textContent || '').trim();
      if (probes.indexOf(t) < 0) continue;
      if (ownOverlay(el)) continue;
      var r = el.getBoundingClientRect();
      var cs = getComputedStyle(el);
      if (r.width > 20 && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05) return true;
    }
    return false;
  }

  function syncTitle() {
    var t = document.getElementById('paper-title') || buildTitle();
    if (window.__paperBootDone) window.__paperBootDone();

    // 原生菜单优先：菜单开着时，自绘的一切都收起
    if (nativePanelOpen()) {
      hideOwnChrome();
      return;
    }

    var hasBar = document.querySelectorAll('[class*="_singleButton"]').length > 0;
    if (Date.now() < titleForcedUntil) {
      hideOwnChrome();
      t.style.display = 'block';
      var escS = document.getElementById('paper-esc');
      if (escS) escS.style.display = 'none';
      return;
    }

    if (stateSeenText) gameStarted = true;
    var atTitle = !gameStarted || nativeTitleVisible();
    var inGame = gameStarted && !atTitle;
    t.style.display = inGame ? 'none' : 'block';

    var escBar = document.getElementById('paper-esc');
    if (escBar) escBar.style.display = inGame && nativePanelOpen() ? 'flex' : 'none';

    if (inGame) {
      showOwnChrome();
    } else {
      // 回到标题：清空聊天记录，避免残留面板
      chatLines = [];
      chatSig = '';
      chatLastTextAt = 0;
      var chatBox = document.getElementById('paper-chat');
      if (chatBox) {
        chatBox.style.display = 'none';
        var body = chatBox.querySelector('.pc-body');
        if (body) body.innerHTML = '';
      }
    }

    // 藏起 WebGAL 自己的标题菜单（保留可点击）
    var nodes = document.querySelectorAll('span');
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      if (el.children.length === 0 && MENU_LABELS.indexOf((el.textContent || '').trim()) >= 0) {
        var holder = el.closest('div');
        if (holder && holder.getAttribute('data-paper-hidden') !== '1') {
          holder.setAttribute('data-paper-hidden', '1');
          holder.style.opacity = '0';
          holder.style.pointerEvents = 'none';
        }
        // 祖先也一起禁掉，避免外层容器继续接收点击
        var up = holder && holder.parentElement;
        for (var k = 0; up && k < 3; k += 1) {
          up.style.pointerEvents = 'none';
          up = up.parentElement;
        }
      }
    }
  }

  setInterval(syncTitle, 600);
  document.addEventListener('DOMContentLoaded', function () { buildTitle(); });

  addCss();
  document.addEventListener('DOMContentLoaded', function () { addCss(); buildUi(); });
  setInterval(function () { addCss(); buildUi(); sync(); }, 170);
})();

