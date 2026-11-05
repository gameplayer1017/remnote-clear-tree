import React,{useState} from 'react';
import ReactDOM from 'react-dom';
import {InlineTree} from './InlineTree';
import {TreeNode} from './model';
const leaf=(id:string,title:string):TreeNode=>({id,title,children:[]});
const animal:TreeNode={id:'animal',title:'Animal Cell',children:[
 {id:'membrane',title:'Cell Membrane',children:[{id:'model',title:'Model',children:[leaf('fluid','Fluid Mosaic')]},{id:'components',title:'Components',children:['Phospholipid Bilayer','Embedded Bilayer','Embedded Protein','Cholesterol','Carbohydrates'].map((x,i)=>leaf('mem'+i,x))}]},
 {id:'cell-components',title:'Components',children:[{id:'organelles',title:'Organelles',children:['Nucleus','Rough Endoplasmic Reticulum','Ribosome','Smooth Endoplasmic Reticulum','Golgi body','Vacuole','Lysosome','Mitochondrion'].map((x,i)=>leaf('org'+i,x))},{id:'cytoskeleton',title:'Cytoskeleton',children:['Microtubule','Intermediate fiber','Microfilament'].map((x,i)=>leaf('cyto'+i,x))}]},
 {id:'role',title:'Role',children:['Transportation','Signal Switching'].map((x,i)=>leaf('role'+i,x))},
]};
function List({node}:{node:TreeNode}){return <li>{node.title}{!!node.children.length&&<ul>{node.children.map(c=><List key={c.id} node={c}/>)}</ul>}</li>;}
function Demo(){const[tree,setTree]=useState(true);return <main style={{padding:'24px',maxWidth:1500,fontFamily:'sans-serif'}}><div style={{fontSize:12,color:'#71859a',marginBottom:20}}>Clear Tree 1.0 · 인라인 표시 미리보기</div><button style={{marginBottom:16}} onClick={()=>setTree(!tree)}>{tree?'일반 노트로 전환':'인라인 트리로 전환'}</button><p style={{color:'#71859a',fontSize:13}}>앞쪽의 일반 노트</p>{tree?<InlineTree root={animal}/>:<ul><List node={animal}/></ul>}<p style={{color:'#71859a',fontSize:13}}>뒤쪽의 일반 노트</p></main>;}
ReactDOM.render(<Demo/>,document.getElementById('root'));
