# 今天吃什么？——校园膳食调查簿

“合理膳食 · 免疫基石”创意宣传大赛初赛的交互作品。
网页互动短篇：对话 + 餐盘搭配 + 看标签，单次 8—12 分钟。

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
│  ├─ act1.json        第一幕《套餐的秘密》
│  ├─ act2.json        第二幕《餐盘之外》
│  ├─ act3.json        第三幕《翻到包装背面》+ 结局
│  ├─ cards.json       10 张食物卡（名称、类别、份量、模拟价格）
│  └─ knowledge.json   知识卡与来源
└─ assets/             背景、立绘、食物卡、音效（待补）
```

## 改剧情（写手看这段）

剧情全在 `content/*.json`，不用碰代码。一个节点长这样：

```json
{ "id": "a1-01", "type": "say", "speaker": "旁白", "text": "一句话。", "next": "a1-02" }
```

节点类型只有五种：

| type | 用途 | 关键字段 |
| --- | --- | --- |
| `say` | 一句对白／旁白 | `speaker`、`text`、`scene`、`next` |
| `choice` | 选项 | `options[{ text, next, flag }]` |
| `plate` | 餐盘关 | `budget`、`slots`、`cards`、`check`、`hint`、`next` |
| `evidence` | 证据判断 | `claims[{ text, suspect, reason }]`、`need`、`next` |
| `ending` | 结局 | `title`、`body[]`、`action` |

规则：

- `next` 指向下一个节点的 `id`，写完必须存在，否则会弹出“找不到节点”。
- 科普结论写在对白里一句话，依据写进 `knowledge.json`，来源别省。
- 不写“免疫力＋20”“吃一顿就生病”这类因果。

## 改界面（技术看这段）

- 舞台固定 16:9，内容区 1280×720，所有尺寸在 `styles.css` 的 `.stage` 里。
- 加一种节点：在 `types.ts` 里加接口，`runner.ts` 里加一个 `case`，模块放 `src/modules/`。
- 两个互动关卡的判定逻辑各在自己的文件里，互不影响，两个人可以并行改。
- 判定不许设唯一答案；餐盘试到第三次还不达标就放行，别让玩家卡死。

## 还没做的

- 立绘、背景、食物卡图（`assets/` 空的，现在靠配色区分场景）。
- 知识卡弹层（数据已备好，UI 未接）。
- 隐藏结局的 flag 判定（`state.flags` 已在存，判定未写）。
- 图上的区域圈选（现在是点选说法，够用）。
- 手机端适配（只保证桌面 16:9 浏览器）。
