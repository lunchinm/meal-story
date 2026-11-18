# 云端回归结果

- 目标：http://127.0.0.1:8082/
- 时间：2026-11-18T06:18:25.227Z
- 汇总：{"通过":24,"不通过":2,"需人工":3}

| 用例 | 名称 | 结果 | 说明 |
| --- | --- | --- | --- |
| A-01 | 首屏能打开自绘标题页（6 项菜单） | 通过 |  / 647ms |
| A-02 | 标题菜单文案与设计一致 | 通过 | 开始游戏/继续游戏/游戏选项/读取存档/鉴赏模式/退出游戏 |
| A-03 | 未点开始前不出现原生 PRESS THE SCREEN 提示 | 通过 |  |
| A-04 | 未点开始前不出现 LANGUAGE SELECT 语言层 | 通过 |  |
| A-05 | 未点开始前不推进剧情（没有对话框） | 通过 |  |
| A-06 | 点开始后 1.5 秒内标题层收起 | 通过 |  |
| A-07 | 进入游戏后原生 PRESS / 语言层都不可见 | 通过 | 开始后 PRESS=false 语言层=false；处理一次后 PRESS=false 语言层=false |
| A-08 | 游戏内只有一个对话框实例（不叠层） | 通过 | 实例数=1 |
| A-09 | 游戏进行中标题层不会回弹覆盖 | 通过 | display=none |
| B-01 | 开始后 5 秒内出现第一句对白 | 通过 | 今天吃什校园膳食调查簿 |
| B-02 | 鼠标点击对话区能推进对白 | 通过 | 2/3 次点击有推进 |
| B-03 | 按空格后对白有变化（不卡死） | 通过 | 90/15 次有变化 |
| B-04 | 单次推进响应中位数 < 300ms | 通过 | 中位 185ms，p90 229ms，最大 332ms |
| B-05 | 单次推进超过 1 秒的次数 | 通过 | 0/15 次 > 1s / 37,75,76,77,86,88,96,110,110,110,112,120,123,125,139,141,141,145,149,151,155,156,158,162,168,168,168,170,171,171,172,173,173,173,173,174,174,175,176,178,179,180,182,183,183,185,187,188,188,188,188,188,189,190,195,200,201,203,204,204,206,209,209,214,214,216,218,219,220,221,221,222,223,223,225,226,226,227,227,227,228,229,231,234,239,242,263,279,292,332 |
| B-06 | 页面无 4xx/5xx 资源 | 不通过 | 404 game/figure/ui_notebook.webp ; 404 game/figure/ui_notebook.webp ; 404 game/figure/ui_notebook.webp ; 404 game/figure/ui_paper.webp ; 404 game/figure/ui_paper.webp ; 404 game/figure/ui_notebook.webp |
| B-07 | 控制台无 JS 报错 | 不通过 | console: Failed to load resource: the server responded with a status of 404 (File not found) ; console: Failed to load resource: the server responded with a status of 404 (File not found) ; console: Failed to load resource: the server responded with a status of 404 (File not found) ; console: Failed to load resource: the server responded with a status of 404 (File not found) |
| C-01 | BGM 已加载并在播放 | 通过 | {"src":"bgm_loop.mp3","paused":false,"ct":40.35,"dur":48,"vol":0.1125,"muted":false} |
| C-02 | 台词触发 /vocal/ 配音请求 | 通过 | 84 条，例 200 a1-29.mp3 |
| C-03 | 配音音频元素在播（currentTime 前进） | 通过 | audio 元素=["bgm_loop.mp3","a1-81.mp3"] |
| C-04 | 听感（音色/响度/无爆音） | 需人工 | 云端无音频设备，只能验证请求与播放状态 |
| D-01 | 游戏内存在「流程图」入口 | 通过 | 快捷栏=true 选项面板=false（config 已写 Enable_flowchart:true） |
| D-02 | game/flowchart.json 可访问（流程图数据） | 通过 | HTTP 200 |
| D-03 | 选项/流程图面板沿用纸质风格（颜色/字体） | 需人工 | {"bg":"rgba(0, 0, 0, 0)","font":"WebgalUI, -apple-system, BlinkMacSystemF","radius":"0px"} |
| E-01 | 快速存档写入本地存储 | 通过 | 存前=todayeat2026,todayeat2026-flowchart,todayeat2026-flowchart-main-start,todayeat2026-saves-fast；存后=todayeat2026,todayeat2026-flowchart,todayeat2026-flowchart-main-start,todayeat2026-saves-fast,todayeat2026-saves0 |
| E-02 | 刷新后「继续游戏」回到存档进度 | 通过 | clicked；读回=许许许知知知夏夏夏许许许知知知夏夏夏我我 |
| G-01 | 1280×720 / 1920×1080 无横向溢出、框不出屏 | 通过 | {"f720":{"overflow":0,"cardInside":true},"f1080":{"overflow":0,"cardInside":true}} |
| G-02 | 1024×600 小窗仍可用 | 通过 | {"overflow":0,"cardInside":true} |
| G-03 | 浏览器标签标题是作品名而非引擎名 | 通过 | 今天吃什么？——校园膳食调查簿 |
| H-01 | 配音文件数（仓库侧统计，需外部核对） | 需人工 | 见 report.md 的资源统计 |