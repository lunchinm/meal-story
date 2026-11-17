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

  addCss();
  document.addEventListener('DOMContentLoaded', function () { addCss(); buildUi(); });
  setInterval(function () { addCss(); buildUi(); sync(); }, 200);
})();
