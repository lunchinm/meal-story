# -*- coding: utf-8 -*-
"""CI 里对 WebGAL 源码打补丁（与本地保持一致，幂等可重复运行）。"""
import io
import os
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "packages/webgal/src"


def _p(path):
    return os.path.join(SRC, path)


def patch(path, pairs):
    p = _p(path)
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
        print("已修改：", path)
    else:
        print("无变化：", path)


def ensure_imports():
    """backToTitle.ts 里缺的 import 补上（按 import 语句判断，幂等）"""
    p = _p("Core/controller/gamePlay/backToTitle.ts")
    if not os.path.exists(p):
        return
    src = io.open(p, encoding="utf-8").read()
    head = src.split("export const")[0]
    add = []
    if "import { stageStateManager }" not in head:
        add.append("import { stageStateManager } from '@/Core/Modules/stage/stageStateManager';")
    if "import { WebGAL }" not in head:
        add.append("import { WebGAL } from '@/Core/WebGAL';")
    if "setMenuPanelTag" not in head:
        add.append("import { setMenuPanelTag } from '@/store/GUIReducer';")
    if "__wgNextSentence" not in head:
        add.append("import { nextSentence as __wgNextSentence, continueSentence as __wgContinueSentence } from '@/Core/controller/gamePlay/nextSentence';")
    if "__wgJumpFromBacklog" not in head:
        add.append("import { jumpFromBacklog as __wgJumpFromBacklog } from '@/Core/controller/storage/jumpFromBacklog';")
    if "__wgStopAuto" not in head:
        add.append("import { stopAuto as __wgStopAuto } from '@/Core/controller/gamePlay/autoPlay';")
        add.append("import { stopFast as __wgStopFast } from '@/Core/controller/gamePlay/fastSkip';")
    if "__wgJumpToLabel" not in head:
        add.append("import { jumpToLabel as __wgJumpToLabel } from '@/Core/gameScripts/label/jumpToLabel';")
    if "__wgChangeScene" not in head:
        add.append("import { changeScene as __wgChangeScene } from '@/Core/controller/scene/changeScene';")
    if add:
        io.open(p, "w", encoding="utf-8").write("\n".join(add) + "\n" + src)
        print("补齐 import：", len(add), "行")


EXPORTS = """
// ===== 自绘 UI 出口（由 patch-engine 注入）=====
if (typeof window !== 'undefined') {
  (window as any).__wgBackToTitle = backToTitle;
  (window as any).__wgNext = () => { try { __wgNextSentence(); } catch (e) { /* ignore */ } };
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
  (window as any).__wgClosePanels = () => {
    const dispatch = webgalStore.dispatch;
    (['showMenuPanel', 'showBacklog', 'showFlowchart'] as string[]).forEach((c) => {
      try { dispatch(setVisibility({ component: c as any, visibility: false })); } catch (e) { /* ignore */ }
    });
  };
  (window as any).__wgTextBox = (show: boolean) => {
    try { webgalStore.dispatch(setVisibility({ component: 'showTextBox' as any, visibility: !!show })); } catch (e) { /* ignore */ }
  };
  (window as any).__wgQuickBar = (show: boolean) => {
    try { webgalStore.dispatch(setVisibility({ component: 'showControls' as any, visibility: !!show })); } catch (e) { /* ignore */ }
  };
  (window as any).__wgStopAllPlay = () => {
    try { __wgStopAuto(); } catch (e) { /* ignore */ }
    try { __wgStopFast(); } catch (e) { /* ignore */ }
  };
  (window as any).__wgOpenMenu = (tag: string) => {
    try {
      (window as any).__wgStopAllPlay();
      webgalStore.dispatch(setMenuPanelTag(tag as any));
      webgalStore.dispatch(setVisibility({ component: 'showMenuPanel' as any, visibility: true }));
      return true;
    } catch (e) { return false; }
  };
  (window as any).__wgOpenBacklog = () => {
    try { (window as any).__wgStopAllPlay(); webgalStore.dispatch(setVisibility({ component: 'showBacklog' as any, visibility: true })); return true; } catch (e) { return false; }
  };
  (window as any).__wgOpenFlowchart = () => {
    try { (window as any).__wgStopAllPlay(); webgalStore.dispatch(setVisibility({ component: 'showFlowchart' as any, visibility: true })); return true; } catch (e) { return false; }
  };
  (window as any).__wgStopVocal = () => {
    try {
      const v = document.getElementById('currentVocal') as HTMLAudioElement | null;
      if (v) { v.pause(); v.currentTime = 0; }
    } catch (e) { /* ignore */ }
  };
  (window as any).__wgVocalSrc = () => {
    try {
      const st: any = stageStateManager.getViewStageState();
      return st && st.playVocal ? st.playVocal : '';
    } catch (e) { return ''; }
  };
  (window as any).__wgGetVar = (key: string) => {
    try {
      const vars = (stageStateManager.getViewStageState() as any).GameVar || {};
      const v = vars[key];
      return v && typeof v === 'object' ? (v as any).value : v;
    } catch (e) { return undefined; }
  };
  (window as any).__wgRewind = (steps = 1) => {
    try {
      const list = WebGAL.backlogManager.getBacklog();
      const index = list.length - 1 - Math.max(1, steps);
      if (index < 0) return false;
      __wgJumpFromBacklog(index);
      return true;
    } catch (e) { return false; }
  };
}
"""


def main():
    # 1) 打字机 + 文字速度
    patch("hooks/useTextOptions.ts", [
        ("return startRange + (100 - data) * step;", "return Math.max(0, startRange + (100 - data) * step);"),
    ])
    patch("store/userDataReducer.ts", [
        ("textSpeed: 50,", "textSpeed: 120,"),
        ("textSpeed: 100,", "textSpeed: 120,"),
    ])

    # 2) 回退：复用原生回想快照，改为 async 且跳转前停自动/快进
    patch("Core/controller/storage/jumpFromBacklog.ts", [
        (
            "import { stopAllPerform } from '@/Core/controller/gamePlay/stopAllPerform';",
            "import { stopAllPerform } from '@/Core/controller/gamePlay/stopAllPerform';\n"
            "import { stopAuto } from '@/Core/controller/gamePlay/autoPlay';\n"
            "import { stopFast } from '@/Core/controller/gamePlay/fastSkip';",
        ),
        (
            "export const jumpFromBacklog = (index: number, refetchScene = true) => {",
            "export const jumpFromBacklog = async (index: number, refetchScene = true) => {",
        ),
        (
            "  if (refetchScene)\n"
            "    sceneFetcher(backlogFile.saveScene.sceneUrl).then((rawScene) => {\n"
            "      WebGAL.sceneManager.sceneData.currentScene = sceneParser(\n"
            "        rawScene,\n"
            "        backlogFile.saveScene.sceneName,\n"
            "        backlogFile.saveScene.sceneUrl,\n"
            "      );\n"
            "      WebGAL.sceneManager.settledScenes.add(WebGAL.sceneManager.sceneData.currentScene.sceneUrl); // 放入已加载场景列表，避免递归加载相同场景\n"
            "    });",
            "  if (refetchScene) {\n"
            "    const rawScene = await sceneFetcher(backlogFile.saveScene.sceneUrl);\n"
            "    WebGAL.sceneManager.sceneData.currentScene = sceneParser(\n"
            "      rawScene,\n"
            "      backlogFile.saveScene.sceneName,\n"
            "      backlogFile.saveScene.sceneUrl,\n"
            "    );\n"
            "    WebGAL.sceneManager.settledScenes.add(WebGAL.sceneManager.sceneData.currentScene.sceneUrl);\n"
            "  }",
        ),
        (
            "  // 强制停止所有演出\n  stopAllPerform();",
            "  // 强制停止所有演出与自动/快进\n  stopAuto();\n  stopFast();\n  stopAllPerform();",
        ),
    ])

    # 3) 出口
    ensure_imports()
    p = _p("Core/controller/gamePlay/backToTitle.ts")
    if os.path.exists(p):
        s = io.open(p, encoding="utf-8").read()
        if "__wgBackToTitle" not in s:
            io.open(p, "w", encoding="utf-8").write(s + "\n" + EXPORTS)
            print("已追加自绘出口")

    # 3) startGame：默认背景 + 调试跳关
    patch("Core/controller/gamePlay/startContinueGame.ts", [
        (
            "export const startGame = () => {\n  resetStage(true);",
            "export const startGame = () => {\n  resetStage(true);\n"
            "  try { stageStateManager.setStageAndCommit('bgName', assetSetter('bg_gingko.webp', fileType.background)); } catch (e) { /* ignore */ }",
        ),
        (
            "  const sceneUrl: string = assetSetter('start.txt', fileType.scene);\n"
            "  // 场景写入到运行时\n"
            "  sceneFetcher(sceneUrl).then((rawScene) => {\n"
            "    WebGAL.sceneManager.sceneData.currentScene = sceneParser(rawScene, 'start.txt', sceneUrl);",
            "  const dbg = (window as any).__wgDebugStart as { scene?: string; label?: string } | undefined;\n"
            "  const targetFile = dbg && dbg.scene ? dbg.scene : 'start.txt';\n"
            "  const sceneUrl: string = assetSetter(targetFile, fileType.scene);\n"
            "  sceneFetcher(sceneUrl).then((rawScene) => {\n"
            "    WebGAL.sceneManager.sceneData.currentScene = sceneParser(rawScene, targetFile, sceneUrl);\n"
            "    if (dbg && dbg.label) {\n"
            "      const list = WebGAL.sceneManager.sceneData.currentScene.sentenceList;\n"
            "      for (let i = 0; i < list.length; i += 1) {\n"
            "        if (String((list[i] as any).content) === String(dbg.label)) {\n"
            "          WebGAL.sceneManager.sceneData.currentSentenceId = i;\n"
            "          break;\n"
            "        }\n"
            "      }\n"
            "      (window as any).__wgDebugStart = undefined;\n"
            "    }",
        ),
    ])

    print("引擎补丁完成")


if __name__ == "__main__":
    main()
