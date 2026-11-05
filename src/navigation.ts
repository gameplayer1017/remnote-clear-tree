export interface HeadingRecord { id: string; title: string; parentTitle?: string; parentId?:string; preferredParentId?:string; hasChildren: boolean; contentKind?:'body'|'outline'|'unknown' }
export function normalizeHeading(s: string) { return s.normalize('NFKC').replace(/\*\*|__/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase(); }
export function headingNumber(s: string) { return normalizeHeading(s).match(/^(\d+(?:\.\d+)+|[ivxlcdm]+)[.)\s]/i)?.[1] || ''; }
export function matchHeading(source: HeadingRecord, candidates: HeadingRecord[]) {
 const eligible = candidates.filter(c => c.id !== source.id && c.hasChildren);
 let matches = eligible.filter(c => normalizeHeading(c.title) === normalizeHeading(source.title));
 // Same parent section disambiguates repeated heading labels without guessing.
 if (matches.length > 1 && source.parentTitle) {
  const scoped = matches.filter(c => c.parentTitle && normalizeHeading(c.parentTitle) === normalizeHeading(source.parentTitle!));
  if (scoped.length) matches = scoped;
 }
 // Repeated outline headings are not the full body when a substantive candidate exists.
 if(matches.length>1){const body=matches.filter(c=>c.contentKind==='body');if(body.length)matches=body;}
 // A section in Overall Tree corresponds to a body section beside that overview.
 if(matches.length>1&&source.preferredParentId){
  const siblings=matches.filter(c=>c.parentId===source.preferredParentId);
  if(siblings.length)matches=siblings;
 }
 if (matches.length === 1) return { id: matches[0].id, ambiguous: false };
 // Do not use numbering alone: another section may reuse 1.1 with a different title.
 return { id: undefined, ambiguous: matches.length > 1 };
}
