import React,{useEffect,useRef,useState} from 'react';
import {renderWidget,usePlugin,WidgetLocation,RemEvent} from '@remnote/plugin-sdk';
import {InlineTree} from '../InlineTree';
import {loadTree} from '../load-tree';
import {TreeNode} from '../model';
import {readableText} from '../rich-text';
import {HeadingRecord,matchHeading} from '../navigation';
import {bodyHeadings} from '../body-headings';
import {childIds} from '../rem-children';
import {INLINE_POWERUP,InlineState,stateKey,HOST_STYLE_MESSAGE} from '../inline-state';
function InlineWidget(){
 const plugin=usePlugin(),alive=useRef(true),request=useRef(0);
 const[rootId,setRootId]=useState(''),[data,setData]=useState<{root:TreeNode;warnings:string[]}>(),[error,setError]=useState('');
 const idRef=useRef('');
 const setHostStyle=(id:string,active:boolean)=>plugin.messaging.broadcast({type:HOST_STYLE_MESSAGE,id,active});
 async function restore(){
  const id=idRef.current;if(!id)return;
  const rem=await plugin.rem.findOne(id);if(!rem)return;
  const state=await plugin.storage.getLocal<InlineState>(stateKey(id));
  await setHostStyle(id,false);
  await rem.removePowerup(INLINE_POWERUP);
  await rem.expand(state?.portalId,false);
 }
 async function refresh(){
  const ticket=++request.current;
  try{
   const context=await plugin.widget.getWidgetContext<WidgetLocation.UnderRemEditor>();
   const id=context.remId;idRef.current=id;if(alive.current)setRootId(id);
   let fallbackCount=0;
   const result=await loadTree({read:async rid=>{
    const rem=await plugin.rem.findOne(rid);if(!rem)return;
    const front=await readableText(rem.text,v=>plugin.richText.toString(v));
    const rear=await readableText(rem.backText,v=>plugin.richText.toString(v));
    if(front.fallback||rear.fallback)fallbackCount++;
    const title=front.text,back=rear.text;
    return{title:back?`${title}\n→ ${back}`:title,children:await childIds(rem)};
   }},id);
   if(fallbackCount)result.warnings.push(`${fallbackCount}개 항목의 특수 서식을 일반 텍스트로 표시했습니다.`);
   if(alive.current&&ticket===request.current){setData(result);setError('');}
  }catch(e){
   if(alive.current&&ticket===request.current){setError(e instanceof Error?e.message:'불러오지 못했습니다.');if(idRef.current)await setHostStyle(idRef.current,false);}
  }
 }
 async function openNode(id:string){
  try{
   const rem=await plugin.rem.findOne(id);if(!rem)return;
   const sourceTitle=(await readableText(rem.text,v=>plugin.richText.toString(v))).text;
   const parent=rem.parent?await plugin.rem.findOne(rem.parent):undefined;
   const parentTitle=parent?(await readableText(parent.text,v=>plugin.richText.toString(v))).text:'';
   // Find the owning document through parent links. Never search the whole KB.
   let scope=await plugin.rem.findOne(idRef.current),doc=scope;
   const bodyParentId=rem.parent===idRef.current?scope?.parent||undefined:undefined;
   const ancestors=new Set<string>();
   for(let i=0;scope&&i<24;i++){
    if(ancestors.has(scope._id))break;ancestors.add(scope._id);
    doc=scope;if(await scope.isDocument())break;
    if(!scope.parent)break;scope=await plugin.rem.findOne(scope.parent);
   }
   const source:HeadingRecord={id,title:sourceTitle,parentTitle,preferredParentId:bodyParentId,hasChildren:!!(await childIds(rem)).length};
   const {records,truncated}=await bodyHeadings({read:async rid=>{
    const r=await plugin.rem.findOne(rid);if(!r)return;
    return{title:(await readableText(r.text,v=>plugin.richText.toString(v))).text,children:await childIds(r)};
   }},doc&&doc._id!==idRef.current?await childIds(doc):[],new Set([idRef.current]),source,1500,doc?._id);
   const match=matchHeading(source,records);
   if(match.id&&!truncated){
    const target=await plugin.rem.findOne(match.id);
    if(target){await target.expand(undefined,false);await target.openRemAsPage();return;}
   }
   if(truncated)await plugin.app.toast('문서의 제목 검색 한도에 도달해 원래 항목을 엽니다.');
   else if(match.ambiguous)await plugin.app.toast('내용이 있는 본문에 같은 제목이 여러 개 있어 원래 항목을 엽니다.');
   await rem.openRemAsPage();
  }catch{await plugin.app.toast('본문 이동에 실패했습니다. 새로고침 후 다시 시도하세요.');}
 }
 // Keep the real list visible until the replacement has mounted successfully.
 useEffect(()=>{if(!data||!rootId)return;let cancelled=false;
  (async()=>{try{
   const rem=await plugin.rem.findOne(rootId);
   if(!rem||!(await rem.hasPowerup(INLINE_POWERUP))||cancelled)return;
   const state=await plugin.storage.getLocal<InlineState>(stateKey(rootId));
   await rem.collapse(state?.portalId);
   if(cancelled)return;
   await setHostStyle(rootId,true);
  }catch{if(alive.current)setError('인라인 전환에 실패했습니다. 일반 노트로 복구해주세요.');}})();
  return()=>{cancelled=true;};
 },[!!data,rootId]);
 useEffect(()=>{alive.current=true;refresh();return()=>{alive.current=false;request.current++;if(idRef.current)void setHostStyle(idRef.current,false);};},[]);
 // Observe only changes in the loaded branch; debounce edits and cancel listeners on unmount.
 useEffect(()=>{if(!data)return;let timer:ReturnType<typeof setTimeout>|undefined;
  const ids:string[]=[];const walk=(n:TreeNode)=>{ids.push(n.id);n.children.forEach(walk);};walk(data.root);
  const changed=()=>{if(timer)clearTimeout(timer);timer=setTimeout(refresh,350);};
  ids.forEach(id=>plugin.event.addListener(RemEvent.RemChanged,id,changed));
  return()=>{if(timer)clearTimeout(timer);ids.forEach(id=>plugin.event.removeListener(RemEvent.RemChanged,id,changed));};
 },[data?.root]);
 if(error)return <div className="cti-message" role="alert">{error}<button onClick={restore}>일반 노트로 복구</button><button onClick={refresh}>다시 시도</button></div>;
 if(!data)return <div className="cti-message">트리를 불러오는 중…<button onClick={restore}>취소</button></div>;
 return <InlineTree root={data.root} warnings={data.warnings} onOpen={openNode}/>;
}
renderWidget(InlineWidget);
