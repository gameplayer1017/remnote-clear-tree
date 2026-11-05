import {HeadingRecord,normalizeHeading} from './navigation';
export interface HeadingReader {read:(id:string)=>Promise<{title:string;children:string[]}|undefined>}
const roman=(s:string)=>/^[ivxlcdm]+[.)]\s/i.test(s.trim());
const subsection=(s:string)=>/^\d+\.\d+(?:\.\d+)*(?:\s|[.)])/.test(s.trim());
const overview=(s:string)=>/^(overall\s*tree|전체\s*트리)$/i.test(normalizeHeading(s));
export async function bodyHeadings(reader:HeadingReader,children:string[],excluded:Set<string>,source:HeadingRecord,limit=1500,documentId=''){
 const records:HeadingRecord[]=[],seen=new Set<string>();
 const queue=children.map(id=>({id,depth:0,parentTitle:'',parentId:documentId}));
 const cache=new Map<string,Awaited<ReturnType<HeadingReader['read']>>>();
 async function read(id:string){if(!cache.has(id))cache.set(id,await reader.read(id));return cache.get(id);}
 let scanned=0,truncated=false;
 for(let i=0;i<queue.length;i++){
  const item=queue[i];if(excluded.has(item.id)||seen.has(item.id))continue;
  if(scanned>=limit){truncated=true;break;}
  seen.add(item.id);scanned++;
  const r=await read(item.id);if(!r||overview(r.title))continue;
  const record:HeadingRecord={id:item.id,title:r.title,parentTitle:item.parentTitle,parentId:item.parentId,hasChildren:!!r.children.length};
  records.push(record);
  // Inspect exact candidates only: an outline has headings without body text.
  if(record.hasChildren&&normalizeHeading(r.title)===normalizeHeading(source.title)){
   let examined=0,body=false;
   for(const childId of r.children.slice(0,16)){
    const child=await read(childId);if(!child)continue;
    examined++;
    if(child.title.trim()&&!roman(child.title)&&!subsection(child.title)){body=true;break;}
    for(const detailId of child.children.slice(0,8)){
     const detail=await read(detailId);
     if(detail?.title.trim()&&!roman(detail.title)&&!subsection(detail.title)){body=true;break;}
    }
    if(body)break;
   }
   record.contentKind=body?'body':examined===r.children.length?'outline':'unknown';
  }
  // Search headings breadth first, so a long earlier section cannot exhaust the budget.
  // Numbered subheadings contain paragraphs, not other candidate section headings.
  if(item.depth>=6||subsection(r.title))continue;
  if(roman(r.title)&&(roman(source.title)||
    (subsection(source.title)&&source.parentTitle&&normalizeHeading(source.parentTitle)!==normalizeHeading(r.title))))continue;
  if(r.title.length>180)continue;
  for(const id of r.children)queue.push({id,depth:item.depth+1,parentTitle:r.title,parentId:item.id});
 }
 return {records,truncated};
}
