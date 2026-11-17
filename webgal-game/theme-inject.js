// A 纸质调查簿 · 奶油纸主题（与预览图 A 一致：纸底 + 墨绿宋体）
(function () {
  var THEME = `
[class*="TextBox_Container"] > div:first-child {
  height: 250px !important;
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

[class*="TextBox_Container"] span {
  font-size: 48px !important;
  line-height: 1.85 !important;
  color: #2f3a2f !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif !important;
  letter-spacing: .02em !important;
}

[class*="TextBox_showName"], [class*="TextBox_ShowName"] {
  background: #2f4a34 !important;
  color: #f7f2e3 !important;
  border-radius: 2px !important;
  letter-spacing: .14em !important;
  font-family: 'Songti SC', 'SimSun', serif !important;
  box-shadow: 0 6px 14px rgba(47, 74, 52, .3) !important;
}
[class*="TextBox_showName"] span, [class*="TextBox_ShowName"] span {
  color: #f7f2e3 !important;
  font-size: 26px !important;
  -webkit-text-stroke: 0 !important;
}

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