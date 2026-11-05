// Keep the label in place until a second click can arrive.
export function createBranchClicks(
 toggle:(id:string)=>void,
 open:(id:string)=>void,
 schedule:(run:()=>void)=>ReturnType<typeof setTimeout>=run=>setTimeout(run,200),
 cancel:(timer:ReturnType<typeof setTimeout>)=>void=clearTimeout,
){
 const pending=new Map<string,ReturnType<typeof setTimeout>>();
 function clear(id:string){const timer=pending.get(id);if(timer!==undefined)cancel(timer);pending.delete(id);}
 return {
  click(id:string,detail:number){
   if(detail===0){clear(id);toggle(id);return;} // Keyboard activation has no double click.
   if(detail>2)return;
   if(pending.has(id)||detail===2){clear(id);open(id);return;}
   pending.set(id,schedule(()=>{pending.delete(id);toggle(id);}));
  },
  dispose(){for(const id of pending.keys())clear(id);},
 };
}
