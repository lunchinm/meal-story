# 今天吃什么？——校园膳食调查簿

“合理膳食 · 免疫基石”创意宣传大赛初赛的交互作品。
网页互动短篇：对话 + 餐盘搭配 + 看标签，四章、三种结局、单次 10—14 分钟。

**在线试玩**：https://lunchinm.github.io/meal-story/

## 跑起来

```bash
npm install      # 第一次
npm run dev      # 本地开发，浏览器打开 http://localhost:5173
npm run build    # 打包成一个 dist/index.html，双击就能玩
```

`npm run build` 会把 JS、CSS、剧情全部打进一个文件，离线可用，交付时直接压缩上传。

## 目录

```
meal-story/
├─ index.html
├─ src/
│  ├─ main.ts          入口：标题页、启动、键盘推进
│  ├─ state.ts         存档（localStorage）、flag、已选食物卡
│  ├─ engine/
│  │  ├─ types.ts      节点类型定义（先看这里）
│  │  ├─ loader.ts     把 content/*.json 读进来
│  │  └─ runner.ts     按 id 走剧情，分发到各节点
│  ├─ ui/
│  │  ├─ stage.ts      对话框、选项、结局卡、toast
│  │  └─ styles.css    全部样式，1280×720 基准
│  └─ modules/
│     ├─ plate.ts      餐盘关：预算、类别、同类过量
│     └─ evidence.ts   证据关：点选需要核实的说法
├─ content/
│  ├─ act1.json        第一章《套餐的秘密》
│  ├─ act2.json        第二章《餐盘之外》
│  ├─ act3.json        第三章《翻到包装背面》
│  ├─ act4.json        第四章《你的方案，能坚持吗》+ 三个结局
│  ├─ cards.json       10 张食物卡（名称、类别、份量、模拟价格）
│  └─ knowledge.json   知识卡与来源
├─ assets/             背景 bg/、立绘 ch/、食物卡 food/、音效 sfx/、语音 voice/、字体 font/
├─ docs/               素材清单 ASSETS.md、开发计划 ROADMAP.md、文件结构 STRUCTURE.md
└─ tools/              e2e.mjs 自动化测试
```

素材从哪来、用了什么依据，看 [docs/ASSETS.md](docs/ASSETS.md)；接下来要做什么，看 [docs/ROADMAP.md](docs/ROADMAP.md)。

## 改剧情（写手看这段）

剧情全在 `content/*.json`，不用碰代码。一个节点长这样：

```json
{ "id": "a1-01", "type": "say", "speaker": "旁白", "text": "一句话。", "next": "a1-02" }
```

节点类型（七种，branch 分流结局、chapter 是章节卡）：

| type | 用途 | 关键字段 |
| --- | --- | --- |
| `say` | 一句对白／旁白 | `speaker`、`text`、`scene`、`actor`、`expr`、`card`、`hint`、`next` |
| `choice` | 三选一左右的分支 | `question`、`hint`、`options[{ text, next, flag }]` |
| `plate` | 餐盘关 | `budget`、`slots`、`cards`、`check`、`hint`、`tip`、`next` |
| `evidence` | 证据判断 | `claims[{ text, suspect, reason }]`、`need`、`hint`、`next` |
| `chapter` | 章节卡 | `title`、`subtitle`、`next` |
| `branch` | 按 flag 分流结局 | `rules[{ flags, all, next }]`、`fallback` |
| `ending` | 结局 | `title`、`body[]`、`action` |

规则：

- `next` 指向下一个节点的 `id`，写完必须存在，否则会弹出“找不到节点”。
- 选择别给默认项：每个 option 都得是学生真会考虑的做法，加一句 `hint` 说明看什么。
- 科普结论写在对白里一句话，依据写进 `knowledge.json`，来源别省。
- 不写“免疫力＋20”“吃一顿就生病”这类因果。

## 改界面（技术看这段）

- 舞台固定 16:9，内容区 1280×720，所有尺寸在 `styles.css` 的 `.stage` 里。
- 加一种节点：在 `types.ts` 里加接口，`runner.ts` 里加一个 `case`，模块放 `src/modules/`。
- 两个互动关卡的判定逻辑各在自己的文件里，互不影响，两个人可以并行改。
- 判定不许设唯一答案；餐盘试到第三次还不达标就放行，别让玩家卡死。

## 素材

`assets/` 里只有成品资源，直接引用，不含任何生成流程：

- `bg/`：5 张场景背景（1280×720 webp）
- `ch/`：4 个角色 × 3 种表情，透明底半身立绘（webp）
- `food/`：10 张食物卡（webp）
- `sfx/`：点击、翻页、过关、失败、结局音与一段背景垫音
- `voice/`：13 句对白配音，文件名就是剧情节点 id；`manifest.json` 是可查的清单

要用新素材，按同名同尺寸替换即可，代码不用改。

## 自动化测试（改完必跑）

```bash
npm run preview -- --port 4174 --strictPort   # 终端 A
npm run e2e                                    # 终端 B
```

`tools/e2e.mjs` 用 Chrome DevTools Protocol 发真实鼠标事件，跑 14 步：标题 → 四章 → 两处配餐 → 两处证据 → 知识卡 → 三个结局 → 1024×720 视口检查。
点不到或被遮挡会直接报出上层元素，控制台有一条报错就整轮失败。

## 还没做的

- 图上的区域圈选（现在是点选说法，够用，验收也认这个）。
- 手机端适配（只保证桌面 16:9 浏览器）。
