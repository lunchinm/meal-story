# -*- coding: utf-8 -*-
"""CI 里对 WebGAL 源码打的三处补丁（必须和本地保持一致）：
   1) 打字机尾巴归零 + 默认文字速度 120（点一下就能推进）
   2) 暴露 window.__wgBackToTitle（自绘 UI 回标题）
   3) 暴露 window.__wgClosePanels（关掉原生各面板）
"""
import io
import os
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "packages/webgal/src"


def patch(path, pairs):
    p = os.path.join(SRC, path)
    if not os.path.exists(p):
        print("跳过（不存在）：", p)
        return
    s = io.open(p, encoding="utf-8").read()
    changed = False
    for old, new in pairs:
        if old in s:
            s = s.replace(old, new)
            changed = True
    if changed:
        io.open(p, "w", encoding="utf-8").write(s)
        print("已改：", path)
    else:
        print("无变化：", path)


def append(path, text, marker):
    p = os.path.join(SRC, path)
    if not os.path.exists(p):
        print("跳过（不存在）：", p)
        return
    s = io.open(p, encoding="utf-8").read()
    if marker in s:
        print("已存在：", path)
        return
    s += text
    io.open(p, "w", encoding="utf-8").write(s)
    print("已追加：", path)


# 1) 打字机
patch("hooks/useTextOptions.ts", [
    ("return startRange + (100 - data) * step;", "return Math.max(0, startRange + (100 - data) * step);"),
])
patch("store/userDataReducer.ts", [
    ("textSpeed: 50,", "textSpeed: 120,"),
    ("textSpeed: 100,", "textSpeed: 120,"),
])

# 2)(3) 暴露给自绘 UI
append("Core/controller/gamePlay/backToTitle.ts", """
// 自绘 UI：回标题
if (typeof window !== 'undefined') {
  (window as any).__wgBackToTitle = backToTitle;
  (window as any).__wgClosePanels = () => {
    const dispatch = webgalStore.dispatch;
    // 真实存在的组件名：showMenuPanel(含选项/存档/读档) / showBacklog / showFlowchart
    (['showMenuPanel', 'showBacklog', 'showFlowchart'] as string[]).forEach((c) => {
      try { dispatch(setVisibility({ component: c as any, visibility: false })); } catch (e) { /* ignore */ }
    });
    (window as any).__isMenuOpen = false;
  };
  (window as any).__wgTextBox = (show: boolean) => {
    try { webgalStore.dispatch(setVisibility({ component: 'showTextBox' as any, visibility: !!show })); } catch (e) { /* ignore */ }
  };
  (window as any).__wgQuickBar = (show: boolean) => {
    try { webgalStore.dispatch(setVisibility({ component: 'showControls' as any, visibility: !!show })); } catch (e) { /* ignore */ }
  };
  (window as any).__wgOpenMenu = (tag: string) => {
    try {
      webgalStore.dispatch(setMenuPanelTag(tag as any));
      webgalStore.dispatch(setVisibility({ component: 'showMenuPanel' as any, visibility: true }));
      return true;
    } catch (e) { return false; }
  };
  (window as any).__wgOpenBacklog = () => {
    try { webgalStore.dispatch(setVisibility({ component: 'showBacklog' as any, visibility: true })); return true; } catch (e) { return false; }
  };
  (window as any).__wgOpenFlowchart = () => {
    try { webgalStore.dispatch(setVisibility({ component: 'showFlowchart' as any, visibility: true })); return true; } catch (e) { return false; }
  };
  (window as any).__wgVocalSrc = () => {
    try {
      const st: any = stageStateManager.getViewStageState();
      return st && st.playVocal ? st.playVocal : '';
    } catch (e) { return ''; }
  };
  (window as any).__wgRewind = (steps = 1) => {
    try {
      const sm = WebGAL.sceneManager.sceneData;
      const list = sm.currentScene.sentenceList as any[];
      let need = Math.max(1, steps);
      let i = sm.currentSentenceId - 1;
      while (i >= 0 && need > 0) {
        if (list[i] && list[i].command === 'say') need -= 1;
        if (need === 0) break;
        i -= 1;
      }
      if (i < 0) return false;
      sm.currentSentenceId = i;
      __wgContinueSentence();
      return true;
    } catch (e) { return false; }
  };
}
""", "__wgBackToTitle")


# 3) 调试与交互出口
append("Core/controller/gamePlay/backToTitle.ts", """
// 自绘 UI：主动推进 / 跳 label / 停配音
import { nextSentence as __wgNextSentence, continueSentence as __wgContinueSentence } from '@/Core/controller/gamePlay/nextSentence';
import { jumpToLabel as __wgJumpToLabel } from '@/Core/gameScripts/label/jumpToLabel';
import { changeScene as __wgChangeScene } from '@/Core/controller/scene/changeScene';

if (typeof window !== 'undefined') {
  (window as any).__wgNext = () => {
    try { __wgNextSentence(); } catch (e) { /* ignore */ }
  };
  (window as any).__wgJump = (label: string, sceneUrl?: string) => {
    try {
      if (sceneUrl) {
        __wgChangeScene(sceneUrl, '');
        let tries = 0;
        const tryJump = () => {
          tries += 1;
          let ok = false;
          try { ok = __wgJumpToLabel(label); } catch (e) { ok = false; }
          if (!ok && tries < 14) { setTimeout(tryJump, 300); }
        };
        setTimeout(tryJump, 300);
        return true;
      }
      return __wgJumpToLabel(label);
    } catch (e) { return false; }
  };
  (window as any).__wgStopVocal = () => {
    try {
      const v = document.getElementById('currentVocal') as HTMLAudioElement | null;
      if (v) { v.pause(); v.currentTime = 0; }
    } catch (e) { /* ignore */ }
  };
  (window as any).__wgGetVar = (key: string) => {
    try {
      const vars = (stageStateManager.getViewStageState() as any).GameVar || {};
      const v = vars[key];
      return v && typeof v === 'object' ? (v as any).value : v;
    } catch (e) { return undefined; }
  };
}
""", "__wgNext")



# 4) 调试跳关：startGame 支持 __wgDebugStart
patch("Core/controller/gamePlay/startContinueGame.ts", [
    ("""  const sceneUrl: string = assetSetter('start.txt', fileType.scene);
  // 场景写入到运行时
  sceneFetcher(sceneUrl).then((rawScene) => {
    WebGAL.sceneManager.sceneData.currentScene = sceneParser(rawScene, 'start.txt', sceneUrl);
    WebGAL.flowchartManager.waitForCurrentSceneDialog();
    // 开始第一条语句
    continueSentence();
  });""", """  const dbg = (window as any).__wgDebugStart as { scene?: string; label?: string } | undefined;
  const targetFile = dbg && dbg.scene ? dbg.scene : 'start.txt';
  const sceneUrl: string = assetSetter(targetFile, fileType.scene);
  sceneFetcher(sceneUrl).then((rawScene) => {
    WebGAL.sceneManager.sceneData.currentScene = sceneParser(rawScene, targetFile, sceneUrl);
    if (dbg && dbg.label) {
      const list = WebGAL.sceneManager.sceneData.currentScene.sentenceList;
      for (let i = 0; i < list.length; i += 1) {
        const sn = list[i] as any;
        if (String(sn.content) === String(dbg.label)) {
          WebGAL.sceneManager.sceneData.currentSentenceId = i;
          break;
        }
      }
      (window as any).__wgDebugStart = undefined;
    }
    WebGAL.flowchartManager.waitForCurrentSceneDialog();
    continueSentence();
  });"""),
])



# 5) 开场默认背景（避免第一句整屏黑）
patch("Core/controller/gamePlay/startContinueGame.ts", [
    ("export const startGame = () => {\n  resetStage(true);",
     "export const startGame = () => {\n  resetStage(true);\n  try { stageStateManager.setStageAndCommit('bgName', assetSetter('bg_gingko.webp', fileType.background)); } catch (e) { /* ignore */ }  // __wgDefaultBg"),
])


# 6) 给 backToTitle.ts 补 import（自绘层出口需要 stageStateManager / WebGAL / setMenuPanelTag）
patch("Core/controller/gamePlay/backToTitle.ts", [
    ("import { webgalStore } from '@/store/store';",
     "import { webgalStore } from '@/store/store';\n"
     "import { stageStateManager } from '@/Core/Modules/stage/stageStateManager';\n"
     "import { WebGAL } from '@/Core/WebGAL';"),
    ("import { setVisibility } from '@/store/GUIReducer';",
     "import { setVisibility, setMenuPanelTag } from '@/store/GUIReducer';"),
])

print("引擎补丁完成")
