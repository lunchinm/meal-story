// A 纸质调查簿 · 运行时主题（在 index.html 末尾加载，最后注入 <head>，优先级最高）
// 结构：纸卡 = 文本框容器第一个子 div；正文 = 逐字 span；名牌 = outerName/innerName 逐字 span
(function () {
  var THEME = `
/* ---------- 纸卡 ---------- */
[class*="TextBox_Container"] > div:first-child {
  min-height: 250px !important;
  height: auto !important;
  background-color: #f7f1e0 !important;
  background-image: linear-gradient(180deg, #fbf6e8 0%, #efe5cc 100%) !important;
  border: 1px solid #b9a986 !important;
  border-radius: 5px !important;
  opacity: 1 !important;
  box-shadow:
    0 16px 34px rgba(84, 70, 44, .3),
    inset 0 0 0 5px rgba(251, 246, 232, .95),
    inset 0 0 0 6px rgba(150, 130, 96, .45) !important;
  backdrop-filter: none !important;
}

[class*="TextBox_Container"] > div:nth-child(2) {
  padding: 30px 52px 34px 52px !important;
}

/* ---------- 正文：墨绿宋体 ---------- */
[class*="TextBox_Container"] span {
  font-size: 48px !important;
  line-height: 1.85 !important;
  color: #2f3a2f !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif !important;
  letter-spacing: .02em !important;
}

/* ---------- 名牌：深绿纸签 + 米白字 ---------- */
[class*="showName"], [class*="ShowName"], [class*="nameContainer"], [class*="showname"] {
  background: #2f4a34 !important;
  border-radius: 2px !important;
  box-shadow: 0 6px 14px rgba(47, 74, 52, .3) !important;
  border: none !important;
}

[class*="outerName"] {
  background-image: none !important;
  -webkit-background-clip: border-box !important;
  background-clip: border-box !important;
  color: #fbf6e8 !important;
  -webkit-text-stroke: 0 !important;
}

[class*="innerName"] {
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
  color: #fbf6e8 !important;
}

[class*="showname"] span, [class*="showName"] span, [class*="ShowName"] span {
  color: #fbf6e8 !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
  font-size: 26px !important;
}

/* ---------- 选项（实际容器 _chooseContainer_xxx） ---------- */
[class*="hoose"] > div {
  background-image: linear-gradient(180deg, #fbf6e9, #f1e7d1) !important;
  color: #33402f !important;
  border: 1px solid #b9a986 !important;
  border-radius: 3px !important;
  box-shadow: 0 10px 22px rgba(84, 70, 44, .25) !important;
}

[class*="hoose"] span {
  color: #33402f !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
  font-family: 'Songti SC', 'SimSun', serif !important;
}
/* ---------- 选项：米色纸标签 ---------- */
[class*="Choose"] [class*="item"], [class*="Choose"] button {
  background-image: linear-gradient(180deg, #fbf6e9, #f1e7d1) !important;
  color: #33402f !important;
  border: 1px solid #b9a986 !important;
  border-radius: 3px !important;
  box-shadow: 0 10px 22px rgba(84, 70, 44, .25) !important;
  font-family: 'Songti SC', 'SimSun', serif !important;
}

[class*="Choose"] span {
  color: #33402f !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
}
`;
  function inject() {
    var old = document.getElementById('paper-theme');
    if (old) old.remove();
    var tag = document.createElement('style');
    tag.id = 'paper-theme';
    tag.textContent = THEME;
    document.head.appendChild(tag);
  }
  inject();
  document.addEventListener('DOMContentLoaded', inject);
  setInterval(inject, 1200);
})();
