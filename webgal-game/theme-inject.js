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
  position: fixed !important;
  left: 50% !important;
  right: auto !important;
  top: auto !important;
  bottom: 464px !important;
  transform: translateX(-50%) !important;
  width: 1120px !important;
  height: auto !important;
  max-height: 300px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 24px !important;
  background: transparent !important;
  z-index: 58 !important;
  overflow: visible !important;
}

[class*="_Choose_item_outer"] {
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  box-sizing: border-box !important;
  padding: 28px 48px !important;
  background: rgba(252, 248, 236, .97) !important;
  border: 2px solid rgba(120, 104, 74, .42) !important;
  border-radius: 6px !important;
  box-shadow: 0 10px 22px rgba(84, 70, 44, .22) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  font-family: 'Songti SC', 'SimSun', serif !important;
  font-size: 36px !important;
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
  background: rgba(247, 242, 228, .16);
  backdrop-filter: saturate(.78) sepia(.14) brightness(1.05);
  -webkit-backdrop-filter: saturate(.78) sepia(.14) brightness(1.05);
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
    var old = document.getElementById('paper-ui-style');
    if (old) old.remove();
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

    // 右下角快捷图标：点它 = 点 WebGAL 藏起来的同名按钮
    var tools = document.createElement('div');
    tools.className = 'pu-tools';
    tools.innerHTML =
      '<button data-label="回想" title="回想"><svg viewBox="0 0 24 24"><path d="M4 5v6h6"/><path d="M4 11a8 8 0 1 1 2 8"/></svg></button>' +
      '<button data-label="自动" title="自动"><svg viewBox="0 0 24 24"><path d="M7 5l11 7-11 7z"/></svg></button>' +
      '<button data-label="快进" title="快进"><svg viewBox="0 0 24 24"><path d="M5 5l8 7-8 7z"/><path d="M14 5l8 7-8 7z"/></svg></button>' +
      '<button data-label="存档" title="存档"><svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5z"/><path d="M9 4v5h6V4"/></svg></button>' +
      '<button data-label="选项" title="设置"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg></button>';

    tools.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      var want = btn.getAttribute('data-label');
      var all = document.querySelectorAll('[class*="_singleButton"]');
      for (var k = 0; k < all.length; k += 1) {
        if ((all[k].textContent || '').trim() === want) { all[k].click(); return; }
      }
    });

    root.appendChild(tools);
    root.appendChild(chapter);
    root.appendChild(tag);
    root.appendChild(card);
    root.appendChild(name);
    document.body.appendChild(root);
  }

  function readDialogue() {
    var cont = document.querySelector('[class*="TextBox_Container"]');
    if (!cont) return { name: '', text: '' };

    var nameSpans = cont.querySelectorAll('[class*="outerName"]');
    var nameText = '';
    for (var i = 0; i < nameSpans.length; i += 1) nameText += nameSpans[i].textContent;
    nameText = nameText.trim();
    var half = nameText.length / 2;
    if (half > 0 && Number.isInteger(half) && nameText.slice(0, half) === nameText.slice(half)) {
      nameText = nameText.slice(0, half);
    }

    var bodySpans = cont.querySelectorAll('[class*="outer_"]');
    var body = '';
    for (var j = 0; j < bodySpans.length; j += 1) body += bodySpans[j].textContent;

    return { name: nameText, text: body };
  }

  function sync() {
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

    if (state.text) textEl.textContent = state.text;

    if (state.name) {
      nameEl.textContent = state.name;
      nameEl.style.display = 'inline-block';
    } else {
      nameEl.style.display = 'none';
    }

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

  setInterval(syncTitle, 320);
  document.addEventListener('DOMContentLoaded', function () { buildTitle(); });

  addCss();
  document.addEventListener('DOMContentLoaded', function () { addCss(); buildUi(); });
  setInterval(function () { addCss(); buildUi(); sync(); }, 200);
})();
