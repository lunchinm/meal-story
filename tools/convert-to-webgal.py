# -*- coding: utf-8 -*-
"""结构化剧本 → WebGAL 场景。场景为生成物；流程条件全部编译进引擎。"""
import io, json, os
from pathlib import Path
MS = Path(__file__).resolve().parents[1]
OUT = MS / 'webgal-game' / 'scene'
VOICE_IDS = {p.stem for p in (MS/'assets/voice').glob('*.mp3')}
PROP_FIG = dict(poster='ui_poster.webp', menu='ui_menu.webp', tray='ui_tray.webp', note='ui_note.webp', product_front='ui_product_front.webp', product_back='ui_product_back.webp', nutrition='ui_nutrition.webp')
SCENE_BG = {'class':'bg_club.webp','canteen':'bg_canteen_sun.webp','store':'bg_store_afternoon.webp','chat':'bg_dorm_night.webp'}
SCENE_BY_ACT = {1:{'chat':'bg_dorm_night.webp','canteen':'bg_canteen_sun.webp','store':'bg_store_afternoon.webp','class':'bg_club.webp'},2:{'chat':'bg_desk_warm.webp','canteen':'bg_canteen_night.webp','store':'bg_store_sun.webp','class':'bg_club.webp'},3:{'chat':'bg_dorm_night.webp','canteen':'bg_canteen_noon.webp','store':'bg_store_blue.webp','class':'bg_club.webp'},4:{'chat':'bg_desk_warm.webp','canteen':'bg_canteen_sun.webp','store':'bg_store_outside.webp','class':'bg_club.webp'}}
IMAGE_BG = {'ch_banner_1':'bg_canteen_sun.webp','ch_banner_2':'bg_canteen_night.webp','ch_banner_3':'bg_store_blue.webp','ch_banner_4':'bg_gingko.webp','ending_normal':'bg_canteen_sun.webp','ending_advanced':'bg_gingko.webp','ending_hidden':'bg_notebook.webp'}
JUMP_TABLE=[]; REC_MAP={}; BRANCH_MAP={}
def san(s): return str(s or '').replace('-','_').replace(':','_').replace('：','_')
def esc(s): return str(s or '').replace('\\','\\\\').replace(';','\\;').replace(':','\\:').replace('|','\\|').replace(',','\\,')
def say(sp, text, voice=None, chat=False):
    if not text: return None
    marker='\u200b' if chat else '\u200c'
    v=f' -vocal={voice}.mp3' if voice and voice in VOICE_IDS and not chat else ''
    return f"{'' if sp in (None,'旁白') else sp}:{esc(marker+text)}{v};"
def target(n, when=''): return f"jumpLabel:t_{san(n)}{' -when=' + when if when else ''};"
def flagvar(f): return 'flag_'+san(f)
def condition(flags, all_=True):
    if isinstance(flags,dict):
        if flags.get('notFlag'): return f'{flagvar(flags["notFlag"])}!=1'
        if flags.get('flag')=='done:all': return f'{flagvar("done:mili")}==1&&{flagvar("done:lu")}==1&&{flagvar("done:zhou")}==1'
        if flags.get('flag'): return f'{flagvar(flags["flag"])}==1'
    ex=[f'{flagvar(f)}==1' for f in flags]
    return ('&&' if all_ else '||').join(ex) or 'false'
def replies(entries, chat):
    out=[]
    for e in entries or []:
        if isinstance(e,str): out.append(say(None,e,chat=chat))
        else: out.append(say(e.get('speaker'),e.get('text'),chat=chat))
    return [x for x in out if x]
def convert(act, data):
    targets=set(); for_next=[]
    for n in data:
        refs=[]
        if n.get('next'): refs.append(n['next'])
        if n.get('fallback'): refs.append(n['fallback'])
        refs += [r.get('next') for r in n.get('rules',[])]
        refs += [r.get('next') for r in n.get('options',[])]
        refs += [r.get('next') for r in n.get('pool',[])]
        targets.update(x for x in refs if x)
    out=[]; scene=None; actor=None; last_seg=None
    for n in data:
        k=n['type']; nid=n['id']; is_chat=bool(scene=='chat' or n.get('channel')=='chat')
        if nid in targets: out.append(f'label:t_{san(nid)};')
        if k=='chapter':
            out += [f'label:act{act};', f'; ==== {n.get("title","")} ====', say(None,n.get('title')), 'bgm:bgm_loop.mp3 -volume=45;', f'changeBg:{IMAGE_BG.get(n.get("image"),"bg_gingko.webp")} -next -duration=700;']
            JUMP_TABLE.append({'label':f'act{act}','act':act,'seg':0,'text':n.get('title','')[:24]}); continue
        if k=='say':
            seg=n.get('seg')
            if seg and seg!=last_seg:
                last_seg=seg; out.append(f'label:seg{act}_{seg};'); JUMP_TABLE.append({'label':f'seg{act}_{seg}','act':act,'seg':seg,'text':n.get('text','')[:24]})
            sc=n.get('scene')
            if sc and sc!=scene:
                scene=sc; actor=None; out.append(f'changeBg:{SCENE_BY_ACT[act].get(sc,SCENE_BG.get(sc,"bg_club.webp"))} -next -duration=500;')
            if n.get('actor') and n['actor']!=actor:
                actor=n['actor']; out += ['changeFigure:none -center -next -duration=250;',f'changeFigure:ch_{actor}_{n.get("expr","normal")}.webp -center -transform={{"scale":{{"x":0.62,"y":0.62}},"position":{{"x":0,"y":150}}}} -next;']
            elif n.get('expr') and actor: out.append(f'changeFigure:ch_{actor}_{n["expr"]}.webp -center -transform={{"scale":{{"x":0.62,"y":0.62}},"position":{{"x":0,"y":150}}}} -next;')
            if n.get('prop') in PROP_FIG: out.append(f'changeFigure:{PROP_FIG[n["prop"]]} -center -transform={{"scale":{{"x":0.3,"y":0.3}},"position":{{"x":260,"y":300}}}} -next;')
            out.append(f'setVar:line={nid};'); out.append(say(n.get('speaker'),n.get('text'),nid,n.get('channel')=='chat'))
            if n.get('next'): out.append(target(n['next']))
        elif k=='choice':
            opts=n.get('options',[])
            if len(opts)==1:
                o=opts[0]
                if o.get('flag'): out.append(f'setVar:{flagvar(o["flag"])}=1;')
                out.append(f'setVar:line={nid}-pick;'); out.append(say('你',o.get('text'),chat=is_chat))
                out += replies(o.get('reply'),is_chat)
                if o.get('next'): out.append(target(o['next']))
            else:
                branches=[]
                for i,o in enumerate(opts):
                    cond=condition([o['showIf']]) if isinstance(o.get('showIf'),str) else condition(o.get('showIf',[])) if o.get('showIf') else ''
                    prefix=f'({cond})->' if cond else ''
                    label=f'c{act}_{san(nid)}_{i}'
                    branches.append(prefix+esc(o.get('text','继续'))+':'+label)
                out.append('choose:'+'|'.join(branches)+';')
                for i,o in enumerate(opts):
                    out.append(f'label:c{act}_{san(nid)}_{i};')
                    if o.get('flag'): out.append(f'setVar:{flagvar(o["flag"])}=1;')
                    out.append(f'setVar:line={nid}-c{i};'); out.append(say('你',o.get('text'),chat=is_chat)); out += replies(o.get('reply'),is_chat)
                    out.append(target(o.get('next',nid+'_after')))
                out.append(f'label:t_{san(nid+"_after")};')
        elif k=='record':
            idx=len(REC_MAP)+1; REC_MAP[str(idx)]={'flag':n.get('flag',''),'label':n.get('label','')}
            out += [f'setVar:rec={idx};',f'setVar:{flagvar(n.get("flag"))}=1;']
            if n.get('next'): out.append(target(n['next']))
        elif k=='branch':
            for i,r in enumerate(n.get('rules',[])):
                out.append(target(r['next'], condition(r.get('flags',[]),r.get('all',True))))
            if n.get('fallback'): out.append(target(n['fallback']))
            BRANCH_MAP[nid]={'rules':n.get('rules',[]),'fallback':n.get('fallback','')}
        elif k=='random':
            pool=n.get('pool',[]); rv='rnd_'+san(nid)
            out.append(f'setVar:{rv}=random(0,{max(0,len(pool)-1)});')
            for i,r in enumerate(pool): out.append(target(r['next'], f'{rv}=={i}'))
        elif k in ('evidence','plate','compare','explore','notebook'):
            key=n.get('prompt') or n.get('text') or n.get('title')
            out.append(say(n.get('speaker'),key))
            if n.get('next'): out.append(target(n['next']))
        elif k=='ending':
            out += [f'setVar:ending={nid};',f'changeBg:{IMAGE_BG.get(n.get("image"),"bg_gingko.webp")} -next -duration=700;','changeFigure:none -center -next -duration=350;',say(None,n.get('title')),'end;']
    return [x for x in out if x]
def main():
    OUT.mkdir(parents=True,exist_ok=True); choice_flags=[]; all_data={}
    for a in (1,2,3,4):
        data=json.loads((MS/f'content/act{a}.json').read_text(encoding='utf-8')); all_data[a]=data
        body=convert(a,data)
        if a<4: body.append(f'changeScene:act{a+1}.txt;')
        else: body.append('end;')
        (OUT/f'act{a}.txt').write_text('\n'.join(body)+'\n',encoding='utf-8')
        choice_flags += [o['flag'] for n in data if n['type']=='choice' for o in n.get('options',[]) if o.get('flag')]
    (OUT/'start.txt').write_text(':今天吃什么？——校园膳食调查簿;\nchangeBg:bg_gingko.webp -next -duration=500;\nchangeScene:act1.txt;\n',encoding='utf-8')
    (MS/'webgal-game/jump.json').write_text(json.dumps(JUMP_TABLE,ensure_ascii=False,indent=1),encoding='utf-8')
    (MS/'webgal-game/story-meta.json').write_text(json.dumps({'rec':REC_MAP,'branch':BRANCH_MAP,'choiceFlags':sorted(set(choice_flags))},ensure_ascii=False,indent=1),encoding='utf-8')
    print('生成 4 章，跳转',len(JUMP_TABLE),'条，记录',len(REC_MAP),'条')
if __name__=='__main__': main()
