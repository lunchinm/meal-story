// A 纸质调查簿 · 主题注入（构建后追加到 index.html 末尾）
// WebGAL 的模板 scss 与 emotion 样式的加载顺序不稳定，这里在运行时把主题样式
// 追加到 <head> 末尾，保证优先级最高；并监听 DOM 变化保证被清理后能补回来。
(function () {
  var THEME = `
/* ---- A 纸质调查簿 ---- */
[class*="TextBox_Container"] span {
  font-size: 34px !important;
  line-height: 1.85 !important;
  letter-spacing: .03em !important;
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif !important;
  color: #2f3a2f !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: none !important;
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
  font-size: 17px !important;
  -webkit-text-stroke: 0 !important;
}

[class*="Choose"] [class*="item"], [class*="Choose"] button {
  background-image: linear-gradient(180deg, #fbf6e9, #f1e7d1) !important;
  color: #33402f !important;
  border: 1px solid #b9a986 !important;
  border-radius: 3px !important;
  box-shadow: 0 10px 22px rgba(84, 70, 44, .22) !important;
  font-family: 'Songti SC', 'SimSun', serif !important;
}

[class*="Choose"] span {
  color: #33402f !important;
  -webkit-text-stroke: 0 !important;
}
`;

  function inject() {
    if (document.getElementById('paper-theme')) return;
    var tag = document.createElement('style');
    tag.id = 'paper-theme';
    tag.textContent = THEME;
    document.head.appendChild(tag);
  }

  inject();
  document.addEventListener('DOMContentLoaded', inject);
  setInterval(inject, 1500);
})();
