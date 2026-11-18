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
  padding: 2px 0;
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
  opacity: 0 !important;
  pointer-events: none !important;
  z-index: 1 !important;
}

#paper-ui .pu-choices {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 232px;
  width: 560px;
  display: none;
  flex-direction: column;
  gap: 12px;
  pointer-events: auto;
  z-index: 6;
}

#paper-ui .pu-choices button {
  width: 100%;
  padding: 14px 24px;
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
      var all = document.querySelectorAll('[class*="_singleButton"]');
      for (var k = 0; k < all.length; k += 1) {
        if ((all[k].textContent || '').trim() === want) { all[k].click(); return; }
      }
    });

    root.appendChild(tools);

    var choices = document.createElement('div');
    choices.className = 'pu-choices';
    root.appendChild(choices);

    var chat = document.createElement('div');
    chat.id = 'paper-chat';
    chat.innerHTML = '<div class="pc-head">校园膳食调查组</div><div class="pc-body"></div><div class="pc-choices"></div>';
    document.body.appendChild(chat);

    if (!document.getElementById('paper-viewer')) {
      var viewer = document.createElement('div');
      viewer.id = 'paper-viewer';
      viewer.innerHTML = '<img alt="查看大图">';
      viewer.addEventListener('click', function () { viewer.classList.remove('open'); });
      document.body.appendChild(viewer);
    }
    root.appendChild(chapter);
    root.appendChild(tag);
    root.appendChild(card);
    root.appendChild(name);
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

  function readDialogue() {
    var cont = document.querySelector('[class*="TextBox_Container"]');
    if (!cont) return { name: '', text: '' };

    var nodes = [];
    if (fillCls) {
      nodes = cont.querySelectorAll('.' + fillCls);
      if (!nodes.length) fillCls = '';
    }
    if (!fillCls) {
      pickFillClass(cont);
      nodes = fillCls ? cont.querySelectorAll('.' + fillCls) : [];
    }

    var nameChars = [];
    var bodyChars = [];
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      if (el.children.length) continue;
      var t = (el.textContent || '').trim();
      if (!t || t.length > 2) continue;
      if (el.closest(NAME_SEL)) nameChars.push(t);
      else bodyChars.push(t);
    }

    var nameText = dedupeLayers(nameChars.join(''));
    var half = nameText.length / 2;
    if (half > 0 && Number.isInteger(half) && nameText.slice(0, half) === nameText.slice(half)) {
      nameText = nameText.slice(0, half);
    }

    return { name: nameText, text: dedupeLayers(bodyChars.join('')) };
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

    var labels = items.map(function (it) { return (it.innerText || '').replace(/\s+/g, '').trim(); });
    var key = labels.join('|');
    if (key !== lastChoiceKey) {
      lastChoiceKey = key;
      box.innerHTML = '';
      labels.forEach(function (text, idx) {
        var btn = document.createElement('button');
        btn.textContent = text;
        btn.addEventListener('click', function () {
          var now = readChoiceItems();
          if (now[idx]) now[idx].click();
        });
        box.appendChild(btn);
      });
    }
    box.style.display = 'flex';
  }


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
  window.__chatImages = CHAT_IMAGES;

  var chatLines = [];
  var chatLastTextAt = 0;
  var chatSig = '';

  var bgModeCache = '';
  var bgScanAt = 0;

  function currentBg() {
    var now = Date.now();
    if (now - bgScanAt < 600) return bgModeCache;
    bgScanAt = now;

    var cands = document.querySelectorAll('img, div');
    for (var i = 0; i < cands.length && i < 600; i += 1) {
      var e = cands[i];
      var src = e.tagName === 'IMG' ? (e.getAttribute('src') || '') : (getComputedStyle(e).backgroundImage || '');
      if (src.indexOf('bg_chat') >= 0) { bgModeCache = 'chat'; return 'chat'; }
    }
    bgModeCache = '';
    return '';
  }

  function syncChat(state) {
    var panel = document.getElementById('paper-chat');
    if (!panel) return;
    var isChat = currentBg() === 'chat';
    var card = document.querySelector('#paper-ui .pu-card');
    var nameEl = document.querySelector('#paper-ui .pu-name');

    if (!isChat) {
      panel.style.display = 'none';
      if (card) card.style.display = '';
      if (nameEl) nameEl.style.display = state.name ? 'inline-block' : 'none';
      chatLines = [];
      chatSig = '';
      return;
    }

    var nowTs = Date.now();
    if (state.text) chatLastTextAt = nowTs;

    // 兜底：进了聊天场景却一直读不到文字，回落成对话纸卡
    if (!state.text && !chatLines.length && nowTs - (chatLastTextAt || 0) > 2500) {
      panel.style.display = 'none';
      if (card) card.style.display = '';
      return;
    }

    if (card) card.style.display = 'none';
    if (nameEl) nameEl.style.display = 'none';
    panel.style.display = 'flex';

    if (chatLines.length && !chatLines[chatLines.length - 1].who && state.name) {
      chatLines[chatLines.length - 1].who = state.name;
    }

    var sig = state.name + '|' + state.text;
    if (state.text && sig !== chatSig) {
      chatSig = sig;
      chatLines.push({ who: state.name || '', text: state.text });
      if (chatLines.length > 40) chatLines.shift();
      var body = panel.querySelector('.pc-body');
      body.innerHTML = '';
      chatLines.forEach(function (ln) {
        var row = document.createElement('div');
        row.className = 'pc-row' + (ln.who === '你' ? ' me' : '');
        if (ln.who) {
          var who = document.createElement('div');
          who.className = 'pc-who';
          who.textContent = ln.who === '你' ? '你' : ln.who;
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

    // 选项做成回复条
    var items = readChoiceItems();
    var box = panel.querySelector('.pc-choices');
    if (items.length) {
      box.style.display = 'flex';
      if (box.dataset.key !== items.map(function (i) { return i.innerText; }).join('|')) {
        box.dataset.key = items.map(function (i) { return i.innerText; }).join('|');
        box.innerHTML = '';
        items.forEach(function (it, idx) {
          var btn = document.createElement('button');
          btn.textContent = (it.innerText || '').replace(/\s+/g, ' ').trim();
          btn.addEventListener('click', function () {
            var now = readChoiceItems();
            if (now[idx]) now[idx].click();
          });
          box.appendChild(btn);
        });
      }
    } else {
      box.style.display = 'none';
      box.dataset.key = '';
    }
  }

  function sync() {
    try { syncInner(); } catch (e) { /* 单次失败不影响游戏 */ }
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
    if (state.text) window.__paperLine = state.text;
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


  var MENU_LABELS = ['开始游戏', '继续游戏', '游戏选项', '读取存档', '鉴赏模式', '退出游戏'];

  function buildTitle() {
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

  function syncTitle() {
    var t = document.getElementById('paper-title') || buildTitle();
    var inGame = !!document.querySelector('[class*="TextBox_Container"]');
    t.style.display = inGame ? 'none' : 'block';

    // 藏起 WebGAL 自己的标题菜单（保留可点击）
    var nodes = document.querySelectorAll('span');
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      if (el.children.length === 0 && MENU_LABELS.indexOf((el.textContent || '').trim()) >= 0) {
        var holder = el.closest('div');
        if (holder && holder.getAttribute('data-paper-hidden') !== '1') {
          holder.setAttribute('data-paper-hidden', '1');
          holder.style.opacity = '0';
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

