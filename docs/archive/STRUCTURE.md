# 文件结构

```
meal-story/
├─ index.html                入口页
├─ package.json              只有四个脚本：dev / build / preview / e2e
├─ tsconfig.json  vite.config.ts
├─ README.md                 怎么跑、怎么改剧情、怎么测
│
├─ content/                  剧情与数据的唯一来源，改内容只动这里
│  ├─ act1.json              第一章《套餐的秘密》
│  ├─ act2.json              第二章《餐盘之外》
│  ├─ act3.json              第三章《翻到包装背面》
│  ├─ act4.json              第四章《你的方案，能坚持吗》+ 三个结局
│  ├─ cards.json             10 张食物卡（类别、份量、模拟价格）
│  └─ knowledge.json         知识卡与来源
│
├─ src/
│  ├─ main.ts                启动、标题页、键盘推进、静音键
│  ├─ state.ts               存档、flag、已选食物卡
│  ├─ audio.ts               音效、配音、背景垫音三条通道
│  ├─ assets.ts              素材索引（生成物，构建时把资源内联进单文件）
│  ├─ engine/
│  │  ├─ types.ts            七种节点类型
│  │  ├─ loader.ts           读 content/*.json
│  │  └─ runner.ts           按 id 走剧情，分发到各节点
│  ├─ modules/
│  │  ├─ plate.ts            餐盘关：预算、类别、同类过量
│  │  └─ evidence.ts         证据关：点选要核实的说法
│  └─ ui/
│     ├─ stage.ts            对话框、选项、章节卡、提示、结局卡
│     └─ styles.css          全部样式，1280×720 基准
│
├─ assets/                   只有成品资源，不含生成流程
│  ├─ bg/                    5 张背景
│  ├─ ch/                    12 张立绘（4 人 × 3 表情）
│  ├─ food/                  10 张食物卡
│  ├─ sfx/                   5 个音效 + 1 段垫音
│  ├─ voice/                 13 句配音 + manifest.json + reference/
│  └─ font/                  自带字体（待补）
│
├─ docs/                     计划与登记
│  ├─ ASSETS.md              素材清单与来源
│  ├─ ROADMAP.md             后续开发计划
│  └─ STRUCTURE.md           本文件
│
└─ tools/
   └─ e2e.mjs                自动化测试（CDP 真点击）
```

## 约定

- 新增内容只改 `content/`，必要时加素材到 `assets/`，代码不动。
- 素材命名：`bg_*` / `ch_<角色>_<表情>` / `food_<菜名>` / `sfx_*` / 配音用节点 id。
- 生成流程与工具链不入库，仓库只保存成品。
- 改完跑 `npm run e2e`，全绿再提交。
