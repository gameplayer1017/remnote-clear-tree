import assert from 'node:assert/strict';
import { layoutTree, demoTree, TreeNode, wrapText } from '../src/model';
import { hostCSS } from '../src/inline-state';
import { readableText,plainTextFallback } from '../src/rich-text';
import {matchHeading} from '../src/navigation';
import { loadTree } from '../src/load-tree';
import {createBranchClicks} from '../src/branch-click';
import {bodyHeadings} from '../src/body-headings';
import {childIds} from '../src/rem-children';
async function main() {
  assert.deepEqual(await childIds({getChildrenRem:async()=>[{_id:'loaded-child'}]}),['loaded-child']);
  assert.deepEqual(await childIds({children:[],getChildrenRem:async()=>[{_id:'loaded-child'}]}),['loaded-child']);
  assert.deepEqual(await childIds({children:['known'],getChildrenRem:async()=>{throw new Error('unneeded');}}),['known']);
  const actions:string[]=[],timers=new Map<number,()=>void>();let timerId=0;
  const clicks=createBranchClicks(id=>actions.push(`toggle:${id}`),id=>actions.push(`open:${id}`),
    run=>{timers.set(++timerId,run);return timerId as any;},timer=>{timers.delete(timer as any);});
  const flush=()=>{const runs=[...timers.values()];timers.clear();runs.forEach(run=>run());};
  clicks.click('section',1);
  assert.deepEqual(actions,[],'First click must not move the label before the second click.');
  clicks.click('section',2);flush();
  assert.deepEqual(actions,['open:section'],'Double click opens once without folding.');
  actions.length=0;clicks.click('section',1);flush();
  assert.deepEqual(actions,['toggle:section']);
  actions.length=0;clicks.click('section',1);clicks.click('section',1);flush();
  assert.deepEqual(actions,['open:section'],'Two clicks also work when the host resets click detail.');
  actions.length=0;clicks.click('a',1);clicks.click('b',1);flush();
  assert.deepEqual(actions,['toggle:a','toggle:b'],'Different branches are not a double click.');
  actions.length=0;clicks.click('section',0);assert.deepEqual(actions,['toggle:section']);
  actions.length=0;clicks.click('section',1);clicks.dispose();flush();assert.deepEqual(actions,[]);
  assert.ok(hostCSS('root-123').includes('[data-rem-container-id="root-123"]'));
  assert.throws(()=>hostCSS('bad"id'));
  assert.ok(!hostCSS('root').includes('display: none'));
  const reject = async () => {throw new Error('richText parameter: Invalid input');};
  assert.equal((await readableText(['bold ',{i:'m',text:'1.1 갑상선호르몬 합성과 조절',b:true,unknownNewField:1}],reject)).text,'bold 1.1 갑상선호르몬 합성과 조절');
  assert.equal((await readableText(null,reject)).text,'');
  assert.equal((await readableText('already plain',reject)).text,'already plain');
  assert.equal(plainTextFallback([{type:'paragraph',children:[{text:'중첩 텍스트'}]},{i:'i',url:'x'}]),'중첩 텍스트[이미지]');
  assert.equal((await readableText([{unsupported:true}],reject)).text,'[텍스트로 표시할 수 없는 항목]');
  const source={id:'overview11',title:'1.1 갑상선호르몬 합성과 조절',parentTitle:'I. Thyroid gland 기능 이상과 염증',hasChildren:false};
  const target={...source,id:'body11',hasChildren:true};
  assert.equal(matchHeading(source,[target]).id,'body11');
  assert.equal(matchHeading(source,[{...target,id:'wrong',title:'1.1 전혀 다른 제목'}]).id,undefined);
  assert.equal(matchHeading(source,[target,{...target,id:'duplicate'}]).ambiguous,true);
  assert.equal(matchHeading(source,[target,{...target,id:'other',parentTitle:'another section'}]).id,'body11');
  assert.equal(matchHeading(source,[{...target,title:'**1.1  갑상선호르몬 합성과 조절**'}]).id,'body11');
  assert.equal(matchHeading(source,[{...target,hasChildren:false}]).id,undefined);
  assert.equal(matchHeading(source,[{...target,contentKind:'outline'},{...target,id:'full-body',contentKind:'body'}]).id,'full-body');
  assert.equal(matchHeading(source,[{...target,contentKind:'body'},{...target,id:'duplicate-body',contentKind:'body'}]).ambiguous,true);
  assert.equal(matchHeading({...source,preferredParentId:'document'},[{...target,id:'body-sibling',parentId:'document'},{...target,id:'nested-repeat',parentId:'summary'}]).id,'body-sibling');
  assert.equal(matchHeading({...source,preferredParentId:'document'},[{...target,parentId:'document'},{...target,id:'duplicate-sibling',parentId:'document'}]).ambiguous,true);
  const section={id:'overview-v',title:'V. 감염성 장염',parentTitle:'Overall Tree',hasChildren:true};
  const headingMap:Record<string,{title:string;children:string[]}>= {
   overview:{title:'Overall Tree',children:['overview-v']},
   summary:{title:'요약',children:['outline-v']},
   'outline-v':{title:section.title,children:['outline51']},
   outline51:{title:'5.1 세균성 장염',children:[]},
   wrapper:{title:'4. 항목별 설명',children:['unrelated','body-v']},
   unrelated:{title:'I. 다른 단원',children:Array.from({length:1600},(_,i)=>'paragraph'+i)},
   'body-v':{title:section.title,children:['body51']},
   body51:{title:'5.1 세균성 장염',children:['body-content']},
   'body-content':{title:'세균성 장염의 본문 내용',children:[]},
  };
  const bodyReader={read:async(id:string)=>headingMap[id]};
  const found=await bodyHeadings(bodyReader,['overview','summary','wrapper'],new Set(['overview']),section,20);
  assert.equal(found.truncated,false,'Paragraphs in earlier chapters must not consume the search budget.');
  assert.equal(matchHeading(section,found.records).id,'body-v','Prefer full body over a repeated outline, including nested wrappers.');
  const leafFound=await bodyHeadings(bodyReader,['overview','summary','wrapper'],new Set(['overview']),{id:'source51',title:'5.1 세균성 장염',parentTitle:section.title,hasChildren:false},20);
  assert.equal(leafFound.truncated,false);
  assert.equal(matchHeading({id:'source51',title:'5.1 세균성 장염',hasChildren:false},leafFound.records).id,'body51');
  assert.equal((await bodyHeadings(bodyReader,['summary','wrapper'],new Set(),section,1)).truncated,true);
  const graph = layoutTree(demoTree, new Set());
  assert.equal(graph.boxes.length, 7); assert.equal(graph.links.length, 6);
  assert.equal(layoutTree(demoTree, new Set(['demo-root'])).boxes.length, 1);
  assert.equal(layoutTree(demoTree, new Set(['sym'])).boxes.length, 5);
  // Long Korean/English text and uneven branches must never share visible space.
  const root: TreeNode = { id:'r', title:'root', children:[] };
  for(let i=0;i<40;i++) root.children.push({id:String(i), title:'긴한글문장'.repeat(i+1)+'LongEnglishWord'.repeat(i+1), children:i%3===0 ? [{id:`leaf${i}`,title:'leaf',children:[]}]:[]});
  const large = layoutTree(root,new Set());
  for(let i=0;i<large.boxes.length;i++) for(let j=i+1;j<large.boxes.length;j++) {
    const a=large.boxes[i],b=large.boxes[j];
    assert.ok(a.x+a.width<=b.x || b.x+b.width<=a.x || a.y+a.height<=b.y || b.y+b.height<=a.y, 'overlap');
  }
  assert.ok(wrapText('가'.repeat(100)).every(s=>s.length<=14));
  assert.equal(wrapText('<script>alert(1)</script>').join(''),'<script>alert(1)</script>');
  const map: Record<string, { title:string; children:string[] }> = { a:{title:'root',children:['b','c','missing']},b:{title:'first',children:['a']},c:{title:'second',children:[]} };
  const reader={read:async(id:string)=>map[id]};
  const normal=await loadTree(reader,'a');
  assert.deepEqual(normal.root.children.map(n=>n.id),['b','c']); assert.equal(normal.warnings.length,2);
  const limited=await loadTree(reader,'a',2); assert.equal(limited.root.children.length,1); assert.ok(limited.warnings.some(w=>w.includes('2개')));
  const shallow=await loadTree(reader,'a',1000,0); assert.equal(shallow.root.children.length,0); assert.equal(shallow.warnings.length,1);
  await assert.rejects(()=>loadTree(reader,'unknown'));
  console.log('PASS: hierarchy order, cycles, missing roots, node/depth limits, collapse, and long-text non-overlap.');
}
module.exports = main();
