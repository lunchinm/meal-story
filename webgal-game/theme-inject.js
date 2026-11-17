// A 纸质调查簿 · 运行时主题注入（结构选择器；本版本容器子元素没有语义类名）
(function () {
  var THEME = `
/* 纸卡：容器第一个子 div */
[class*="TextBox_Container"] > div:first-child {
  height: 190px !important;
  background-color: rgba(44, 36, 26, .9) !important;
  background-image: linear-gradient(180deg, rgba(74, 60, 43, .92) 0%, rgba(36, 29, 21, .94) 100%) !important;
  border: 1px solid rgba(214, 190, 148, .45) !important;
  border-radius: 6px !important;
  opacity: 1 !important;
  box-shadow: 0 18px 40px rgba(15, 10, 6, .5), inset 0 0 0 1px rgba(214, 190, 148, .2) !important;
  backdrop-filter: blur(3px) !important;
}

/* 文字层留出内边距 */
[class*="TextBox_Container"] > div:nth-child(2) {
  padding: 26px 44px 30px 44px !important;
}

/* 正文：米白、大字号 */
[class*="TextBox_Container"] span {
  font-size: 34px !important;
  line-height: 1.8 !important;
  color: #f4ead6 !important;
  -webkit-text-stroke: 0 !important;
  text-shadow: 0 2px 6px rgba(0, 0, 0, .55) !important;
  font-family: 'Songti SC', 'SimSun', 'Noto Serif SC', serif !important;
  letter-spacing: .02em !important;
}

/* 隐藏已读残影，只显示当前行 */
[class*="_readText"], [class~="readText"] { display: none !important; }

/* 名牌：米色纸签 */
[class*="TextBox_showName"], [class*="TextBox_ShowName"] {
  background: #efe6cf !important;
  color: #2f3a2f !important;
  border-radius: 2px !important;
  letter-spacing: .14em !important;
  font-family: 'Songti SC', 'SimSun', serif !important;
  box-shadow: 0 6px 16px rgba(15, 10, 6, .4) !important;
}
[class*="TextBox_showName"] span, [class*="TextBox_ShowName"] span {
  color: #2f3a2f !important;
  font-size: 18px !important;
  -webkit-text-stroke: 0 !important;
}

/* 选项：米色纸标签 */
[class*="Choose"] [class*="item"], [class*="Choose"] button {
  background-image: linear-gradient(180deg, #f9f3e3, #eadfc6) !important;
  color: #33402f !important;
  border: 1px solid #b9a986 !important;
  border-radius: 4px !important;
  box-shadow: 0 12px 26px rgba(15, 10, 6, .35) !important;
  font-family: 'Songti SC', 'SimSun', serif !important;
}
[class*="Choose"] span {
  color: #33402f !important;
  -webkit-text-stroke: 0 !important;
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