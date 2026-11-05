import React,{useEffect,useRef,useState} from 'react';
import {TreeNode} from './model';
import {createBranchClicks} from './branch-click';
import './inline.css';
export function InlineTree({root,onOpen,warnings=[]}:{root:TreeNode;onOpen?:(id:string)=>void;warnings?:string[]}){
 const[closed,setClosed]=useState<Set<string>>(new Set());
 const openRef=useRef(onOpen);openRef.current=onOpen;
 const[clicks]=useState(()=>createBranchClicks(id=>setClosed(old=>{
  const next=new Set(old);next.has(id)?next.delete(id):next.add(id);return next;
 }),id=>openRef.current?.(id)));
 useEffect(()=>()=>clicks.dispose(),[clicks,root]);
 function branch(n:TreeNode,depth=0):JSX.Element{
  const expandable=n.children.length>0,collapsed=closed.has(n.id);
  return <div className={`cti-node${depth===0?' cti-root':''}`} key={n.id}>
   <div className="cti-label-wrap"><button className="cti-label" title={expandable?'클릭: 가지 접기/펼치기 · 더블 클릭: 원문 열기':'클릭: 같은 문서의 본문 제목으로 이동 (일치 항목이 없으면 원래 항목)' }
    aria-label={`${n.title}${expandable?collapsed?', 펼치기':', 접기':''}`} aria-expanded={expandable?!collapsed:undefined}
    onClick={e=>{if(expandable)clicks.click(n.id,e.detail);else if(e.detail<2)onOpen?.(n.id);}}>{n.title || '(빈 항목)'}{collapsed&&<span className="cti-count"> +{n.children.length}</span>}</button></div>
   {expandable&&!collapsed&&<div className="cti-children">{n.children.map(c=>branch(c,depth+1))}</div>}
  </div>;
 }
 return <section className="cti" aria-label={`${root.title} 인라인 트리`}>
  {warnings.map(w=><div key={w} className="cti-warning">{w}</div>)}
  <div className="cti-scroll" tabIndex={0}>{branch(root)}</div>
 </section>;
}
