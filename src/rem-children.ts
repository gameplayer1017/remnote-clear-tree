// A newly opened/collapsed Rem can omit its children in the SDK snapshot.
export async function childIds(rem:{children?:string[];getChildrenRem:()=>Promise<{_id:string}[]>}){
 if(rem.children?.length)return rem.children;
 return (await rem.getChildrenRem()).map(child=>child._id);
}
