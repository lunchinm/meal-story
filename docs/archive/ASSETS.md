# 素材清单与来源登记

本目录记录仓库里每个素材的用途、规格和来源，供评审核对。
原则：不使用真人声线、他人肖像、网络现成素材；配音参考只用本项目自己合成的样音。

## 一、背景 `assets/bg/`

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| bg_title.webp | 1280×720 | 标题页 |
| bg_chat.webp | 1280×720 | 第一章，夜里宿舍桌面 |
| bg_canteen.webp | 1280×720 | 第二章，食堂 |
| bg_store.webp | 1280×720 | 第三章，便利店 |
| bg_class.webp | 1280×720 | 第四章，教室 |

## 二、立绘 `assets/ch/`

命名 `ch_<角色>_<表情>.webp`，透明底，420×640，半身构图。

| 角色 | 表情 | 出现章节 |
| --- | --- | --- |
| 米粒 | normal / happy / worried | 一、二、四 |
| 周简 | normal / happy / worried | 一、二 |
| 许知夏 | normal / happy / worried | 一、二、四 |
| 苏桃 | normal / happy / worried | 三 |

## 三、食物卡 `assets/food/`

220×220 webp，共 10 张，命名 `food_<菜名>.webp`，与 `content/cards.json` 的 id 一一对应。
配餐关只用其中 8 张（第二章）和 6 张（第四章），其余留作替换备选。

## 四、音效 `assets/sfx/`

| 文件 | 用途 |
| --- | --- |
| sfx_click.wav | 推进对话 |
| sfx_page.wav | 选项、知识卡翻页 |
| sfx_pass.wav | 关卡通过 |
| sfx_fail.wav | 选择不达标 |
| sfx_ending.wav | 进入结局 |
| bgm_loop.mp3 | 全程背景垫音，可循环 |

## 五、配音 `assets/voice/`

- 13 个 mp3，文件名即剧情节点 id（如 `a1-01.mp3`），与 `content/*.json` 对应。
- `manifest.json`：节点、说话人、时长，用于核对有没有漏配。
- `reference/*.wav`：五个角色的参考样音，用于保持同一角色的音色一致。
  这些样音本身也是本项目合成产物，不含真人录音。

## 六、文本来源

| 内容 | 依据 |
| --- | --- |
| 食物多样、合理搭配、规律进餐、足量饮水、会看标签 | 中国营养学会《中国居民膳食指南（2022）》 |
| 营养充足与正常免疫功能的关系表述 | NIH Office of Dietary Supplements 相关资料 |
| 每 100 毫升 / 整瓶 的换算示例 | 教学示例数据，正文已标注 |

## 七、授权与限制

- 字体：随包使用开源可商用字体，授权说明见 `assets/font/`。
- 图标：自制 SVG，无第三方版权。
- 素材生成方式与工具链不随仓库分发，仓库只保存成品资源。
