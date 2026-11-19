# 资源清单（供外部替换使用）

这份清单只说明「需要什么」，不涉及怎么做。任何人拿到仓库，按文件名、尺寸、格式替换即可，代码不用改。

约定：

- 背景与插画：1280×720，webp，命名 `bg_*.webp`
- 立绘：透明底，420×640，webp，命名 `ch_<角色>_<表情>.webp`
- 食物卡：220×220，webp，命名 `food_<菜名>.webp`
- 配音：mp3 单声道 96kbps，文件名＝剧情节点 id，如 `a1-01.mp3`
- 音效与音乐：mp3 / wav，命名 `sfx_*` 与 `bgm_*`

---

## 一、背景与插画 `assets/bg/`

| 文件 | 用途 | 必须 |
| --- | --- | --- |
| bg_title.webp | 标题页 | 是 |
| bg_chat.webp | 群聊场景（夜里书桌） | 是 |
| bg_canteen.webp | 食堂 | 是 |
| bg_store.webp | 便利店 | 是 |
| bg_class.webp | 教室 | 是 |
| ch_banner_1.webp | 第一章过场图（手机群聊） | 是 |
| ch_banner_2.webp | 第二章过场图（食堂窗口） | 是 |
| ch_banner_3.webp | 第三章过场图（饮料货架） | 是 |
| ch_banner_4.webp | 第四章过场图（课桌方案） | 是 |
| ending_normal.webp | 结局《我会选了》 | 是 |
| ending_advanced.webp | 结局《换一家食堂，也会选》 | 是 |
| ending_hidden.webp | 结局《先问清楚，再给建议》 | 是 |
| poster_meal.webp | 第一章宣传图底图（文字由界面叠加，图里不要有字） | 是 |

## 二、角色立绘 `assets/ch/`

四名现有角色 + 两名新增角色，每人三种表情：`normal`（平静）、`happy`（开心）、`worried`（为难）。

| 角色 id | 角色 | 表情文件 |
| --- | --- | --- |
| ch_mili | 米粒（行动力强、赶时间） | ch_mili_normal / happy / worried |
| ch_zhoujian | 周简（预算敏感、爱较真） | ch_zhoujian_normal / happy / worried |
| ch_zhixia | 许知夏（医学生、负责查证） | ch_zhixia_normal / happy / worried |
| ch_sutao | 苏桃（摄影社、看包装） | ch_sutao_normal / happy / worried |
| ch_luran | 陆燃（运动社、说话直接） | ch_luran_normal / happy / worried |
| ch_luomaster | 罗师傅（食堂窗口） | ch_luomaster_normal / happy / worried |

可选扩展表情：`surprised`（惊讶）、`thinking`（思考）。加文件名后，在剧情 JSON 的 `expr` 里引用即可。

## 三、食物卡 `assets/food/`

与 `content/cards.json` 的 id 一一对应。

| 文件 | 菜品 | 类别 |
| --- | --- | --- |
| food_rice.webp | 米饭 | 主食 |
| food_noodle.webp | 汤面 | 主食 |
| food_potato.webp | 土豆丝 | 主食 |
| food_greens.webp | 清炒时蔬 | 蔬菜 |
| food_tomato_egg.webp | 番茄炒蛋 | 蛋白＋蔬菜 |
| food_pork.webp | 肉菜 | 蛋白 |
| food_tofu.webp | 家常豆腐 | 蛋白 |
| food_egg.webp | 水煮蛋 | 蛋白 |
| food_milk.webp | 牛奶 | 奶类 |
| food_drink.webp | 含糖饮料 | 饮品 |

## 四、配音 `assets/voice/`

每条对白一句（共 184 句），文件名＝剧情节点 id。`manifest.json` 记录节点、说话人和时长，可用来核对有没有缺。

| 说话人 | 音色要求 | 参考样音 |
| --- | --- | --- |
| 旁白 | 成年女性，语速偏慢，像讲一件家常事 | reference/旁白.wav |
| 米粒 | 少女，声音偏高，语气轻快 | reference/米粒.wav |
| 周简 | 少年，声音偏低，语速平稳 | reference/周简.wav |
| 许知夏 | 年轻女性，声音温和清晰 | reference/许知夏.wav |
| 苏桃 | 年轻女性，语气轻松俏皮 | reference/苏桃.wav |
| 陆燃 | 少年，声音偏低，说话干脆 | reference/陆燃.wav |
| 陆燃 | 少年，声音亮，有冲劲 | reference/陆燃.wav |
| 罗师傅 | 中年男性，声音低而略带沙哑，语速慢 | reference/罗师傅.wav |

`reference/` 里的样音是这个项目自己的合成产物，用于保持同一角色音色一致；替换配音时按同样音色录即可。
**配音一律不做变调**，音色差异只能靠选人或换描述解决。

## 五、音效与音乐 `assets/sfx/`

| 文件 | 用途 |
| --- | --- |
| sfx_click.wav | 推进对话 |
| sfx_page.wav | 翻页、选项、知识卡 |
| sfx_pass.wav | 关卡通过 |
| sfx_fail.wav | 选择不达标 |
| sfx_ending.wav | 进入结局 |
| bgm_chat.mp3 | 群聊场景垫音 |
| bgm_canteen.mp3 | 食堂场景垫音 |
| bgm_store.mp3 | 便利店场景垫音 |
| bgm_loop.mp3 | 标题与结局的兜底垫音 |

## 六、字体与图标（待补）

| 资源 | 规格 | 说明 |
| --- | --- | --- |
| 中文字体 | 思源黑体 / 阿里巴巴普惠体，Regular + Bold，子集化后单个 < 300KB | 放 `assets/font/`，随包分发，附授权说明 |
| 界面图标 | SVG，24×24，描边风格 | 音量、静音、提示、继续、知识卡、翻面；现在用内联 SVG，替换成文件时改 `src/ui/icons.ts` |

## 七、非资源类交付物

| 物件 | 说明 |
| --- | --- |
| 10 分钟录屏 | 1080p30，字幕烧录，覆盖四章关键选择 |
| 素材授权登记 | 每个文件的来源与许可，见本文件与 `docs/ASSETS.md` |
| 一页作品说明 | 目标受众、三个学习目标、科普依据 |

## 八、替换流程（给接手的人）

1. 按上表文件名放好新资源，尺寸和格式保持一致。
2. 立绘与食物卡如果是 PNG，转成 webp 即可；透明底要保留。
3. 配音换名即换声，不用改代码；新增对白才需要加新文件。
4. 跑 `npm run build`，再跑 `npm run e2e`，全绿即可提交。
