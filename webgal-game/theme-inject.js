// A 纸质调查簿 · 自绘 UI 叠层（对齐预览图 A 的排版）
// 做法：把 WebGAL 自带的文本框设为透明（仍可点击推进），在它上面画我们的纸卡。
// 文案来源：WebGAL 每字三层 span，_outer_ 里是正文，_outerName_ 里是名字。
(function () {
  if (window.__paperUiLoaded) return;
  window.__paperUiLoaded = true;

  var CSS = `
/* WebGAL 原生文本框：保留点击，视觉隐藏 */
[class*="TextBox_Container"] {
  opacity: 0 !important;
  pointer-events: auto !important;
}

/* 底部快捷条：挪进纸卡右下角，只留图标 */
[class*="_main_rdjpk"], [class*="BottomControlPanel"] {
  position: fixed !important;
  right: 76px !important;
  bottom: 54px !important;
  left: auto !important;
  top: auto !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  backdrop-filter: none !important;
  z-index: 60 !important;
  display: flex !important;
  gap: 4px !important;
  opacity: .5 !important;
  transform: scale(.82) !important;
  transform-origin: right bottom !important;
}

[class*="_main_rdjpk"] button,
[class*="_main_rdjpk"] div {
  background: transparent !important;
  color: #5b6b4f !important;
  min-width: 26px !important;
  padding: 2px !important;
  border: none !important;
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
    var root = document.createElement('div');
    root.id = 'paper-ui';

    var chapter = document.createElement('div');
    chapter.className = 'pu-chapter';
    chapter.textContent = window.__paperChapter || '';

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

    var bodySpans = cont.querySelectorAll('[class*="outer_"]');
    var body = '';
    for (var j = 0; j < bodySpans.length; j += 1) body += bodySpans[j].textContent;

    nameText = nameText.trim();
    // WebGAL 会同时渲染 outerName / innerName 两份，去掉重复的一半
    var half = nameText.length / 2;
    if (half > 0 && Number.isInteger(half) && nameText.slice(0, half) === nameText.slice(half)) {
      nameText = nameText.slice(0, half);
    }

    return { name: nameText, text: body };
  }

  function sync() {
    buildUi();
    var ui = document.getElementById('paper-ui');
    if (!ui) return;
    var state = readDialogue();
    var nameEl = ui.querySelector('.pu-name');
    var textEl = ui.querySelector('.pu-text');

    if (state.text) textEl.textContent = state.text;

    // 章节卡：正文形如「第一章《套餐的秘密》」时，同时点亮左上角章标
    var chapEl = ui.querySelector('.pu-chapter');
    var m = /^第([一二三四五六七八九十]+)章[《·\s]*([^》，。]*)[》]?/.exec(state.text || '');
    if (m) {
      chapEl.textContent = '第' + m[1] + '章 · ' + m[2].replace(/[《》]/g, '').trim();
    }
    if (chapEl) chapEl.style.display = (chapEl.textContent || '').trim() ? 'block' : 'none';

    if (state.name) {
      nameEl.textContent = state.name;
      nameEl.style.display = 'inline-block';
    } else {
      nameEl.style.display = 'none';
    }
  }

  addCss();
  document.addEventListener('DOMContentLoaded', function () { addCss(); buildUi(); });
  setInterval(function () { addCss(); buildUi(); sync(); }, 200);
})();
